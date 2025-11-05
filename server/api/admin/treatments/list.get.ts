// /server/api/admin/treatments/list.get.ts - V1.4 - Confirmação do Campo 'description' (Agora existente na base)

import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
    try {
        const userData = verifyAuthToken(event);
        const allowedRoles = ['admin', 'owner']; 
        const userRole = String(userData.role).trim().toLowerCase();

        if (!allowedRoles.includes(userRole)) {
            throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas administradores e proprietários podem gerenciar tratamentos.' });
        }

        const treatments = await prisma.treatments.findMany({
            select: {
                id: true,
                treatment_name: true,
                description: true, // MANTIDO: Agora o campo existe no modelo/base.
                precoP: true,
                precoM: true,
                precoG: true,
                precoGG: true,
            },
            orderBy: { treatment_name: 'asc' },
        });

        // 3. SERIALIZAÇÃO e RETORNO (Mapeamento de Decimal para String)
        const serializedTreatments = treatments.map(t => ({
            ...t,
            // Mantida a correção para Decimal opcional (null)
            precoP: t.precoP?.toString() || '0.00', 
            precoM: t.precoM?.toString() || '0.00', 
            precoG: t.precoG?.toString() || '0.00', 
            precoGG: t.precoGG?.toString() || '0.00',
        }));

        // ✅ Retorna o array diretamente
        return serializedTreatments; 

    } catch (err: any) {
        console.error('Erro ao listar tratamentos (Admin):', err);
        // Exibe detalhes do erro 500 no console do servidor para diagnóstico
        if (err.statusCode) throw err;
        throw createError({ statusCode: 500, statusMessage: 'Falha interna ao carregar a lista de tratamentos.' });
    }
});