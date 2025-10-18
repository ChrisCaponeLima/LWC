// /server/api/chat/messages/[messageId]/delete.post.ts - V1.3 - Correção do nome dos campos user_id na Room
import { defineEventHandler, createError, getRouterParams } from 'h3';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '~/server/utils/auth'; 

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
    const params = getRouterParams(event);
    const messageId = parseInt(params.messageId);
    
    let currentUserId;
    try {
        const payload = verifyAuthToken(event);
        currentUserId = payload.userId;
    } catch (e) {
        throw createError({ statusCode: 401, message: 'Não autorizado. Faça login novamente.' });
    }

    if (isNaN(messageId)) {
        throw createError({ statusCode: 400, message: 'ID da mensagem inválido.' });
    }

    // 1. Encontrar a mensagem e seus dados relacionados
    const message = await prisma.messages.findUnique({
        where: { id: messageId },
        select: { 
            sender_id: true,
            deleted_by_sender: true,
            deleted_by_recipient: true,
            // Seu modelo de sala é 'chat_rooms'
            chat_rooms: { 
                select: { 
                    user_one_id: true, // 🟢 CORRIGIDO
                    user_two_id: true  // 🟢 CORRIGIDO
                } 
            }
        }
    });

    if (!message) {
        throw createError({ statusCode: 404, message: 'Mensagem não encontrada.' });
    }

    // 🟢 CORREÇÃO: Usando os nomes corretos do modelo para desestruturação
    const { user_one_id, user_two_id } = message.chat_rooms;
    
    // 2. Determinar o campo a ser atualizado
    let updateField: 'deleted_by_sender' | 'deleted_by_recipient';
    
    // Verifica se o usuário logado pertence à sala
    if (currentUserId !== user_one_id && currentUserId !== user_two_id) { // 🟢 CORRIGIDO
        throw createError({ statusCode: 403, message: 'Você não faz parte desta conversa.' });
    }

    // Se o usuário atual é o remetente da mensagem
    if (currentUserId === message.sender_id) {
        updateField = 'deleted_by_sender';
    } else {
        // Se o usuário atual é o recipiente da mensagem
        updateField = 'deleted_by_recipient';
    }

    try {
        // 3. Realizar o Soft Delete (marcar como deletada)
        const updatedMessage = await prisma.messages.update({
            where: { id: messageId },
            data: { 
                [updateField]: true 
            },
            select: {
                deleted_by_sender: true,
                deleted_by_recipient: true,
            }
        });

        // 4. Checar se deve haver a deleção física (hard delete)
        if (updatedMessage.deleted_by_sender && updatedMessage.deleted_by_recipient) {
             // Lógica para deletar arquivos antes da mensagem principal, se houver:
             // await prisma.chat_message_files.deleteMany({ where: { message_id: messageId } });

             await prisma.messages.delete({
                where: { id: messageId }
            });
            return { success: true, message: 'Mensagem deletada permanentemente.' };
        }

        return { success: true, message: 'Mensagem marcada como deletada para você.' };

    } catch (error) {
        console.error(`[API DELETE] Erro ao deletar mensagem ${messageId}:`, error);
        throw createError({ statusCode: 500, message: 'Falha interna ao processar deleção.' });
    }
});