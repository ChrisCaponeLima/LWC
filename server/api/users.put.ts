// /server/api/users.put.ts
import { defineEventHandler, readBody, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary } from '~/server/utils/cloudinary';

interface UserUpdateData {
  userId: number;
  username?: string;
  email?: string;
  password?: string;
  birthdate?: string;
  height_cm?: number;
  initial_weight_kg?: number;
  apelido?: string;
  sexo?: string;
  photo?: File; // opcional: foto de perfil
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'PUT') {
    throw createError({ statusCode: 405, statusMessage: 'Método não permitido.' });
  }

  try {
    const body = await readBody<UserUpdateData>(event);
    const { userId, username, email, password, birthdate, height_cm, initial_weight_kg, apelido, sexo, photo } = body;

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
      height_cm: height_cm !== undefined ? Number(height_cm) : undefined,
      initial_weight_kg: initial_weight_kg !== undefined ? Number(initial_weight_kg) : undefined,
      birthdate: birthdate ? new Date(birthdate) : undefined,
      ...(password_hash ? { password_hash } : {}),
      ...(photo_perfil_url ? { photo_perfil_url } : {}),
    };

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
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor ao atualizar usuário.' });
  }
});
