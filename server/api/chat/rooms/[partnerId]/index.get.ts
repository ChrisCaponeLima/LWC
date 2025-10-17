// /server/api/chat/rooms/[partnerId]/index.get.ts - V3.1 - Correção da nomenclatura do relacionamento 'include' (message_files -> chat_message_files)

import { defineEventHandler, createError, getRouterParam } from 'h3';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '~/server/utils/auth';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  // 1. SEGURANÇA E PARÂMETROS
  const userData = verifyAuthToken(event); 
  const currentUserId = userData.userId; 
  const partnerId = parseInt(getRouterParam(event, 'partnerId') || '');

  if (isNaN(partnerId) || partnerId === currentUserId) {
    throw createError({ statusCode: 400, message: 'ID do parceiro inválido.' });
  }

  try {
    // 2. BUSCAR INFORMAÇÕES DO PARCEIRO
    const partnerUser = await prisma.users.findUnique({
      where: { id: partnerId },
      select: { id: true, username: true } // Usando 'username'
    });

    if (!partnerUser) {
      throw createError({ statusCode: 404, message: 'Parceiro de chat não encontrado.' });
    }
    
    // 3. TENTAR ENCONTRAR A SALA EXISTENTE (FIND OR CREATE)
    let chatRoom = await prisma.chat_rooms.findFirst({
      where: {
        OR: [
          { user_one_id: currentUserId, user_two_id: partnerId },
          { user_one_id: partnerId, user_two_id: currentUserId },
        ],
      },
      select: { id: true } 
    });

    // 4. SE A SALA NÃO EXISTIR, CRIÁ-LA
    if (!chatRoom) {
      console.log(`Sala não encontrada. Criando nova sala entre ${currentUserId} e ${partnerId}.`);
      
      // Garantir que o ID menor seja user_one_id (para consistência e unicidade)
      const [id1, id2] = [currentUserId, partnerId].sort((a, b) => a - b);
      
      chatRoom = await prisma.chat_rooms.create({
        data: {
          user_one_id: id1,
          user_two_id: id2,
        },
        select: { id: true }
      });
    }
    
    // 5. BUSCAR AS MENSAGENS (Histórico)
    const messages = await prisma.messages.findMany({
      where: {
        room_id: chatRoom.id,
      },
      // CORREÇÃO: Usando 'chat_message_files' conforme definido no schema.prisma
      include: {
        chat_message_files: true 
      },
      orderBy: {
        created_at: 'asc',
      },
      take: 50, 
    });

    // 6. RETORNO DE SUCESSO
    console.log(`[SUCESSO] Sala ${chatRoom.id} carregada/criada. Parceiro: ${partnerUser.username}`);
    return {
      roomId: chatRoom.id,
      partnerName: partnerUser.username || `Parceiro #${partnerId}`,
      messages: messages,
    };

  } catch (e) {
    // Logamos o erro detalhado para fins de debugging
    console.error('ERRO CRÍTICO AO CARREGAR/CRIAR SALA:', e);
    throw createError({ 
      statusCode: 500, 
      message: 'Falha interna ao carregar ou criar a sala de chat.' 
    });
  }
});