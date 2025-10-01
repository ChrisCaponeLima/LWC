// /server/api/records/user/[userId].get.ts

import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/server/utils/db'; 

export default defineEventHandler(async (event) => {
  const userId = parseInt(event.context.params?.userId as string);

  if (isNaN(userId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de usuário inválido.',
    });
  }

  try {
    const userRecords = await prisma.records.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        record_date: 'asc',
      },
      // ATUALIZAÇÃO NO SELECT: GARANTINDO O INCLUDE DAS RELAÇÕES
      select: {
        id: true,
        record_date: true,
        weight: true,
        event: true,
        weekly_action: true,
        // Incluindo a relação record_measurements
        record_measurements: {
          select: {
            value: true,
            // Incluindo os detalhes da medição (nome e unidade)
            measurements: {
              select: {
                name: true,
                unit: true,
              }
            }
          }
        },
        // Certifique-se de incluir 'user_id' se for necessário no frontend
        user_id: true, 
      }
    });

    return userRecords;

  } catch (error) {
    console.error(`Erro ao buscar registros para o usuário ${userId}:`, error);
    
    // Retorna um erro amigável para o frontend
    throw createError({
      statusCode: 500,
      message: 'Falha ao buscar registros de evolução. Verifique o console do servidor para detalhes.',
    });
  }
});