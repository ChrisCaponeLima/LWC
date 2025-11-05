// /server/api/admin/treatments/areas/measure.delete.ts - V1.0 - Exclusão da Regra de Medida de uma Área (Admin)

import { defineEventHandler, createError, readBody, H3Event } from 'h3';
import { verifyAuthToken } from '~/server/utils/auth';
import { AreaService } from '~/server/services/AreaService';
import { Prisma } from '@prisma/client';

export default defineEventHandler(async (event: H3Event) => {
    const authPayload = verifyAuthToken(event);
    const areaService = new AreaService();

    // Autorização: Apenas perfis de gerenciamento
    const allowedRoles = ['admin', 'owner'];
    if (!allowedRoles.includes(authPayload.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas administradores podem gerenciar regras de medida.' });
    }
    
    try {
        const body = await readBody(event);
        const area_id = body.area_id;

        // Validação
        if (!area_id || typeof area_id !== 'number') {
            throw createError({ statusCode: 400, statusMessage: 'O ID da área é obrigatório e deve ser um número.' });
        }

        const deletedMeasure = await areaService.deleteAreaMeasure(area_id);

        return { 
            success: true, 
            message: `Regra de medida deletada com sucesso para a Área ID ${area_id}.`,
            deletedId: deletedMeasure.id
        };

    } catch (err: any) {
        console.error('[AREAS.MEASURE.DELETE] Erro ao deletar medida:', err);
        if (err.statusCode) throw err;
        
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erro de registro não encontrado (ID inválido)
            if (err.code === 'P2025') {
                throw createError({ statusCode: 404, statusMessage: 'Regra de medida para esta área não encontrada.' });
            }
        }
        
        throw createError({ statusCode: 500, statusMessage: 'Falha interna ao deletar regra de medida.' });
    }
});