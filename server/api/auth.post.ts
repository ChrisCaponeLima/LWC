// /server/api/auth.post.ts - V1.2 Login pelo primeiro nome
import { defineEventHandler, readBody, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = await readBody(event);

    if (!username || !password) {
      throw createError({ statusCode: 400, statusMessage: 'Nome de usuário e senha são obrigatórios.' });
    }

    // Busca pelo primeiro nome (ignora sobrenomes e case)
    const user = await prisma.users.findFirst({
      where: {
        username: {
          startsWith: username,
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Credenciais inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw createError({ statusCode: 401, statusMessage: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_NAO_USAR_EM_PRODUCAO',
      { expiresIn: '1d' }
    );

    return {
      token,
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      apelido: user.apelido,
      photo_perfil_url: user.photo_perfil_url,
      heightCm: user.height_cm,
      initialWeight: user.initial_weight_kg,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    console.error('Erro de autenticação:', error);
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor.' });
  }
});
