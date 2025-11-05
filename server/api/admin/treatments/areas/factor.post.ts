// /server/api/admin/treatments/areas/factor.post.ts - V1.0 - Criação/Atualização de Fator de Tamanho (Admin)

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
        const { area_id, size_key, measure_min, measure_max } = body;

        // 1. Validação de Dados
        if (!area_id || typeof area_id !== 'number') {
            throw createError({ statusCode: 400, statusMessage: 'O ID da área é obrigatório e deve ser um número.' });
        }
        if (!size_key || !VALID_SIZE_KEYS.includes(size_key)) {
            throw createError({ statusCode: 400, statusMessage: `Chave de tamanho (size_key) inválida. Valores aceitos: ${VALID_SIZE_KEYS.join(', ')}.` });
        }
        
        // Converte e valida os limites da medida
        const min = parseFloat(measure_min);
        const max = parseFloat(measure_max);

        if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || min > max) {
             throw createError({ 
                statusCode: 400, 
                statusMessage: 'Os valores de medida (mínimo e máximo) são inválidos ou o mínimo é maior que o máximo.' 
            });
        }
        
        // 2. Dados para o Service
        const factorData = {
            area_id,
            size_key: size_key as 'P' | 'M' | 'G' | 'GG', // Confirma o tipo após a validação
            measure_min: min,
            measure_max: max,
        };

        const result = await areaService.upsertTreatmentFactor(factorData);

        return { 
            success: true, 
            factor: result, 
            message: `Fator de tamanho ${size_key} para a Área ID ${area_id} criado/atualizado com sucesso.` 
        };

    } catch (err: any) {
        console.error('[AREAS.FACTOR.POST] Erro ao criar/atualizar fator:', err);
        if (err.statusCode) throw err;
        
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Em caso de erro de Foreign Key (Area ID inexistente)
            if (err.code === 'P2003') {
                throw createError({ statusCode: 404, statusMessage: 'A Área de Tratamento especificada não existe (Foreign Key error).' });
            }
        }
        
        throw createError({ statusCode: 500, statusMessage: 'Falha interna ao criar/atualizar fator de tamanho.' });
    }
});