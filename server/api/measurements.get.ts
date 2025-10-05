// /server/api/measurements.get.ts - Adicionando Autenticação
import { defineEventHandler, createError, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyToken } from '~/server/utils/auth'; // Importe a sua função de autenticação

interface AuthPayload { userId: number; role: string }

export default defineEventHandler(async (event: H3Event) => {
    const token = event.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
        throw createError({ statusCode: 401, statusMessage: 'Não autorizado. Token não fornecido.' });
    }

    try {
        const payload = verifyToken(token) as AuthPayload;
        // Opcional: Adicionar verificação de role, se apenas alguns usuários podem ver as medidas.
    } catch (e) {
        throw createError({ statusCode: 401, statusMessage: 'Token inválido ou expirado.' });
    }
    
    // Busca todas as medidas definidas na tabela measurements
    const measurements = await prisma.measurements.findMany({
        select: {
            id: true,
            name: true,
            unit: true,
        },
        orderBy: { name: 'asc' }
    });
    
    return measurements;
});