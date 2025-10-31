// /server/api/images/permanent_save.post.ts - V5.4 - Substitui readMultipartFormData por utilitário Busboy (V1.0) para corrigir o Erro 413.

import { defineEventHandler, createError, getRequestHeader, H3Event } from 'h3';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '~/server/utils/db'; 
import { uploadToCloudinary } from '~/server/utils/cloudinary'; 
import { verifyAuthToken } from '~/server/utils/auth'; 
// 🚨 ALTERAÇÃO CRÍTICA: Substitui a importação do H3 readMultipartFormData
import { readCustomMultipartFormData } from '~/server/utils/multipart_parser'; 

// Função real para extrair o userId
const getUserIdFromEvent = (event: H3Event): number => {
 // verifyAuthToken lança 401 se o token for inválido/ausente.
 const payload = verifyAuthToken(event);
 return payload.userId;
};

export default defineEventHandler(async (event) => {
 // 1. Autenticação e Extração do user_id (LÓGICA REAL)
 let userId: number;
 try {
  userId = getUserIdFromEvent(event as H3Event);
 } catch (e) {
  // Relança o erro 401 vindo de verifyAuthToken.
  throw e;
 }
 
 // 2. Processar o FormData multipart
 // 🚨 ALTERAÇÃO CRÍTICA: Substitui readMultipartFormData pelo utilitário customizado (Busboy) para respeitar o limite de 4.5MB.
 const parsedData = await readCustomMultipartFormData(event);

 if (!parsedData) {
  throw createError({
   statusCode: 400,
   statusMessage: 'Bad Request: Nenhum dado de formulário multipart recebido.',
  });
 }

 // 3. Extrair e Padronizar Variáveis (camelCase)
 // Os arquivos agora vêm de parsedData.files, e os campos simples de parsedData.fields.
 let editedFilePart: any | undefined = parsedData.files.find(f => f.name === 'editedFile');
 let originalFilePart: any | undefined = parsedData.files.find(f => f.name === 'originalFile');
 // Os campos simples (type, isPrivate, etc.) vêm do objeto fields
 let imageType: string = parsedData.fields.type || '';
 let isPrivate: boolean = parsedData.fields.isPrivate === 'true';
 let isEdited: boolean = parsedData.fields.isEdited === 'true'; 
 let forceSave: boolean = parsedData.fields.forceSave === 'true'; 
 
  // 🚨 Regra de Negócio Crítica (MANTIDA)
  // Abortar se: (NÃO HOUVE EDIÇÃO) E (NÃO HÁ PEDIDO PARA FORÇAR SALVAMENTO)
  if (isEdited === false && forceSave === false) {
    console.log(`[PERMANENT_SAVE] Imagem não editada (isEdited: false) e forceSave: false. Abortando salvamento Cloudinary/DB para o usuário ${userId}.`);
  
    throw createError({
   statusCode: 409, // 409 Conflict: A requisição não pôde ser completada devido a uma regra de negócio.
   statusMessage: 'Conflict: A imagem não foi modificada/editada. O salvamento temporário foi abortado.',
      data: { details: 'A imagem deve ter efeitos aplicados (tarja/blur/crop) para salvar edições, a menos que o salvamento seja forçado (fluxo de download).' }
  });
 }


 // 4. Validação
 if (!editedFilePart || !originalFilePart || !imageType) {
  throw createError({
   statusCode: 400,
   statusMessage: 'Bad Request: Campos essenciais (editedFile, originalFile, type) estão faltando ou vazios.',
  });
 }

 // 5. Upload para Cloudinary
 let editedUrl: string | null = null;
 let originalUrl: string | null = null;
 const folderBase = isPrivate ? 'private' : 'public';
 const fileUniqueId = uuidv4(); 
 const cloudinaryFolder = `edited_images/${folderBase}/${imageType}`; 

 try {
  // Nota: uploadToCloudinary já foi refatorado para usar stream e Buffer, 
  // e os objetos editedFilePart/originalFilePart do Busboy são compatíveis.
  editedUrl = await uploadToCloudinary(editedFilePart, `${cloudinaryFolder}/edited`);
  originalUrl = await uploadToCloudinary(originalFilePart, `${cloudinaryFolder}/original`);
  
 } catch (error: any) {
  console.error('Erro no upload para Cloudinary:', error);
  throw createError({
   statusCode: 500,
   statusMessage: 'Falha ao fazer upload dos arquivos para o Cloudinary.',
   data: { details: error.message }
  });
 }
 
 if (!editedUrl || !originalUrl) {
  throw createError({
   statusCode: 500,
   statusMessage: 'Upload do Cloudinary falhou, URLs não foram geradas.',
  });
 }

 // 6. Persistência no Banco de Dados (Prisma: model edited)
 let newEditedRecord: any;
 try {
  console.log(`[PRISMA] Tentando criar registro 'edited' para user_id: ${userId}`);
  
  // Esta checagem de tipo é apenas uma garantia extra, o JWT garante que userId é um número.
  if (typeof userId !== 'number' || userId <= 0 || isNaN(userId)) {
   throw new Error('ID de usuário inválido extraído do JWT. O token não contém o campo "userId".');
  }

  newEditedRecord = await prisma.edited.create({
   data: {
    user_id: userId,
    original_url: originalUrl,
    edited_url: editedUrl,
    // record_id e file_id são opcionais/nulos.
   },
  });
  
  // 7. Retorno para o frontend
  return {
   id: newEditedRecord.id.toString(), 
   type: imageType,
   fileId: fileUniqueId, 
   editedUrl: editedUrl,
   originalUrl: originalUrl,
  };

 } catch (prismaError: any) {
  console.error('Erro CRÍTICO no Prisma (POST /images/temp_save):', prismaError);
  
  // Detalhamento do erro de FK (P2003) ou outro erro de DB
  let detailedMessage = 'Falha desconhecida na persistência. Verifique o console do servidor.';
  if (prismaError.code === 'P2003') {
   detailedMessage = `Violação de Chave Estrangeira. O user_id ${userId} provavelmente não existe na tabela "users".`;
  } else if (prismaError.message) {
   detailedMessage = prismaError.message.substring(0, 500);
  }
  
  throw createError({
   statusCode: 500,
   statusMessage: 'Falha na imagem editada.',
   data: { details: detailedMessage }
  });
 }
});