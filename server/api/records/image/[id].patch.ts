// /server/api/records/image/[id].patch.ts - V1.2 - Correção Crítica: Uso do fileId (parâmetro de rota) para buscar/filtrar.

import { defineEventHandler, getQuery, readBody, createError } from 'h3';
import { prisma } from '~/server/utils/db'; // Usando importação padronizada
import { verifyAuthToken } from '~/server/utils/auth'; 

const FileTypeMap: Record<string, number> = {
  registro: 1,
  forma: 2,
};

export default defineEventHandler(async (event) => {
  // 1. AUTENTICAÇÃO E PARÂMETROS
  const userData = verifyAuthToken(event); 
  const userId = userData.userId ?? userData.id; // Uso padronizado

  // 🚨 ATENÇÃO: O ID da rota agora é o FILE ID
  const fileId = parseInt(event.context.params?.id as string); 
  
  const query = getQuery(event);
  const photoType = query.type as 'registro' | 'forma' | undefined; 
  const fileTypeId = FileTypeMap[photoType]; 

  const body = await readBody(event);
  const isPrivateNew = body.isPrivate; 

  if (isNaN(fileId) || !photoType || !fileTypeId || typeof isPrivateNew !== 'boolean') {
    throw createError({ statusCode: 400, message: 'Dados de requisição incompletos ou inválidos.' });
  }

  const isPrivateDb = isPrivateNew ? 1 : 0; 

  try {
    // 2. BUSCA E ATUALIZAÇÃO NO PRISMA (Usando fileId na chave 'where')
    const updatedFile = await prisma.files.updateMany({
      where: {
        id: fileId, // 🚀 Filtro principal usando o ID do Arquivo
        file_type: fileTypeId,
        // 🚀 FILTRO CRÍTICO DE AUTORIZAÇÃO: Garante que o arquivo pertence a um registro do usuário logado
        records: { user_id: userId } 
      },
      data: {
        is_private: isPrivateDb,
        updated_at: new Date(),
      },
    });

    if (updatedFile.count === 0) {
      throw createError({ 
        statusCode: 404, 
        message: 'Arquivo não encontrado, acesso negado (userId) ou nenhum dado modificado.' 
      });
    }

    return { success: true, message: 'Metadados da imagem atualizados com sucesso.', count: updatedFile.count };

  } catch (error: any) {
    console.error('Erro na API PATCH de imagem:', error);
    if (error.statusCode) throw error; 
    throw createError({ statusCode: 500, message: 'Falha interna ao atualizar metadados da imagem.' });
  }
});