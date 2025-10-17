// // /server/plugins/socket.ts - V1.0 - Inicializa o servidor Socket.IO para comunicação em tempo real.

// import { defineNitroPlugin } from 'nitropack/runtime';
// import { Server as SocketIOServer } from 'socket.io';
// import { verifyAuthToken } from '../utils/auth'; // Importa a função de autenticação
// // 🚨 Nota: Assumimos que o PrismaClient está disponível no server/utils/prisma, ou importamos aqui:
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// // Mapa para rastrear usuários conectados (opcional, mas útil)
// const usersMap = new Map();

// export default defineNitroPlugin((nitro) => {
//     // Verifica se o servidor já foi inicializado
//     if (nitro.options.dev) {
//         console.log('[Socket.IO] Servidor de WebSockets já inicializado em ambiente de desenvolvimento.');
//         return;
//     }

//     // 1. Cria a instância do Socket.IO
//     const io = new SocketIOServer(nitro.h3App.node.server, {
//         path: '/api/socket.io/', // Define um caminho específico para evitar conflitos com APIs REST
//         cors: {
//             origin: "*", // 🚨 Ajuste isso para a URL do seu frontend em produção
//             methods: ["GET", "POST"]
//         }
//     });

//     // 2. Middleware de Autenticação do Socket
//     io.use(async (socket, next) => {
//         const token = socket.handshake.auth.token;
//         if (!token) {
//             return next(new Error('Autenticação de Socket falhou: Token ausente.'));
//         }
        
//         try {
//             // Reutiliza a função de verificação do token
//             const userData = verifyAuthToken(token); 
//             // Anexa os dados do usuário ao objeto do socket
//             socket.data.userId = userData.userId; 
//             next();
//         } catch (e) {
//             console.error('[Socket.IO] Erro de autenticação de token:', e);
//             next(new Error('Autenticação de Socket falhou: Token inválido.'));
//         }
//     });

//     // 3. Lógica de Conexão e Eventos
//     io.on('connection', (socket) => {
//         const userId = socket.data.userId;
//         console.log(`[Socket.IO] Usuário conectado: ID ${userId}, Socket ID: ${socket.id}`);
        
//         // Adiciona o usuário ao mapa de conectados e o associa à sua sala
//         usersMap.set(userId, socket.id);
//         socket.join(`user:${userId}`); // Cria uma sala privada para o usuário (para notificações)

//         // Evento 1: Entrar em uma Sala de Chat Específica
//         // O cliente envia este evento ao abrir um chat com um parceiro
//         socket.on('join_room', (roomId: number) => {
//             if (typeof roomId !== 'number' || roomId <= 0) {
//                  console.warn(`[Socket.IO] Tentativa de entrar em sala inválida por User ${userId}.`);
//                  return;
//             }
            
//             // Remove o socket de qualquer sala de chat anterior (garante 1 chat ativo)
//             socket.rooms.forEach(room => {
//                 if (room.startsWith('chat:')) {
//                     socket.leave(room);
//                 }
//             });

//             const roomName = `chat:${roomId}`;
//             socket.join(roomName);
//             console.log(`[Socket.IO] User ${userId} entrou na sala ${roomName}`);
//         });

//         // Evento 2: Envio de Mensagem (Recebida do Frontend)
//         socket.on('send_message', async (messagePayload: { roomId: number, content: string, fileUrl?: string, fileType?: string }) => {
//             const { roomId, content, fileUrl, fileType } = messagePayload;
            
//             // 🚨 Reutiliza a lógica do POST /api/chat/messages para persistência no DB
//             if (!roomId || (!content && !fileUrl)) {
//                 socket.emit('message_error', { message: 'Conteúdo ou RoomId ausente.' });
//                 return;
//             }

//             try {
//                 // 1. Cria a mensagem no Banco de Dados (Transação Persistente)
//                 const hasContent = content && content.trim().length > 0;
//                 const hasFile = fileUrl && fileUrl.trim().length > 0;

//                 const newMessage = await prisma.messages.create({
//                     data: {
//                         room_id: roomId,
//                         sender_id: userId,
//                         content: hasContent ? content.trim() : null,
//                         is_read: false,
//                         message_files: hasFile ? {
//                             create: { file_url: fileUrl!, file_type: fileType || 'image/jpeg' }
//                         } : undefined,
//                     },
//                     select: {
//                         id: true,
//                         sender_id: true,
//                         content: true,
//                         created_at: true,
//                         message_files: {
//                             select: { file_url: true, file_type: true }
//                         }
//                     }
//                 });

//                 // 2. Emite a mensagem para todos na sala
//                 const roomName = `chat:${roomId}`;
//                 io.to(roomName).emit('receive_message', newMessage);

//                 console.log(`[Socket.IO] Mensagem enviada para sala ${roomName} por User ${userId}.`);

//             } catch (e) {
//                 console.error('[Socket.IO] Erro ao persistir e enviar mensagem:', e);
//                 socket.emit('message_error', { message: 'Falha ao enviar e persistir a mensagem.' });
//             }
//         });


//         // Evento 3: Desconexão
//         socket.on('disconnect', () => {
//             usersMap.delete(userId);
//             console.log(`[Socket.IO] Usuário desconectado: ID ${userId}`);
//         });
//     });
// });