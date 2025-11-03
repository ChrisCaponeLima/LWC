// /server/api/products/update.put.ts

import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  try {
    const userData = verifyAuthToken(event);
    const allowedRoles = ['admin', 'owner'];
    const userRole = String(userData.role).trim().toLowerCase();

    if (!allowedRoles.includes(userRole)) {
      throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas administradores podem atualizar produtos.' });
    }

    const body = await readBody(event);
    const { id, product_name, description, precoP, precoM, precoG, precoGG, is_active } = body;

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID do produto é obrigatório para atualização.' });
    }

    const updatedProduct = await prisma.products.update({
      where: { id: parseInt(id) },
      data: {
        product_name: product_name ? String(product_name) : undefined,
        description: description ? String(description) : undefined,
        precoP: precoP ? parseFloat(precoP) : null,
        precoM: precoM ? parseFloat(precoM) : null,
        precoG: precoG ? parseFloat(precoG) : null,
        precoGG: precoGG ? parseFloat(precoGG) : null,
        is_active: typeof is_active === 'boolean' ? is_active : undefined,
      },
      select: { id: true, product_name: true },
    });

    return { success: true, product: updatedProduct, message: 'Produto atualizado com sucesso.' };

  } catch (err: any) {
    console.error('Erro ao atualizar produto:', err);
    if (err.statusCode) throw err;
    if (err.message?.includes('Unique constraint failed')) {
      throw createError({ statusCode: 409, statusMessage: 'Já existe outro produto com este nome.' });
    }
    if (err.message?.includes('Record to update not found')) {
      throw createError({ statusCode: 404, statusMessage: 'Produto não encontrado.' });
    }
    throw createError({ statusCode: 500, statusMessage: 'Falha interna ao atualizar produto.' });
  }
});