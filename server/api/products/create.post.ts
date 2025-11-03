// /server/api/products/create.post.ts

import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  try {
    const userData = verifyAuthToken(event);
    const allowedRoles = ['admin', 'owner'];
    const userRole = String(userData.role).trim().toLowerCase();

    // Apenas Admin/Owner podem criar produtos mestres.
    if (!allowedRoles.includes(userRole)) {
      throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas administradores podem cadastrar produtos.' });
    }

    const body = await readBody(event);
    const { product_name, description, precoP, precoM, precoG, precoGG, is_active } = body;

    if (!product_name) {
      throw createError({ statusCode: 400, statusMessage: 'Nome do produto é obrigatório.' });
    }

    const newProduct = await prisma.products.create({
      data: {
        product_name: String(product_name),
        description: description ? String(description) : null,
        precoP: precoP ? parseFloat(precoP) : null,
        precoM: precoM ? parseFloat(precoM) : null,
        precoG: precoG ? parseFloat(precoG) : null,
        precoGG: precoGG ? parseFloat(precoGG) : null,
        is_active: typeof is_active === 'boolean' ? is_active : true,
      },
      select: { id: true, product_name: true },
    });

    return { success: true, product: newProduct, message: 'Produto criado com sucesso.' };

  } catch (err: any) {
    console.error('Erro ao criar produto:', err);
    if (err.statusCode) throw err;
    if (err.message?.includes('Unique constraint failed')) {
      throw createError({ statusCode: 409, statusMessage: 'Já existe um produto com este nome.' });
    }
    throw createError({ statusCode: 500, statusMessage: 'Falha interna ao criar produto.' });
  }
});