// /server/api/products/list.get.ts

import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  try {
    const userData = verifyAuthToken(event);
    const allowedRoles = ['profissional', 'admin', 'owner'];
    const userRole = String(userData.role).trim().toLowerCase();

    if (!allowedRoles.includes(userRole)) {
      throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas profissionais e administradores podem listar produtos.' });
    }

    const products = await prisma.products.findMany({
      select: {
        id: true,
        product_name: true,
        description: true,
        precoP: true,
        precoM: true,
        precoG: true,
        precoGG: true,
        is_active: true,
        created_at: true,
      },
      orderBy: { product_name: 'asc' },
    });

    return products.map(p => ({
      ...p,
      // Garante a serialização correta de Decimal para String se necessário no frontend
      precoP: p.precoP?.toString(), 
      precoM: p.precoM?.toString(), 
      precoG: p.precoG?.toString(), 
      precoGG: p.precoGG?.toString(),
    }));

  } catch (err: any) {
    console.error('Erro ao listar produtos:', err);
    if (err.statusCode) throw err;
    throw createError({ statusCode: 500, statusMessage: 'Falha interna ao carregar a lista de produtos.' });
  }
});