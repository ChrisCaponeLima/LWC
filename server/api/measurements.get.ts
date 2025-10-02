// /server/api/measurements.get.ts
import { defineEventHandler } from 'h3';
import { prisma } from '~/server/utils/db';

export default defineEventHandler(async () => {
    // Busca todas as medidas definidas na tabela measurements
    const measurements = await prisma.measurements.findMany({
        select: {
            id: true,
            name: true,
            unit: true,
        },
        orderBy: { name: 'asc' }
    });
    
    // Retorna a lista
    return measurements;
});