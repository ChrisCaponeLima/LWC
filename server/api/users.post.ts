// /server/api/users.post.ts - V1.3 - Adiciona campos opcionais 'phone' e 'active' (ativo/inativo) ao cadastro.
import { defineEventHandler, readBody, createError, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import bcrypt from 'bcryptjs';
import { verifyToken } from '~/server/utils/auth';

// Tipo de dados esperado no token
interface AuthPayload {
userId: number
role: string
}

// O tipo de dados recebido no corpo da requisição POST
interface UserCreationData {
username: string;
email: string;
password: string; // Senha inicial
role: 'user' | 'admin' | 'owner';
// NOVOS CAMPOS OPCIONAIS
birthdate?: string | null; // String 'YYYY-MM-DD'
height_cm?: number | null; // Número
initial_weight_kg?: number | null; // Número
phone?: string | null; // Novo campo telefone
active?: boolean; // Novo campo ativo/inativo
}

export default defineEventHandler(async (event: H3Event) => {
if (event.method !== 'POST') {
 throw createError({ statusCode: 405, statusMessage: 'Método não permitido.' });
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

// 🛑 AUTORIZAÇÃO: Somente admin/owner pode criar usuários
if (payload.role !== 'admin' && payload.role !== 'owner') {
 throw createError({ statusCode: 403, statusMessage: 'Acesso Proibido. Requer cargo de Administrador para criar usuários.' })
}

try {
 const body = await readBody<UserCreationData>(event);
 const { 
 username, email, password, role, 
 birthdate, height_cm, initial_weight_kg, phone, active
 } = body;

 // Validação de campos obrigatórios
 if (!username || !email || !password || !role) {
 throw createError({ statusCode: 400, statusMessage: 'Nome de usuário, e-mail, senha e cargo (role) são obrigatórios.' });
 }

 // Segurança extra: Apenas um 'owner' pode criar outro 'owner' ou 'admin'
 if (role === 'owner' && payload.role !== 'owner') {
 throw createError({ statusCode: 403, statusMessage: 'Apenas um Owner pode criar outro Owner.' })
 }

 const password_hash = await bcrypt.hash(password, 10);

 // Prepara o objeto de criação com todos os dados
 const dataToCreate: any = {
 username,
 email,
 password_hash,
 role,
 // NOVOS DADOS
 birthdate: birthdate ? new Date(birthdate) : null,
 height_cm: height_cm || null,
 initial_weight_kg: initial_weight_kg || null,
  phone: phone || null,
  active: active !== undefined ? active : true, // Padrão ativo = true
 };


 // Criamos o novo usuário no DB
 const newUser = await prisma.users.create({
 data: dataToCreate,
 // Seleciona apenas os campos que queremos retornar
 select: { 
  id: true, 
  username: true, 
  email: true, 
  role: true,
  birthdate: true, // Retorna os novos campos também
  height_cm: true,
  initial_weight_kg: true,
  created_at: true, 
  last_login: true,
  photo_perfil_url: true,
  phone: true,
  active: true
 },
 });

 // Retorna o objeto do usuário criado
 return newUser;

} catch (error: any) {
 console.error('Erro ao criar usuário:', error);
 if (error.code === 'P2002') {
 const target = error.meta?.target.includes('username') ? 'Nome de usuário' : 'E-mail';
 throw createError({ statusCode: 409, statusMessage: `${target} já está em uso.` });
 }
 if (error.statusCode) throw error;
 throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor ao criar usuário.' });
}
});