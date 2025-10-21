// /server/utils/cloudinary_temp.ts - V1.0 - Utilitário para upload de arquivos temporários para o Cloudinary.

import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { createError } from 'h3';

// Define o diretório temporário do sistema operacional (DEVE CORRESPONDER À ROTA pre_upload.post.ts)
const TMP_DIR = path.join(os.tmpdir(), 'nuxt_uploads'); 

// ⚠️ NOTA: As credenciais do Cloudinary devem ser lidas das variáveis de ambiente ou de um runtimeConfig privado.
// Assumindo que o Cloudinary está configurado globalmente ou importado corretamente.
// Exemplo de Configuração (geralmente feita em outro arquivo de setup, mas incluída aqui para contexto):
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });

/**
 * Lê o arquivo temporário do disco, faz o upload para o Cloudinary e o exclui.
 * * @param tempFileId O UUID do arquivo temporário.
 * @param uploadFolder O subdiretório no Cloudinary (ex: 'record_photos').
 * @returns A URL segura do arquivo no Cloudinary.
 */
export async function uploadTempFileToCloudinary(
    tempFileId: string, 
    uploadFolder: string
): Promise<string> {
    
    // Assumimos a extensão .png, pois o frontend o envia como 'edited.png' e o pre_upload o salva como tal.
    const tempFilePath = path.join(TMP_DIR, `${tempFileId}.png`);
    
    try {
        // 1. Verificar e ler o arquivo do disco
        await fs.access(tempFilePath); // Lança erro se o arquivo não existir

        // 2. Upload para o Cloudinary
        // Usa a função de upload do Cloudinary diretamente com o caminho local do arquivo.
        const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
            folder: uploadFolder, // 'record_photos' ou 'record_forma'
            resource_type: 'image',
            // Opcional: define um public_id para fácil rastreamento
            public_id: `${tempFileId}`,
            overwrite: true,
        });

        // 3. Excluir o arquivo temporário após o upload bem-sucedido
        await fs.unlink(tempFilePath);
        console.log(`[CLOUDINARY] Arquivo temporário ${tempFileId} excluído.`);
        
        return uploadResult.secure_url;

    } catch (error: any) {
        // Tenta excluir o arquivo, mesmo que o upload tenha falhado, se ele existir
        try {
            await fs.unlink(tempFilePath);
        } catch (unlinkError) {
            // Ignora se a exclusão falhar, mas loga
            console.warn(`[CLOUDINARY] Falha ao excluir o arquivo temporário: ${tempFileId}.`);
        }
        
        console.error('[CLOUDINARY] Erro ao processar arquivo temporário:', error);
        throw createError({ 
            statusCode: 500, 
            statusMessage: 'Falha no upload para o Cloudinary.',
            data: { details: error.message || 'Erro desconhecido durante a transferência de arquivo.' }
        });
    }
}