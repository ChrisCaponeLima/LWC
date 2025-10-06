// /server/api/users/[id].delete.ts - V1.0 - Implementação da rota de deleção de usuário (DELETE).
import { defineEventHandler, createError, getRouterParam, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyToken } from '~/server/utils/auth';

// Tipo de dados esperado no token
interface AuthPayload {
 userId: number
 role: string
}

export default defineEventHandler(async (event: H3Event) => {
 if (event.method !== 'DELETE') {
  throw createError({ statusCode: 405, statusMessage: 'Método não permitido.' });
 }

 const userIdToDelete = Number(getRouterParam(event, 'id'));
 if (isNaN(userIdToDelete)) {
  throw createError({ statusCode: 400, statusMessage: 'ID de usuário inválido.' });
 }

 const token = event.headers.get('Authorization')?.split(' ')[1]

 if (!token) {
  throw createError({ statusCode: 401, statusMessage: 'Não autorizado. Token não fornecido.' })
 }

 let payload: AuthPayload
 try {
  payload = verifyToken(token) as AuthPayload
 } catch (e) {
  throw createError({ statusCode: 401, statusMessage: 'Token inválido ou expirado.' })
 }

 // 🛑 AUTORIZAÇÃO: Apenas admin ou owner podem deletar usuários
 if (payload.role !== 'admin' && payload.role !== 'owner') {
  throw createError({ statusCode: 403, statusMessage: 'Acesso Proibido. Requer cargo de Administrador para deletar usuários.' })
 }

 // 🛑 PREVENÇÃO: Não permite que um usuário se auto-delete (segurança e UX)
 if (payload.userId === userIdToDelete) {
  throw createError({ statusCode: 403, statusMessage: 'Você não pode deletar sua própria conta através desta interface.' })
 }
 
 // 🛑 PREVENÇÃO: Um Admin não pode deletar um Owner
 if (payload.role === 'admin') {
  const userRole = await prisma.users.findUnique({
   where: { id: userIdToDelete },
   select: { role: true }
  });

  if (userRole?.role === 'owner') {
   throw createError({ statusCode: 403, statusMessage: 'Acesso Proibido. Um Administrador não pode deletar um Owner.' })
  }
 }

 try {
  // Deleta o usuário no DB
  await prisma.users.delete({
   where: { id: userIdToDelete },
  });

  // Retorna uma mensagem de sucesso, mas sem conteúdo (204 No Content é comum, mas 200/204 funciona)
  return { success: true, message: `Usuário ${userIdToDelete} deletado com sucesso.` };

 } catch (error: any) {
  console.error('Erro ao deletar usuário:', error);
  if (error.code === 'P2025') {
   throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' });
  }
  if (error.statusCode) throw error;
  throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor ao deletar usuário.' });
 }
});