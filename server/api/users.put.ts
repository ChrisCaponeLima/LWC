// /server/api/users.put.ts - V1.3 - Tratamento robusto de 'initial_weight_kg' para garantir que Decimal receba String, prevenindo erro 500 por tipo.
import { defineEventHandler, readBody, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import { Prisma } from '@prisma/client'; // Importa Prisma para usar o construtor Decimal
import bcrypt from 'bcryptjs';
import { uploadToCloudinary } from '~/server/utils/cloudinary';

interface UserUpdateData {
 userId: number;
 username?: string;
 email?: string;
 password?: string;
 birthdate?: string;
 height_cm?: number;
 initial_weight_kg?: number | string | null; // Tipagem mais flexível
 apelido?: string;
 sexo?: string;
 phone?: string; 
 active?: boolean; 
 photo?: File; // opcional: foto de perfil
}

export default defineEventHandler(async (event) => {
 if (event.method !== 'PUT') {
  throw createError({ statusCode: 405, statusMessage: 'Método não permitido.' });
 }

 try {
  const body = await readBody<UserUpdateData>(event);
  // CORREÇÃO V1.1: Inclusão de 'phone' e 'active' (e agora 'apelido' também, por segurança, embora não esteja no payload do frontend)
  const { userId, username, email, password, birthdate, height_cm, initial_weight_kg, apelido, sexo, photo, phone, active } = body;

  if (!userId) {
   throw createError({ statusCode: 400, statusMessage: 'ID do usuário é obrigatório.' });
  }

  // Busca usuário existente
  const existingUser = await prisma.users.findUnique({ where: { id: userId } });
  if (!existingUser) {
   throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' });
  }

  // Se senha foi enviada, faz hash
  let password_hash: string | undefined;
  if (password) {
   password_hash = await bcrypt.hash(password, 10);
  }

  // Upload opcional de foto
  let photo_perfil_url: string | null | undefined = undefined;
  if (photo) {
   try {
    photo_perfil_url = await uploadToCloudinary(photo, 'user_profiles');
   } catch (err) {
    console.error('Erro upload Cloudinary:', err);
   }
  }

  // Prepara dados de atualização
  const dataToUpdate: any = {
   username,
   email,
   apelido,
   sexo,
   // height_cm é Int. Se for null, o Number() resulta em 0, por isso usamos o operador ternário para garantir undefined se for null/undefined
   height_cm: height_cm !== undefined && height_cm !== null ? Number(height_cm) : undefined,
   // birthdate: Converte string de data para objeto Date
   birthdate: birthdate ? new Date(birthdate) : undefined,
   phone, 
   active,
   ...(password_hash ? { password_hash } : {}),
   ...(photo_perfil_url !== undefined ? { photo_perfil_url } : {}), 
  };

    // CORREÇÃO V1.3: Lógica específica para o tipo Decimal. Garante que o valor seja tratado como string para o construtor do Prisma
    if (initial_weight_kg !== undefined && initial_weight_kg !== null) {
        // Converte para string e substitui vírgula por ponto (caso o frontend envie no formato brasileiro)
        const weightString = String(initial_weight_kg).replace(',', '.');
        
        // Verifica se a string não está vazia
        if (weightString.trim() !== '') {
            try {
                // Passa a string para o construtor Decimal do Prisma, que é mais robusto
                dataToUpdate.initial_weight_kg = new Prisma.Decimal(weightString);
            } catch (decimalError) {
                console.error('Erro ao converter para Prisma.Decimal:', decimalError);
                // Gera um erro 400 se a conversão falhar (dado inválido)
                throw createError({ statusCode: 400, statusMessage: 'O valor do Peso Inicial (kg) é inválido.' });
            }
        } else {
             // Se for string vazia, defina-o como undefined para ser removido do update
             dataToUpdate.initial_weight_kg = undefined;
        }
    }


  // Remove chaves undefined (pra não sobrescrever com null indevido)
  Object.keys(dataToUpdate).forEach((key) => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

  const updatedUser = await prisma.users.update({
   where: { id: userId },
   data: dataToUpdate,
   select: {
    id: true,
    username: true,
    email: true,
    role: true,
    apelido: true,
    photo_perfil_url: true,
    height_cm: true,
    initial_weight_kg: true,
    sexo: true,
    birthdate: true,
    phone: true,
    active: true,
   },
  });

  return {
   message: 'Usuário atualizado com sucesso!',
   user: updatedUser,
  };
 } catch (error: any) {
  console.error('Erro ao atualizar usuário:', error);
  if (error.code === 'P2002') {
   const target = error.meta?.target.includes('username') ? 'Nome de usuário' : 'E-mail';
   throw createError({ statusCode: 409, statusMessage: `${target} já está em uso.` });
  }
  // Captura o novo erro 400 de validação de Decimal
  if (error.statusCode) throw error;
  throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor ao atualizar usuário.' });
 }
});