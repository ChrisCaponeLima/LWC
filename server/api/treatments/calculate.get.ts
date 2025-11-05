// /server/api/treatments/calculate.get.ts - V1.0 - API Handler para calcular o tamanho (P/M/G/GG) de um tratamento com base na medida

import { defineEventHandler, createError, getQuery, H3Event } from 'h3';
import { verifyAuthToken } from '~/server/utils/auth';
import { AreaService } from '~/server/services/AreaService';

/**
 * Handler para calcular o tamanho do tratamento (sizeKey) com base na Área e na Medida fornecida.
 * Usado pelo frontend na tela de associação do tratamento ao paciente.
 */
export default defineEventHandler(async (event: H3Event) => {
    const authPayload = verifyAuthToken(event);
    const areaService = new AreaService();

    // Autorização: Profissionais, Admins e Owners podem calcular preços de venda
    const allowedRoles = ['profissional', 'admin', 'owner'];
    if (!allowedRoles.includes(authPayload.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas profissionais e administradores podem realizar este cálculo.' });
    }

    const query = getQuery(event);
    const area_id_str = query.area_id as string;
    const measure_str = query.measure as string;

    // 1. Validação e Conversão dos Parâmetros
    const area_id = parseInt(area_id_str);
    const measure = parseFloat(measure_str);

    if (isNaN(area_id) || area_id <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'ID da área de tratamento inválido.' });
    }
    if (isNaN(measure) || measure <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'Medida real do paciente inválida ou ausente.' });
    }

    try {
        // 2. Execução da Lógica de Cálculo
        const result = await areaService.calculateTreatmentSize(area_id, measure);

        // O resultado inclui a chave de tamanho e o ID do fator correspondente
        return { 
            success: true, 
            calculated_size: result.sizeKey,
            factor_id: result.factorId,
            message: `Tamanho calculado com sucesso: ${result.sizeKey}.` 
        };

    } catch (err: any) {
        console.error('[TREATMENTS.CALCULATE.GET] Erro no cálculo do tamanho:', err.message, err);
        if (err.statusCode) throw err;
        
        // O erro do service é uma string amigável para o frontend
        if (err.message.includes('fator de tamanho') || err.message.includes('limite')) {
            throw createError({ statusCode: 422, statusMessage: err.message });
        }
        
        throw createError({ statusCode: 500, statusMessage: 'Falha interna ao calcular o tamanho do tratamento.' });
    }
});