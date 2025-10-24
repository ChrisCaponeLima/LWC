// /server/api/images/cleanup_temp.delete.ts - V1.0 - Endpoint para limpar arquivos temporários na tabela edited_files e no Cloudinary.

import { defineEventHandler, createError, readBody } from 'h3';
import { prisma } from '~/server/utils/db';
import { v2 as cloudinary } from 'cloudinary';

// Interface para o corpo da requisição DELETE
interface CleanupPayload {
    tempFileIds: string[]; // Lista de file_id (UUIDs)
}

export default defineEventHandler(async (event) => {
    if (event.method !== 'DELETE') {
        throw createError({ statusCode: 405, statusMessage: 'Método não permitido.' });
    }

    // Leitura segura do body
    const body = await readBody<CleanupPayload>(event);
    const tempFileIds = body.tempFileIds || [];

    if (tempFileIds.length === 0) {
        return { message: 'Nenhum ID temporário fornecido para limpeza.' };
    }

    // 1. Encontrar os registros no DB para obter os public_ids do Cloudinary
    try {
        const filesToCleanup = await prisma.editedFiles.findMany({
            where: {
                file_id: { in: tempFileIds }
            },
            // Acessando o campo que contém o ID necessário
            select: {
                file_id: true,
                cloudinary_public_id: true
            }
        });

        if (filesToCleanup.length === 0) {
            console.warn('[CLEANUP] Nenhum registro de edited_files encontrado para os IDs fornecidos.');
            return { message: 'Arquivos temporários não encontrados no DB.' };
        }

        const publicIdsToDelete = filesToCleanup.map(f => f.cloudinary_public_id);
        const fileIdsInDb = filesToCleanup.map(f => f.file_id);

        console.log(`[CLEANUP] Iniciando a limpeza: ${publicIdsToDelete.length} arquivos no Cloudinary e ${fileIdsInDb.length} registros no DB.`);

        // 2. Excluir os arquivos no Cloudinary
        // O Cloudinary apaga todos os arquivos associados a esses public_ids.
        await cloudinary.api.delete_resources(publicIdsToDelete, { 
            resource_type: 'image',
            invalidate: true // Invalida o cache CDN para essas URLs
        });
        
        // 3. Excluir os registros na tabela edited_files
        const deleteResult = await prisma.editedFiles.deleteMany({
            where: {
                file_id: { in: fileIdsInDb }
            }
        });

        console.log(`[CLEANUP] Sucesso: ${deleteResult.count} registros do DB excluídos.`);

        return { 
            message: `Limpeza concluída. ${deleteResult.count} registros do DB e ${publicIdsToDelete.length} arquivos do Cloudinary excluídos.`,
            deletedCount: deleteResult.count
        };

    } catch (error: any) {
        console.error('Erro CRÍTICO na limpeza de arquivos temporários:', error);
        // Não lançamos 500, pois a ação principal (cancelar) deve prosseguir.
        throw createError({ statusCode: 500, statusMessage: 'Falha na limpeza dos arquivos temporários.' });
    }
});