// /server/api/treatments/list.get.ts

import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  try {
    const userData = verifyAuthToken(event);
    const allowedRoles = ['profissional', 'admin', 'owner'];
    const userRole = String(userData.role).trim().toLowerCase();

    if (!allowedRoles.includes(userRole)) {
      throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas profissionais e administradores podem listar tratamentos.' });
    }

    const treatments = await prisma.treatments.findMany({
      select: {
        id: true,
        treatment_name: true,
        precoP: true,
        precoM: true,
        precoG: true,
        precoGG: true,
      },
      orderBy: { treatment_name: 'asc' },
    });

    return treatments.map(t => ({
      ...t,
      // Garante a serialização correta de Decimal para String se necessário no frontend
      precoP: t.precoP?.toString(), 
      precoM: t.precoM?.toString(), 
      precoG: t.precoG?.toString(), 
      precoGG: t.precoGG?.toString(),
    }));

  } catch (err: any) {
    console.error('Erro ao listar tratamentos:', err);
    if (err.statusCode) throw err;
    throw createError({ statusCode: 500, statusMessage: 'Falha interna ao carregar a lista de tratamentos.' });
  }
});