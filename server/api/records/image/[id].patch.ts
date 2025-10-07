// /server/api/records/image/[id].patch.ts - V1.1 - Uso correto do userId e filtro na relação.

import { defineEventHandler, getQuery, readBody } from 'h3';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '~/server/utils/auth'; 

const prisma = new PrismaClient();

const FileTypeMap = {
    registro: 1,
    forma: 2,
};

export default defineEventHandler(async (event) => {
    // 1. AUTENTICAÇÃO E PARÂMETROS
    const userData = verifyAuthToken(event); 
    const userId = userData.userId; // 🚨 ATENÇÃO: Se seu payload usa 'id', mude para userData.id

    const recordId = parseInt(event.context.params?.id as string);
    const query = getQuery(event);
    const photoType = query.type as 'registro' | 'forma' | undefined; 
    const fileTypeId = FileTypeMap[photoType]; 

    const body = await readBody(event);
    const isPrivateNew = body.isPrivate; 

    if (isNaN(recordId) || !photoType || !fileTypeId || typeof isPrivateNew !== 'boolean') {
        throw createError({ statusCode: 400, message: 'Dados de requisição incompletos ou inválidos.' });
    }

    const isPrivateDb = isPrivateNew ? 1 : 0; 

    try {
        // 2. BUSCA E ATUALIZAÇÃO NO PRISMA
        const updatedFile = await prisma.files.updateMany({
            where: {
                record_id: recordId,
                file_type: fileTypeId,
                // 🚀 FILTRO CRÍTICO DE AUTORIZAÇÃO USANDO O RELACIONAMENTO
                records: { user_id: userId } 
            },
            data: {
                is_private: isPrivateDb,
                updated_at: new Date(),
            },
        });

        if (updatedFile.count === 0) {
            throw createError({ 
                statusCode: 404, 
                message: 'Arquivo não encontrado, acesso negado (userId) ou nenhum dado modificado.' 
            });
        }

        return { success: true, message: 'Metadados da imagem atualizados com sucesso.', count: updatedFile.count };

    } catch (error) {
        console.error('Erro na API PATCH de imagem:', error);
        if (error.statusCode) throw error; 
        throw createError({ statusCode: 500, message: 'Falha interna ao atualizar metadados da imagem.' });
    }
});