// /server/api/treatments/update.put.ts

import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  try {
    const userData = verifyAuthToken(event);
    const allowedRoles = ['admin', 'owner'];
    const userRole = String(userData.role).trim().toLowerCase();

    if (!allowedRoles.includes(userRole)) {
      throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas administradores podem atualizar tratamentos.' });
    }

    const body = await readBody(event);
    const { id, treatment_name, precoP, precoM, precoG, precoGG } = body;

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID do tratamento é obrigatório para atualização.' });
    }

    const updatedTreatment = await prisma.treatments.update({
      where: { id: parseInt(id) },
      data: {
        treatment_name: treatment_name ? String(treatment_name) : undefined,
        precoP: precoP ? parseFloat(precoP) : null,
        precoM: precoM ? parseFloat(precoM) : null,
        precoG: precoG ? parseFloat(precoG) : null,
        precoGG: precoGG ? parseFloat(precoGG) : null,
      },
      select: { id: true, treatment_name: true },
    });

    return { success: true, treatment: updatedTreatment, message: 'Tratamento atualizado com sucesso.' };

  } catch (err: any) {
    console.error('Erro ao atualizar tratamento:', err);
    if (err.statusCode) throw err;
    if (err.message?.includes('Unique constraint failed')) {
      throw createError({ statusCode: 409, statusMessage: 'Já existe outro tratamento com este nome.' });
    }
    if (err.message?.includes('Record to update not found')) {
      throw createError({ statusCode: 404, statusMessage: 'Tratamento não encontrado.' });
    }
    throw createError({ statusCode: 500, statusMessage: 'Falha interna ao atualizar tratamento.' });
  }
});