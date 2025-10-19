// /server/api/users/[id].put.ts - V1.0 - Implementação da rota de edição de usuário (PUT).
import { defineEventHandler, readBody, createError, getRouterParam, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyToken } from '~/server/utils/auth';

// Tipo de dados esperado no token
interface AuthPayload {
 userId: number
 role: string
}

// O tipo de dados recebido no corpo da requisição PUT
interface UserUpdateData {
 username?: string;
 email?: string;
 role?: 'user' | 'admin' | 'owner';
 birthdate?: string | null;
 height_cm?: number | null;
 initial_weight_kg?: number | null;
 sexo?: 'M' | 'F' | null; // Novo campo
 phone?: string | null;
}

export default defineEventHandler(async (event: H3Event) => {
 if (event.method !== 'PUT') {
  throw createError({ statusCode: 405, statusMessage: 'Método não permitido.' });
 }

 const userIdToUpdate = Number(getRouterParam(event, 'id'));
 if (isNaN(userIdToUpdate)) {
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

 // 🛑 AUTORIZAÇÃO: Apenas admin ou owner pode editar *outros* usuários. 
 // Um admin não pode editar outro admin/owner, e um owner pode editar todos.
 const isAuthorized = payload.role === 'owner' || payload.role === 'admin'
 if (!isAuthorized) {
  throw createError({ statusCode: 403, statusMessage: 'Acesso Proibido. Você não tem permissão para editar usuários.' })
 }

 try {
  const body = await readBody<UserUpdateData>(event);
  const { username, email, role, birthdate, height_cm, initial_weight_kg, sexo, phone } = body;

  // Prepara o objeto de dados para o Prisma
  const dataToUpdate: any = {};

  if (username !== undefined) dataToUpdate.username = username;
  if (email !== undefined) dataToUpdate.email = email;
  
  // Tratamento do Cargo (Role) e validação de segurança
  if (role !== undefined) {
   // Se o usuário logado for 'admin' e tentar mudar o cargo para 'owner', bloqueia
   if (role === 'owner' && payload.role !== 'owner') {
    throw createError({ statusCode: 403, statusMessage: 'Somente um Owner pode atribuir o cargo de Owner.' })
   }
   dataToUpdate.role = role;
  }
  
  // Novos Campos (Tratamento de null)
  if (birthdate !== undefined) dataToUpdate.birthdate = birthdate ? new Date(birthdate) : null;
  if (height_cm !== undefined) dataToUpdate.height_cm = height_cm || null;
  if (initial_weight_kg !== undefined) dataToUpdate.initial_weight_kg = initial_weight_kg || null;
  // Novo campo Sexo
  if (sexo !== undefined) dataToUpdate.sexo = sexo || null;
  if (phone !== undefined) dataToUpdate.phone = phone || null;
  
  // Verificação de dados vazios
  if (Object.keys(dataToUpdate).length === 0) {
   throw createError({ statusCode: 400, statusMessage: 'Nenhum dado válido para atualização foi fornecido.' });
  }

  // Atualiza o usuário no DB
  const updatedUser = await prisma.users.update({
   where: { id: userIdToUpdate },
   data: dataToUpdate,
   // Seleciona os campos que queremos retornar
   select: { 
    id: true, 
    username: true, 
    email: true, 
    role: true,
    birthdate: true,
    height_cm: true,
    initial_weight_kg: true,
    sexo: true, // Inclui o novo campo
    created_at: true, 
    last_login: true,
    photo_perfil_url: true,
    phone: true
   },
  });

  // Retorna o objeto do usuário atualizado
  return updatedUser;

 } catch (error: any) {
  console.error('Erro ao atualizar usuário:', error);
  if (error.code === 'P2002') {
   throw createError({ statusCode: 409, statusMessage: `E-mail ou nome de usuário já está em uso.` });
  }
  if (error.statusCode) throw error;
  throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor ao atualizar usuário.' });
 }
});