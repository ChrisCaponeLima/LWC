// /server/api/admin/treatments/areas/measure.post.ts - V1.0 - Criação/Atualização da Regra de Medida de uma Área (Admin)

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
        const { area_id, measure_type, measure_name, is_required } = body;

        // Validação de Dados
        if (!area_id || typeof area_id !== 'number') {
            throw createError({ statusCode: 400, statusMessage: 'O ID da área é obrigatório e deve ser um número.' });
        }
        if (!measure_type || typeof measure_type !== 'string' || measure_type.trim().length === 0) {
            throw createError({ statusCode: 400, statusMessage: 'O Tipo da Medida (measure_type) é obrigatório.' });
        }
        if (!measure_name || typeof measure_name !== 'string' || measure_name.trim().length === 0) {
            throw createError({ statusCode: 400, statusMessage: 'O Nome de Exibição da Medida (measure_name) é obrigatório.' });
        }
        // is_required deve ser um booleano, se vier como string 'true'/'false' precisa de tratamento, mas assumiremos que o frontend envia booleano ou que a validação de tipo TypeScript do Nuxt/H3/Body garante isso.
        
        // Dados para o Service
        const measureData = {
            area_id,
            measure_type: measure_type.trim(),
            measure_name: measure_name.trim(),
            is_required: !!is_required, // Garante que é um booleano
        };

        const result = await areaService.upsertAreaMeasure(measureData);

        return { 
            success: true, 
            measure: result, 
            message: `Regra de medida para a Área ID ${area_id} criada/atualizada com sucesso.` 
        };

    } catch (err: any) {
        console.error('[AREAS.MEASURE.POST] Erro ao criar/atualizar medida:', err);
        if (err.statusCode) throw err;
        
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Em caso de erro de Foreign Key (Area ID inexistente)
            if (err.code === 'P2003') {
                throw createError({ statusCode: 404, statusMessage: 'A Área de Tratamento especificada não existe.' });
            }
        }
        
        throw createError({ statusCode: 500, statusMessage: 'Falha interna ao criar/atualizar regra de medida.' });
    }
});