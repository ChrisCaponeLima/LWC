// /server/api/treatments/create.post.ts

import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  try {
    const userData = verifyAuthToken(event);
    const allowedRoles = ['admin', 'owner'];
    const userRole = String(userData.role).trim().toLowerCase();

    // Apenas Admin/Owner podem criar tratamentos mestres.
    if (!allowedRoles.includes(userRole)) {
      throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas administradores podem cadastrar tratamentos.' });
    }

    const body = await readBody(event);
    const { treatment_name, precoP, precoM, precoG, precoGG } = body;

    if (!treatment_name) {
      throw createError({ statusCode: 400, statusMessage: 'Nome do tratamento é obrigatório.' });
    }

    const newTreatment = await prisma.treatments.create({
      data: {
        treatment_name: String(treatment_name),
        precoP: precoP ? parseFloat(precoP) : null,
        precoM: precoM ? parseFloat(precoM) : null,
        precoG: precoG ? parseFloat(precoG) : null,
        precoGG: precoGG ? parseFloat(precoGG) : null,
      },
      select: { id: true, treatment_name: true },
    });

    return { success: true, treatment: newTreatment, message: 'Tratamento criado com sucesso.' };

  } catch (err: any) {
    console.error('Erro ao criar tratamento:', err);
    if (err.statusCode) throw err;
    if (err.message?.includes('Unique constraint failed')) {
      throw createError({ statusCode: 409, statusMessage: 'Já existe um tratamento com este nome.' });
    }
    throw createError({ statusCode: 500, statusMessage: 'Falha interna ao criar tratamento.' });
  }
});