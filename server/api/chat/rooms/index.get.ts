// /server/api/chat/rooms/index.get.ts - V1.2 - Lista salas de chat usando os nomes de relacionamento do schema.prisma.

import { defineEventHandler, createError } from 'h3';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '~/server/utils/auth'; 

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
    // 1. SEGURANÇA: Verificar e obter dados do usuário
    const userData = verifyAuthToken(event); 
    const currentUserId = userData.userId; 

    try {
        // 2. BUSCAR AS SALAS DO USUÁRIO com inclusão dos dados dos parceiros e da última mensagem
        const userRooms = await prisma.chat_rooms.findMany({
            where: {
                OR: [
                    { user_one_id: currentUserId },
                    { user_two_id: currentUserId },
                ],
            },
            // INCLUSÃO CORRETA baseada no schema.prisma fornecido
            include: {
                users_chat_rooms_user_one_idTousers: {
                    select: { id: true, username: true, apelido: true } 
                },
                users_chat_rooms_user_two_idTousers: {
                    select: { id: true, username: true, apelido: true } 
                },
                // Inclui apenas a última mensagem para ordenação/prévia
                messages: {
                    orderBy: { created_at: 'desc' },
                    take: 1,
                    select: { content: true, created_at: true, sender_id: true }
                }
            },
            // Ordenar por última mensagem, se possível. Caso contrário, pela criação da sala.
            orderBy: { 
                created_at: 'desc' // Fallback: ordenar pela criação da sala
            } 
        });

        // 3. FORMATAR O RETORNO
        // Formata os dados para o frontend identificar o parceiro
        const formattedRooms = userRooms.map(room => {
            
            // Determina quem é o parceiro (User One ou User Two)
            const isUserOne = room.user_one_id === currentUserId;
            
            const partner = isUserOne 
                ? room.users_chat_rooms_user_two_idTousers 
                : room.users_chat_rooms_user_one_idTousers;

            return {
                roomId: room.id,
                partnerId: partner.id,
                partnerName: partner.apelido || partner.username,
                lastMessage: room.messages[0] ? room.messages[0].content : null,
                lastMessageTime: room.messages[0] ? room.messages[0].created_at : room.created_at,
            };
        });


        // 4. RETORNO DE SUCESSO
        return formattedRooms;

    } catch (error) {
        // Logamos o erro detalhado para fins de debugging
        console.error('ERRO CRÍTICO NO PRISMA (Listagem de Salas):', error);
        // Retornamos um erro 500
        throw createError({ statusCode: 500, message: 'Falha interna ao listar as salas de chat.' });
    }
});