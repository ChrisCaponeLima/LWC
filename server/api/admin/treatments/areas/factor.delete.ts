// /server/api/admin/treatments/areas/factor.delete.ts - V1.0 - Exclusão de Fator de Tamanho (Admin)

import { defineEventHandler, createError, readBody, H3Event } from 'h3';
import { verifyAuthToken } from '~/server/utils/auth';
import { AreaService } from '~/server/services/AreaService';
import { Prisma } from '@prisma/client';

// Tipos de tamanho permitidos (size_key)
const VALID_SIZE_KEYS = ['P', 'M', 'G', 'GG'];

export default defineEventHandler(async (event: H3Event) => {
    const authPayload = verifyAuthToken(event);
    const areaService = new AreaService();

    // Autorização: Apenas perfis de gerenciamento
    const allowedRoles = ['admin', 'owner'];
    if (!allowedRoles.includes(authPayload.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas administradores podem gerenciar fatores de tamanho.' });
    }
    
    try {
        const body = await readBody(event);
        const { area_id, size_key } = body;

        // 1. Validação de Dados
        if (!area_id || typeof area_id !== 'number') {
            throw createError({ statusCode: 400, statusMessage: 'O ID da área é obrigatório e deve ser um número.' });
        }
        if (!size_key || !VALID_SIZE_KEYS.includes(size_key)) {
            throw createError({ statusCode: 400, statusMessage: `Chave de tamanho (size_key) inválida. Valores aceitos: ${VALID_SIZE_KEYS.join(', ')}.` });
        }
        
        // 2. Execução do Service
        const deletedFactor = await areaService.deleteTreatmentFactor(area_id, size_key as 'P' | 'M' | 'G' | 'GG');

        return { 
            success: true, 
            message: `Fator de tamanho ${size_key} deletado para a Área ID ${area_id}.`,
            deletedFactor: deletedFactor
        };

    } catch (err: any) {
        console.error('[AREAS.FACTOR.DELETE] Erro ao deletar fator:', err);
        if (err.statusCode) throw err;
        
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erro de registro não encontrado (ID inválido)
            if (err.code === 'P2025') {
                throw createError({ statusCode: 404, statusMessage: `Fator de tamanho ${body.size_key} não encontrado para a Área ID ${body.area_id}.` });
            }
        }
        
        throw createError({ statusCode: 500, statusMessage: 'Falha interna ao deletar fator de tamanho.' });
    }
});