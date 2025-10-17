// /server/api/chat/send.post.ts - V1.1 - Lógica de envio HTTP, usando 'chat_message_files' e lógica de Transaction

import { defineEventHandler, createError, readBody } from 'h3';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '~/server/utils/auth'; 

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  // 1. SEGURANÇA: Verificar e obter dados do usuário
  const userData = verifyAuthToken(event); 
  const currentUserId = userData.userId; 

  // 2. OBTER PAYLOAD
  const { roomId, content, fileUrl, fileType } = await readBody(event);

  if (!roomId) {
    throw createError({ statusCode: 400, message: 'ID da sala é obrigatório.' });
  }
  if (!content && !fileUrl) {
    throw createError({ statusCode: 400, message: 'Conteúdo ou arquivo é obrigatório.' });
  }

  try {
    
    // 3. CRIAÇÃO DA MENSAGEM (Incluindo a criação aninhada do arquivo, se existir)
        const message = await prisma.messages.create({
            data: {
                room_id: roomId,
                sender_id: currentUserId,
                content: content,
                
                // CRIAÇÃO ANINHADA DO ARQUIVO: Se fileUrl existir, cria o registro em 'chat_message_files'
                ...(fileUrl && {
                    chat_message_files: {
                        create: {
                            file_url: fileUrl,
                            file_type: fileType || 'image/png', // Assumindo default se não vier do upload
                        }
                    }
                })
            },
            // Retorna a mensagem completa, incluindo o relacionamento correto
            include: {
                chat_message_files: true, // CORREÇÃO: Usando o nome correto do relacionamento
            }
        });

    // 4. ATUALIZAÇÃO DA SALA (Para ordenar por `updated_at` na listagem)
    await prisma.chat_rooms.update({
      where: { id: roomId },
      data: { updated_at: new Date() }
    });


    // 5. RETORNO DE SUCESSO
    return message;

  } catch (error) {
    console.error('ERRO AO ENVIAR MENSAGEM:', error);
    throw createError({ statusCode: 500, message: 'Falha interna ao enviar a mensagem.' });
  }
});