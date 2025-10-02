// /server/api/users.post.ts
import { defineEventHandler, readBody, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary } from '~/server/utils/cloudinary'; // 🔹 Helper centralizado

interface UserCreationData {
  username: string;
  email: string;
  password: string;
  birthdate?: string;
  height_cm?: number;
  initial_weight_kg?: number;
  apelido?: string;
  sexo?: string;
  photo?: File; // opcional: foto de perfil
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Método não permitido.' });
  }

  try {
    const body = await readBody<UserCreationData>(event);
    const { username, email, password, birthdate, height_cm, initial_weight_kg, apelido, sexo, photo } = body;

    if (!username || !email || !password) {
      throw createError({ statusCode: 400, statusMessage: 'Nome de usuário, e-mail e senha são obrigatórios.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    let photo_perfil_url: string | null = null;
    if (photo) {
      try {
        photo_perfil_url = await uploadToCloudinary(photo, 'user_profiles');
      } catch (err) {
        console.error('Erro upload Cloudinary:', err);
      }
    }

    const dataToCreate: any = {
      username,
      email,
      password_hash,
      height_cm: height_cm ? Number(height_cm) : null,
      initial_weight_kg: initial_weight_kg ? Number(initial_weight_kg) : null,
      apelido,
      sexo,
      birthdate: birthdate ? new Date(birthdate) : null,
      photo_perfil_url,
    };

    const newUser = await prisma.users.create({
      data: dataToCreate,
      select: { id: true, username: true, email: true, role: true, photo_perfil_url: true },
    });

    return {
      message: 'Usuário criado com sucesso!',
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      photo_perfil_url: newUser.photo_perfil_url,
    };
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
