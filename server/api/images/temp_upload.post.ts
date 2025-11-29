// /server/api/images/temp_upload.post.ts - V2.7 - IMPLEMENTAÇÃO CRÍTICA DA COMPRESSÃO (SHARP) para reduzir o tamanho do Buffer do arquivo e evitar o erro 413, antes do upload por stream.

import { defineEventHandler, createError, getRequestHeader, H3Event } from 'h3';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '~/server/utils/db'; 
import { verifyAuthToken } from '~/server/utils/auth'; 
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream'; 
import { Buffer } from 'node:buffer'; 
import { readCustomMultipartFormData } from '~/server/utils/multipart_parser'; 
import sharp from 'sharp'; // 🟢 NOVO: Importa a biblioteca de processamento de imagem

// 🚨 Define o limite de payload em bytes (4.5 MB)
const MAX_FILE_SIZE = 4718592; 

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
  // 🚨 REFORÇO CONTRA 413: Verificar Content-Length antes de iniciar o parsing
  const contentLengthHeader = getRequestHeader(event, 'content-length');
  if (contentLengthHeader) {
    const payloadSize = parseInt(contentLengthHeader, 10);
    
    console.log(`[CONTENT-LENGTH CHECK] Payload Size: ${payloadSize} bytes.`);

    if (payloadSize > MAX_FILE_SIZE) {
      console.warn(`[CONTENT-LENGTH CHECK] Rejeitado: ${payloadSize} bytes excede o limite de ${MAX_FILE_SIZE} bytes.`);
      throw createError({
        statusCode: 413,
        statusMessage: `Payload Too Large: O tamanho do arquivo (${(payloadSize/1024/1024).toFixed(2)}MB) excede 4.5MB.`,
      });
    }
  }
    
  let userId: number;
  try {
  userId = getUserIdFromEvent(event as H3Event);
  } catch (e) {
  throw e;
  }

  try {
    // 🚨 ALTERAÇÃO CRÍTICA: Uso do utilitário Busboy com reforço de limite interno
    const parsedData = await readCustomMultipartFormData(event);

    if (!parsedData) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: Nenhum dado de formulário multipart recebido.' });
    }

    // 3. Extrair Variáveis dos campos e arquivos 
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

    const fileToUpload = isEdited ? editedFilePart : originalFilePart;
    const cloudinarySubFolder = isEdited ? 'edited' : 'original'; 

    const fileUniqueId = uuidv4(); 
    const folderBase = isPrivate ? 'private' : 'public';
    const cloudinaryFolder = `edited_images/${folderBase}/${imageType}`; 

    // 🚨 NOVO: Variável para armazenar o Buffer COMPRIMIDO
    let compressedBuffer: Buffer;
    
    try {
        // 🟢 ETAPA CRÍTICA: COMPRESSÃO E REDIMENSIONAMENTO USANDO SHARP
        // Redimensiona para um tamanho máximo razoável (ex: 2000px na largura) e comprime a qualidade (ex: 80)
        compressedBuffer = await sharp(fileToUpload.data)
            .resize({ width: 2000, withoutEnlargement: true, fit: 'inside' }) // Redimensiona para no máximo 2000px de largura
            .jpeg({ quality: 80, progressive: true }) // Comprime como JPEG com qualidade 80
            .toBuffer();
            
        console.log(`[SHARP] Arquivo de ${fileToUpload.data.length} bytes reduzido para ${compressedBuffer.length} bytes.`);

    } catch (sharpError: any) {
        console.error('Erro no processamento da imagem (SHARP):', sharpError);
        throw createError({ statusCode: 500, statusMessage: 'Falha ao processar a imagem para upload.', data: { details: sharpError.message } });
    }


    try {
      // Upload do Buffer COMPRIMIDO usando stream
      const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({
                    folder: `${cloudinaryFolder}/${cloudinarySubFolder}`, 
                    resource_type: 'image',
                    public_id: fileUniqueId, 
                }, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });

                const readableStream = new Readable();
                // 🚨 ALTERAÇÃO: Usa o Buffer COMPRIMIDO
                readableStream.push(compressedBuffer); 
                readableStream.push(null); 
                
                readableStream.pipe(stream);
            });
            
            const result = uploadResult as { secure_url: string, public_id: string };

      uploadedUrl = result.secure_url;
      uploadedPublicId = result.public_id; 

    } catch (error: any) {
    console.error('Erro no upload para Cloudinary (temp_upload - STREAM):', error);
    throw createError({ statusCode: 500, statusMessage: 'Falha ao fazer upload do arquivo para o Cloudinary.', data: { details: error.message } });
    }

    if (!uploadedUrl || !uploadedPublicId) {
    throw createError({ statusCode: 500, statusMessage: 'Upload do Cloudinary falhou.' });
    } // ⬅️ O PONTO E VÍRGULA/FECHAMENTO DEVE ESTAR CORRETO AQUI.

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
    console.error('Erro CRÍTICO no POST /images/temp_upload (Global Catch):', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno fatal no processamento da imagem.',
      data: { details: error.message || 'Erro desconhecido.' }
    });
  }
});