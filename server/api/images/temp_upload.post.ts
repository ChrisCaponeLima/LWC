// /server/api/images/temp_upload.post.ts - V2.9 - Corrigido: Estabilização da conversão para Data URI, garantindo que o MIME type seja sempre válido.

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

// 💡 MELHOR TRATAMENTO DE TYPE: Garantimos que o MIME type é fornecido.
// O H3/Nitro geralmente retorna o Buffer/Uint8Array. Usamos Buffer.from para aceitar ambos.
function bufferToDataURI(buffer: Buffer, mimetype: string): string {
    const finalMimeType = mimetype || 'image/png'; // Default seguro, pois o frontend envia PNG ou JPEG
    const base64Data = Buffer.from(buffer).toString('base64');
    return `data:${finalMimeType};base64,${base64Data}`;
}

export default defineEventHandler(async (event) => {
    let userId: number;
    try {
    userId = getUserIdFromEvent(event as H3Event);
    } catch (e) {
    throw e;
    }

    // O erro 500 PODE estar aqui: readMultipartFormData.
    const formData = await readMultipartFormData(event);

    if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: Nenhum dado de formulário multipart recebido.' });
    }

    // 3. Extrair Variáveis
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

    // Validação: Se é editado, editedFilePart é obrigatório.
    if (isEdited && !editedFilePart) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: editedFile é obrigatório quando isEdited é true.' });
    }

    // 4. Upload para Cloudinary e Persistência em edited_files
    let uploadedUrl: string | null = null;
    let uploadedPublicId: string | null = null;

    // 🚨 ARQUIVO A SER SALVO NO CLOUDINARY
    const fileToUpload = isEdited ? editedFilePart : originalFilePart;
    const cloudinarySubFolder = isEdited ? 'edited' : 'original'; 

    const fileUniqueId = uuidv4(); 
    const folderBase = isPrivate ? 'private' : 'public';
    const cloudinaryFolder = `edited_images/${folderBase}/${imageType}`; 
    
    // Garantimos que o MIME type é inferido ou o default (image/png)
    const mimeType = fileToUpload.type || 'image/png'; 

    try {
    // Upload do Arquivo
    // Usamos o MIME type que o H3 nos forneceu, ou o default
    const dataUri = bufferToDataURI(fileToUpload.data, mimeType);
    
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: `${cloudinaryFolder}/${cloudinarySubFolder}`, 
    resource_type: 'image',
    });
    uploadedUrl = uploadResult.secure_url;
    uploadedPublicId = uploadResult.public_id; 

    } catch (error: any) {
    console.error('Erro no upload para Cloudinary (temp_upload):', error);
    // Se o erro for um 500 no Vercel, o Data URI provavelmente é inválido ou muito grande.
    // Incluir o tipo de arquivo pode ajudar no debug, se o Vercel mostrar o erro.
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

    try {
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
    console.log(`[PRISMA] Registro temporário (EDITADO: ${isEdited}) inserido na tabela "edited_files" para file_id: ${fileUniqueId}`);

    // 6. Retorno para o frontend
    return {
    fileId: fileUniqueId, 
    type: imageType,
    };

    } catch (prismaError: any) {
    console.error('Erro CRÍTICO no Prisma (POST /images/temp_upload):', prismaError);
    throw createError({
    statusCode: 500,
    statusMessage: 'Falha na persistência da imagem temporária.',
    data: { details: 'Falha na inserção no DB. Verifique o console do servidor.' }
    });
    }
});