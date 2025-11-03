// /server/api/images/presign_upload.get.ts - V1.0 - Gera uma assinatura para upload direto de arquivos grandes para o Cloudinary, contornando o limite de 800KB do servidor.

import { defineEventHandler, createError, H3Event, getQuery } from 'h3';
import { v2 as cloudinary } from 'cloudinary';
import { verifyAuthToken } from '~/server/utils/auth';

// 🚨 CORREÇÃO 1: Força a configuração da instância do Cloudinary para garantir que a assinatura seja gerada corretamente.
cloudinary.config({
cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
api_key: process.env.CLOUDINARY_API_KEY,
api_secret: process.env.CLOUDINARY_API_SECRET,
secure: true,
});

// Função real para extrair o userId (assumindo que existe)
const getUserIdFromEvent = (event: H3Event): number => {
 // verifyAuthToken lança 401 se o token for inválido/ausente.
 const payload = verifyAuthToken(event);
 return payload.userId;
};

export default defineEventHandler(async (event) => {
  try {
    // 1. Autenticação: Garantir que apenas usuários autenticados possam solicitar assinaturas
    const userId = getUserIdFromEvent(event as H3Event);
    
    // 2. Extrair metadados para a pasta de upload
    const query = getQuery(event);
    const imageType = query.type as string; // 'photo' ou 'video'
    const isPrivate = query.isPrivate === 'true';
    const isEdited = query.isEdited === 'true'; // Se o cliente está enviando uma imagem já editada
    
    if (!imageType) {
     throw createError({ statusCode: 400, statusMessage: 'Bad Request: O parâmetro "type" é obrigatório.' });
    }

    // 3. Construir a pasta de destino (igual ao temp_upload)
    const folderBase = isPrivate ? 'private' : 'public';
    const cloudinaryFolder = `edited_images/${folderBase}/${imageType}`;
    const cloudinarySubFolder = isEdited ? 'edited' : 'original';
        
    // 4. Parâmetros de Upload para a assinatura
    // O 'public_id' será gerado no cliente ou o Cloudinary gera um ID.
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign: Record<string, any> = {
      timestamp: timestamp,
      folder: `${cloudinaryFolder}/${cloudinarySubFolder}`,
      // Tags para rastrear o usuário e contexto
      tags: [`user-${userId}`, imageType, isEdited ? 'edited' : 'original'],
    };
    
    // 5. Gerar a Assinatura de Segurança
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign, 
      process.env.CLOUDINARY_API_SECRET as string 
    );

    // 6. Retornar os parâmetros que o cliente usará para o upload direto
    return {
      signature: signature,
      timestamp: timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder: paramsToSign.folder,
      tags: paramsToSign.tags,
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, // Endpoint para o cliente
    };

  } catch (error: any) {
    console.error('Erro ao gerar assinatura do Cloudinary:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao gerar a assinatura de upload.',
      data: { details: error.message || 'Erro desconhecido.' }
    });
  }
});