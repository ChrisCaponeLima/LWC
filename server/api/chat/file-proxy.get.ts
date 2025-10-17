// /server/api/chat/file-proxy.get.ts - V1.0 - Endpoint seguro para servir arquivos privados após verificação de acesso.

import { defineEventHandler, createError, getQuery } from 'h3';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '~/server/utils/auth'; 

const prisma = new PrismaClient();

// 🚨 SIMULAÇÃO: Esta função SIMULA a leitura de um arquivo privado do disco/bucket.
// Em um ambiente real, você faria a leitura do 'fileUrl' no seu sistema de armazenamento seguro.
const retrieveFileContent = (fileUrl) => {
    console.log(`[FILE-PROXY] Tentativa de acesso ao arquivo: ${fileUrl}`);
    // Apenas para simulação, retornamos um buffer de um pixel transparente ou um erro.
    // Em produção, você faria fs.readFileSync(fileUrl) ou chamaria o SDK do S3/GCS.
    
    // Simulação: Retorna um buffer de dados (e.g., uma imagem real)
    // Se você tiver um arquivo real para teste, substitua esta simulação.
    const mockImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; 
    const mockBuffer = Buffer.from(mockImageBase64, 'base64');
    
    return mockBuffer;
};


export default defineEventHandler(async (event) => {
    // 1. SEGURANÇA: Verificar e obter dados do usuário
    const userData = verifyAuthToken(event); 
    const currentUserId = userData.userId; 

    // 2. PARÂMETROS: Obter a URL do arquivo de referência
    const query = getQuery(event);
    const fileUrl = query.fileUrl as string;

    if (!fileUrl) {
        throw createError({ statusCode: 400, message: 'Parâmetro fileUrl é obrigatório.' });
    }

    try {
        // 3. VERIFICAÇÃO DE PERMISSÃO: 
        // Encontra a mensagem e a sala associadas a esta URL de arquivo
        const messageFile = await prisma.message_files.findFirst({
            where: { file_url: fileUrl },
            select: {
                messages: {
                    select: {
                        room_id: true,
                        chat_rooms: {
                            select: { user_one_id: true, user_two_id: true }
                        }
                    }
                }
            }
        });

        if (!messageFile) {
            throw createError({ statusCode: 404, message: 'Arquivo não encontrado ou URL inválida.' });
        }
        
        const room = messageFile.messages.chat_rooms;
        
        // Verifica se o usuário logado é um dos participantes da sala
        const isParticipant = room.user_one_id === currentUserId || room.user_two_id === currentUserId;

        if (!isParticipant) {
            throw createError({ statusCode: 403, message: 'Acesso negado. Você não é participante deste chat.' });
        }

        // 4. RETORNO SEGURO DO ARQUIVO
        const fileContent = retrieveFileContent(fileUrl);
        
        // Define os headers corretos para a resposta
        event.node.res.setHeader('Content-Type', 'image/png'); // 🚨 AJUSTAR PARA O TIPO REAL (guardado no message_files)
        event.node.res.setHeader('Cache-Control', 'public, max-age=3600'); 
        
        return fileContent;

    } catch (error) {
        console.error('Erro no proxy de arquivo:', error);
        throw createError({ statusCode: error.statusCode || 500, message: error.message || 'Falha ao servir o arquivo privado.' });
    }
});