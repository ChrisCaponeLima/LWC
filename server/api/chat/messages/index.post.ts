// /server/api/chat/messages/index.post.ts - V1.0 - Recebe e processa o envio de uma nova mensagem (texto ou arquivo).

import { defineEventHandler, readBody, createError } from 'h3';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '~/server/utils/auth'; 

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
    // 1. SEGURANÇA: Verificar e obter dados do usuário
    const userData = verifyAuthToken(event); 
    const senderId = userData.userId; 

    // 2. OBTENÇÃO E VALIDAÇÃO DOS DADOS
    const body = await readBody(event);
    const { 
        roomId, 
        content, 
        fileUrl, 
        fileType 
    } = body; 

    if (!roomId || typeof roomId !== 'number') {
        throw createError({ statusCode: 400, message: 'ID da sala de chat (roomId) é obrigatório.' });
    }

    // A mensagem deve ter conteúdo (texto) OU uma referência de arquivo.
    const hasContent = content && typeof content === 'string' && content.trim().length > 0;
    const hasFile = fileUrl && typeof fileUrl === 'string';

    if (!hasContent && !hasFile) {
        throw createError({ statusCode: 400, message: 'A mensagem deve conter texto ou uma referência de arquivo.' });
    }
    
    // 3. VERIFICAÇÃO DE PERMISSÃO (Opcional, mas Seguro)
    // Garante que o usuário é um dos participantes da sala antes de permitir o envio.
    const room = await prisma.chat_rooms.findUnique({
        where: { id: roomId },
    });

    if (!room || (room.user_one_id !== senderId && room.user_two_id !== senderId)) {
        throw createError({ statusCode: 403, message: 'Acesso negado à sala de chat.' });
    }

    // 4. TRANSAÇÃO: Cria a mensagem e (se houver) o arquivo anexado
    try {
        const newMessage = await prisma.messages.create({
            data: {
                room_id: roomId,
                sender_id: senderId,
                content: hasContent ? content.trim() : null,
                is_read: false,
                
                // Anexa a informação do arquivo diretamente, se presente
                message_files: hasFile ? {
                    create: {
                        file_url: fileUrl,
                        file_type: fileType || 'image/jpeg', // Padrão se o tipo não for especificado
                    }
                } : undefined,
            },
            // Retorna os dados completos para o frontend, incluindo arquivos
            select: {
                id: true,
                sender_id: true,
                content: true,
                created_at: true,
                message_files: {
                    select: {
                        file_url: true, 
                        file_type: true
                    }
                }
            }
        });

        // 5. RETORNO DE SUCESSO
        event.node.res.statusCode = 201; 
        return { 
            success: true, 
            message: 'Mensagem enviada com sucesso.', 
            data: newMessage 
        };

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw createError({ statusCode: 500, message: 'Falha interna ao enviar a mensagem.' });
    }
});