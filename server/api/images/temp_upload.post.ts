// /server/api/images/temp_upload.post.ts - V2.5 - Substitui readMultipartFormData por utilitário Busboy (V1.0) para corrigir o Erro 413.

import { defineEventHandler, createError, H3Event } from 'h3';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '~/server/utils/db'; 
import { verifyAuthToken } from '~/server/utils/auth'; 
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream'; 
import { Buffer } from 'node:buffer'; 
// 🚨 NOVO: Importa o utilitário customizado para parsing
import { readCustomMultipartFormData } from '~/server/utils/multipart_parser'; 

// 🚨 CORREÇÃO 1: Força a configuração da instância do Cloudinary para resolver 'Must supply api_key'.
cloudinary.config({
cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
api_key: process.env.CLOUDINARY_API_KEY,
api_secret: process.env.CLOUDINARY_API_SECRET,
secure: true,
});

// Funções utilitárias
const getUserIdFromEvent = (event: H3Event): number => {
  const payload = verifyAuthToken(event);
  return payload.userId;
};

// 🚨 REMOÇÃO: A função 'bufferToDataURI' foi removida por ser ineficiente e não será mais utilizada.

export default defineEventHandler(async (event) => {
  let userId: number;
  try {
  userId = getUserIdFromEvent(event as H3Event);
  } catch (e) {
  throw e;
  }

  try {
    // 🚨 ALTERAÇÃO CRÍTICA: Substitui readMultipartFormData pelo utilitário customizado (Busboy)
    const parsedData = await readCustomMultipartFormData(event);

    if (!parsedData) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: Nenhum dado de formulário multipart recebido.' });
    }

    // 3. Extrair Variáveis dos campos e arquivos (NOVA LÓGICA DE EXTRAÇÃO)
    // O arquivo 'editedFilePart' e 'originalFilePart' agora possuem as propriedades 'data' e 'type'
    const editedFilePart = parsedData.files.find(f => f.name === 'editedFile');
    const originalFilePart = parsedData.files.find(f => f.name === 'originalFile');
        
    // Campos simples vêm do objeto fields
    const imageType: string = parsedData.fields.type || '';
    const isPrivate: boolean = parsedData.fields.isPrivate === 'true';
    const isEdited: boolean = parsedData.fields.isEdited === 'true'; 

    if (!originalFilePart || !imageType) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: Campos essenciais (originalFile, type) estão faltando.' });
    }

    if (isEdited && !editedFilePart) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: editedFile é obrigatório quando isEdited é true.' });
    }

    // 4. Upload para Cloudinary e Persistência em edited_files
    let uploadedUrl: string | null = null;
    let uploadedPublicId: string | null = null;

    // A variável 'fileToUpload' deve ser o 'part' (que contém o 'data' Buffer)
    const fileToUpload = isEdited ? editedFilePart : originalFilePart;
    const cloudinarySubFolder = isEdited ? 'edited' : 'original'; 

    const fileUniqueId = uuidv4(); 
    const folderBase = isPrivate ? 'private' : 'public';
    const cloudinaryFolder = `edited_images/${folderBase}/${imageType}`; 

    try {
      // 🚨 CORREÇÃO CRÍTICA: Upload do Buffer usando stream (mais eficiente em memória)
            // Cria uma Promise para envolver a função de stream do Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({
                    folder: `${cloudinaryFolder}/${cloudinarySubFolder}`, 
                    resource_type: 'image',
                    // Sugestão de nome do arquivo no Cloudinary
                    public_id: fileUniqueId, 
                }, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });

                // Cria um stream legível a partir do Buffer e o envia para o stream do Cloudinary
                const readableStream = new Readable();
                readableStream.push(fileToUpload.data); // Envia o Buffer completo
                readableStream.push(null); // Sinaliza o fim do stream
                
                readableStream.pipe(stream);
            });
            
            const result = uploadResult as { secure_url: string, public_id: string };

      uploadedUrl = result.secure_url;
      uploadedPublicId = result.public_id; // Usa o public_id retornado pelo Cloudinary (ou o que definimos)

    } catch (error: any) {
    console.error('Erro no upload para Cloudinary (temp_upload - STREAM):', error);
    throw createError({ statusCode: 500, statusMessage: 'Falha ao fazer upload do arquivo para o Cloudinary.', data: { details: error.message } });
    }

    if (!uploadedUrl || !uploadedPublicId) {
    throw createError({ statusCode: 500, statusMessage: 'Upload do Cloudinary falhou.' });
    }

    // 5. Persistência na tabela 'edited_files' (TEMPORÁRIA)
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
  } catch (error: any) {
    // Captura o erro 500 que ocorre antes do processamento principal (parsing do formData)
    console.error('Erro CRÍTICO no POST /images/temp_upload (Global Catch):', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno fatal no processamento da imagem.',
      data: { details: error.message || 'Erro desconhecido.' }
    });
  }
});