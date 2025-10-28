// /server/api/images/temp_upload.post.ts - V2.13 - CORREÇÃO CRÍTICA: Upload direto do Buffer para o Cloudinary, eliminando a conversão instável para Base64.
import { defineEventHandler, readMultipartFormData, createError, H3Event } from 'h3';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '~/server/utils/db'; 
import { verifyAuthToken } from '~/server/utils/auth'; 
import { v2 as cloudinary } from 'cloudinary';
// Nenhuma importação de Buffer é necessária; o Cloudinary processa o Buffer retornado pelo H3.

// Funções utilitárias
const getUserIdFromEvent = (event: H3Event): number => {
    const payload = verifyAuthToken(event);
    return payload.userId;
};

// ❌ REMOVEMOS A FUNÇÃO bufferToDataURI INSTÁVEL.

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

        // 3. Extrair Variáveis (Lógica de Negócio INALTERADA)
        let editedFilePart: any | undefined; 
        let originalFilePart: any | undefined;
        let imageType: string = '';
        let isPrivate: boolean = false;
        let isEdited: boolean = false; 

        for (const part of formData) {
        const partValue = part.data ? part.data.toString('utf-8') : '';

        if (part.name === 'editedFile' && part.filename && part.data) {
        editedFilePart = part;
        } else if (part.name === 'originalFile' && part.filename && part.data) {
        originalFilePart = part;
        } else if (part.name === 'type' && part.data) {
        imageType = partValue;
        } else if (part.name === 'isPrivate' && part.data) {
        isPrivate = partValue === 'true';
        } else if (part.name === 'isEdited' && part.data) { 
        isEdited = partValue === 'true';
        }
        }

        if (!originalFilePart || !imageType) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request: Campos essenciais (originalFile, type) estão faltando.' });
        }

        if (isEdited && !editedFilePart) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request: editedFile é obrigatório quando isEdited é true.' });
        }

        // 4. Upload para Cloudinary e Persistência em edited_files
        let uploadedUrl: string | null = null;
        let uploadedPublicId: string | null = null;

        const fileToUpload = isEdited ? editedFilePart : originalFilePart;
        const cloudinarySubFolder = isEdited ? 'edited' : 'original'; 

        const fileUniqueId = uuidv4(); 
        const folderBase = isPrivate ? 'private' : 'public';
        const cloudinaryFolder = `edited_images/${folderBase}/${imageType}`; 
        
        const mimeType = fileToUpload.type || 'image/png'; 

        try {
            // 💡 A ÚNICA ALTERAÇÃO CRÍTICA: Passamos o Buffer diretamente para o Cloudinary.
            // O Cloudinary (v2) aceita o Buffer/Uint8Array do H3/Nitro diretamente.
            // Isso ignora a conversão instável para Base64 no runtime.
            const uploadResult = await cloudinary.uploader.upload(
                fileToUpload.data, // Passa o Buffer/Uint8Array diretamente
                {
                    folder: `${cloudinaryFolder}/${cloudinarySubFolder}`, 
                    resource_type: 'image',
                    // Adiciona o MIME type para ajudar o Cloudinary a processar
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

        // 5. Persistência na tabela 'edited_files' (Lógica de Negócio INALTERADA)
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