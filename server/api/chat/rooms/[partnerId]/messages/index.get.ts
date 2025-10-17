// /server/api/chat/rooms/[partnerId]/messages/index.get.ts - V2.1 - Correção do nome do relacionamento Prisma no include (message_files -> chat_message_files).

import { defineEventHandler, createError, getRouterParam, getQuery } from 'h3';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '~/server/utils/auth';

const prisma = new PrismaClient();

// Tempo limite para o Long Polling antes de retornar um array vazio (em milissegundos)
const POLLING_TIMEOUT = 29000; // 29 segundos

export default defineEventHandler(async (event) => {
  // 1. SEGURANÇA E PARÂMETROS
  const userData = verifyAuthToken(event); 
  const currentUserId = userData.userId; 
  const partnerId = parseInt(getRouterParam(event, 'partnerId') || '');
  
  // Pega o ID da última mensagem conhecida pelo cliente (do query params)
  const query = getQuery(event);
  const lastMessageId = parseInt(query.lastId as string) || 0;

  if (isNaN(partnerId)) {
    throw createError({ statusCode: 400, message: 'ID do parceiro inválido.' });
  }

  try {
    // 2. BUSCAR A SALA (Room)
    const chatRoom = await prisma.chat_rooms.findFirst({
      where: {
        OR: [
          { user_one_id: currentUserId, user_two_id: partnerId },
          { user_one_id: partnerId, user_two_id: currentUserId },
        ],
      },
      select: { id: true } 
    });

    if (!chatRoom) {
      throw createError({ statusCode: 404, message: 'Sala de chat não encontrada.' });
    }
    
    const roomId = chatRoom.id;
    
    // 3. FUNÇÃO DE BUSCA DE MENSAGENS
    const fetchNewMessages = async () => {
      return prisma.messages.findMany({
        where: {
          room_id: roomId,
          id: {
            gt: lastMessageId, 
          },
        },
        include: {
          // 🟢 CORREÇÃO CRÍTICA: Altera para o nome correto do relacionamento (chat_message_files)
          chat_message_files: true 
        },
        orderBy: {
          created_at: 'asc',
        },
        take: 50, // Limite de mensagens a cada poll
      });
    };

    // 4. LÓGICA DE LONG POLLING
    let newMessages = await fetchNewMessages();

    // Se houver mensagens novas, retorna imediatamente
    if (newMessages.length > 0) {
      return newMessages;
    }

    // Se não houver mensagens novas, entra no modo de Long Polling
    const startTime = Date.now();
    
    while (Date.now() - startTime < POLLING_TIMEOUT) {
      // Espera um curto período (curto poll)
      await new Promise(resolve => setTimeout(resolve, 3000)); 
      
      // Tenta buscar as mensagens novamente
      newMessages = await fetchNewMessages();
      
      if (newMessages.length > 0) {
        // Encontrou mensagens, retorna!
        return newMessages;
      }
    }

    // 5. RETORNO APÓS TIMEOUT
    return [];

  } catch (e: any) {
    console.error('ERRO NO LONG POLLING:', e);
    // Propaga erros de autenticação ou de sala não encontrada
    if (e.statusCode === 404 || e.statusCode === 401) {
      throw e;
    }
    // Outros erros (Prisma)
    throw createError({ statusCode: 500, message: 'Falha na busca de novas mensagens.' });
  }
});