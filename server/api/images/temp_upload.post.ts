// /server/api/images/temp_upload.post.ts - V3.0 - VERSÃO FINAL ESTÁVEL: Recebe payload único do front-end e usa upload direto do Buffer.
import { defineEventHandler, readMultipartFormData, createError, H3Event } from 'h3';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '~/server/utils/db'; 
import { verifyAuthToken } from '~/server/utils/auth'; 
import { v2 as cloudinary } from 'cloudinary';

// Funções utilitárias
const getUserIdFromEvent = (event: H3Event): number => {
    const payload = verifyAuthToken(event);
    return payload.userId;
};

export default defineEventHandler(async (event) => {
    let userId: number;
    try {
    userId = getUserIdFromEvent(event as H3Event);
    } catch (e) {
    throw e;
    }

    try {
        const formData = await readMultipartFormData(event);

        if (!formData) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request: Nenhum dado de formulário multipart recebido.' });
        }

        // 3. Extrair Variáveis (Adaptado para receber APENAS um arquivo)
        let fileToUploadPart: any | undefined;
        let imageType: string = '';
        let isPrivate: boolean = false;
        let isEdited: boolean = false; // Valor será lido do campo de formulário

        for (const part of formData) {
            const partValue = part.data ? part.data.toString('utf-8') : '';

            // Se for editado (Front-end envia editedFile)
            if (part.name === 'editedFile' && part.filename && part.data) {
                fileToUploadPart = part;
            // Se for original (Front-end envia originalFile)
            } else if (part.name === 'originalFile' && part.filename && part.data) {
                fileToUploadPart = part;
            } else if (part.name === 'type' && part.data) {
                imageType = partValue;
            } else if (part.name === 'isPrivate' && part.data) {
                isPrivate = partValue === 'true';
            } else if (part.name === 'isEdited' && part.data) { 
                // Recebe o flag booleano do front-end
                isEdited = partValue === 'true';
            }
        }

        if (!fileToUploadPart || !imageType) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request: Arquivo de imagem ou tipo faltando.' });
        }
        
        // 4. Upload para Cloudinary (Usando Buffer direto)
        let uploadedUrl: string | null = null;
        let uploadedPublicId: string | null = null;

        const fileToUpload = fileToUploadPart;
        const cloudinarySubFolder = isEdited ? 'edited' : 'original'; 

        const fileUniqueId = uuidv4(); 
        const folderBase = isPrivate ? 'private' : 'public';
        const cloudinaryFolder = `edited_images/${folderBase}/${imageType}`; 
        
        const mimeType = fileToUpload.type || 'image/png'; 

        try {
            // Upload direto do Buffer
            const uploadResult = await cloudinary.uploader.upload(
                fileToUpload.data, 
                {
                    folder: `${cloudinaryFolder}/${cloudinarySubFolder}`, 
                    resource_type: 'image',
                    format: mimeType.split('/')[1] || 'png', 
                }
            );
            
            uploadedUrl = uploadResult.secure_url;
            uploadedPublicId = uploadResult.public_id; 

        } catch (error: any) {
        console.error('Erro no upload para Cloudinary (temp_upload):', error);
        throw createError({ 
               statusCode: 500, 
               statusMessage: `Falha ao fazer upload do arquivo (${mimeType}) para o Cloudinary.`, 
               data: { details: error.message } 
           });
        }

        if (!uploadedUrl || !uploadedPublicId) {
        throw createError({ statusCode: 500, statusMessage: 'Upload do Cloudinary falhou.' });
        }

        // 5. Persistência na tabela 'edited_files'
        const fileTypeInt = imageType === 'photo' ? 1 : 2;

        await prisma.edited_files.create({ 
        data: {
         file_id: fileUniqueId,
         cloudinary_public_id: uploadedPublicId, 
         file_url: uploadedUrl, 
         is_edited: isEdited, 
         is_private: isPrivate,
         file_type: fileTypeInt,
        },
        });

        // 6. Retorno para o frontend
        return {
        fileId: fileUniqueId, 
        type: imageType,
        };

    } catch (error: any) {
        console.error('Erro CRÍTICO no POST /images/temp_upload:', error);
        if (error.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro interno fatal no processamento da imagem.',
            data: { details: error.message || 'Erro desconhecido.' }
        });
    }
});