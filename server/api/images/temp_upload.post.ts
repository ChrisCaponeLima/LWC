// /server/api/images/temp_upload.post.ts - V3.1 - Última tentativa: Reintroduz o método Base64 ESTÁVEL do seu utilitário, com Buffer.from e tipagem explícita.
import { defineEventHandler, readMultipartFormData, createError, H3Event } from 'h3';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '~/server/utils/db'; 
import { verifyAuthToken } from '~/server/utils/auth'; 
import { v2 as cloudinary } from 'cloudinary';
import { Buffer } from 'node:buffer'; // Reintroduz a importação explícita.

// 💡 Função funcional do seu utilitário Cloudinary.ts, replicada aqui para isolamento.
function bufferToDataURI(buffer: Buffer, mimetype: string): string {
    // 🚨 Usamos Buffer.from(buffer) para garantir que o objeto seja tratado como um Buffer Node.js válido,
    // mesmo que o H3 o retorne como Uint8Array ou outro tipo similar.
   return `data:${mimetype};base64,${Buffer.from(buffer).toString('base64')}`
}

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

        // 3. Extração (Payload Único - Requer V2.27 do Front-end)
        let fileToUploadPart: any | undefined;
        let imageType: string = '';
        let isPrivate: boolean = false;
        let isEdited: boolean = false; 

        for (const part of formData) {
            const partValue = part.data ? part.data.toString('utf-8') : '';

            if (part.name === 'editedFile' && part.filename && part.data) {
                fileToUploadPart = part;
            } else if (part.name === 'originalFile' && part.filename && part.data) {
                fileToUploadPart = part;
            } else if (part.name === 'type' && part.data) {
                imageType = partValue;
            } else if (part.name === 'isPrivate' && part.data) {
                isPrivate = partValue === 'true';
            } else if (part.name === 'isEdited' && part.data) { 
                isEdited = partValue === 'true';
            }
        }

        if (!fileToUploadPart || !imageType) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request: Arquivo de imagem ou tipo faltando.' });
        }
        
        // 4. Upload para Cloudinary (Revertendo para o Base64 com Buffer.from)
        let uploadedUrl: string | null = null;
        let uploadedPublicId: string | null = null;

        const fileToUpload = fileToUploadPart;
        const cloudinarySubFolder = isEdited ? 'edited' : 'original'; 

        const fileUniqueId = uuidv4(); 
        const folderBase = isPrivate ? 'private' : 'public';
        const cloudinaryFolder = `edited_images/${folderBase}/${imageType}`; 
        
        const mimeType = fileToUpload.type || 'image/png'; 

        try {
            // 🚨 Revertendo para Base64, mas usando a forma mais segura:
            const dataUri = bufferToDataURI(fileToUpload.data as Buffer, mimeType);
            
            const uploadResult = await cloudinary.uploader.upload(
                dataUri, 
                {
                    folder: `${cloudinaryFolder}/${cloudinarySubFolder}`, 
                    resource_type: 'image',
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