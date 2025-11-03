// /server/api/images/temp_upload.post.ts - V3.0 - Refatorado para receber metadados (após Upload Direto Assinado ao Cloudinary), eliminando o parsing do arquivo e o erro 413.

import { defineEventHandler, createError, H3Event, readBody } from 'h3';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '~/server/utils/db'; 
import { verifyAuthToken } from '~/server/utils/auth'; 
// 🚨 REMOÇÃO DE IMPORTS: Cloudinary, Readable, Buffer, readCustomMultipartFormData, getRequestHeader, MAX_FILE_SIZE não são mais necessários.

// Funções utilitárias (MANTIDAS)
const getUserIdFromEvent = (event: H3Event): number => {
 const payload = verifyAuthToken(event);
 return payload.userId;
};

// 🚨 REMOÇÃO: A função 'bufferToDataURI' foi removida por ser ineficiente e não será mais utilizada.
// 🚨 REMOÇÃO: A configuração global do Cloudinary não é mais necessária aqui, pois não faremos upload.

// Interface para o payload JSON que o cliente enviará após o upload direto
interface ClientUploadData {
    // 🚨 Dados fornecidos pelo Cloudinary após upload
    publicId: string; // public_id retornado pelo Cloudinary
    url: string;      // secure_url retornado pelo Cloudinary
    // 🚨 Metadados originais
    imageType: 'photo' | 'video'; // Renomeado de 'type' para 'imageType' para clareza
    isPrivate: boolean;
    isEdited: boolean;
}


export default defineEventHandler(async (event) => {
  let userId: number;
  try {
      userId = getUserIdFromEvent(event as H3Event);
  } catch (e) {
      // Relança o erro 401
      throw e;
  }

  try {
    // 🚨 ALTERAÇÃO CRÍTICA: Ler o corpo como JSON/Objeto, NÃO como MultipartFormData
    const body = await readBody(event) as ClientUploadData;
    
    // 🚨 REMOÇÃO: A verificação de Content-Length e a lógica do Busboy/MultipartFormData foram removidas.

    // 3. Extrair e validar dados do body JSON
        // As variáveis foram renomeadas para manter o padrão 'camelCase' no código Typescript.
    const uploadedPublicId: string = body.publicId;
    const uploadedUrl: string = body.url;
    const imageType: string = body.imageType || '';
    const isPrivate: boolean = body.isPrivate;
    const isEdited: boolean = body.isEdited; 

    if (!uploadedPublicId || !uploadedUrl || !imageType) {
        throw createError({ 
            statusCode: 400, 
            statusMessage: 'Bad Request: Campos essenciais (publicId, url, imageType) estão faltando no payload JSON.',
        });
    }
        
    // O ID único agora será usado apenas para o registro interno no DB
    const fileUniqueId = uuidv4(); 

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
        statusMessage: 'Erro interno fatal na persistência da URL.',
        data: { details: error.message || 'Erro desconhecido.' }
      });
  }
});