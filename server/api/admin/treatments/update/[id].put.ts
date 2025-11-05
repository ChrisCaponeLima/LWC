// /server/api/admin/treatments/update/[id].put.ts - V1.0 - Atualização de Tratamento Existente

import { defineEventHandler, readBody, createError, getRouterParams } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';
import { Prisma } from '@prisma/client';

export default defineEventHandler(async (event) => {
    // 1. AUTENTICAÇÃO e AUTORIZAÇÃO
    let userData;
    try {
        userData = verifyAuthToken(event);
        const allowedRoles = ['admin', 'owner'];
        const userRole = String(userData.role).trim().toLowerCase();

        if (!allowedRoles.includes(userRole)) {
            throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas administradores e proprietários podem atualizar tratamentos.' });
        }
    } catch (err) {
        // Se a verificação falhar (token inválido/expirado), relança o erro
        if (err.statusCode) throw err;
        throw createError({ statusCode: 401, statusMessage: 'Não autorizado ou Token Inválido.' });
    }

    // 2. OBTENÇÃO DO ID E BODY
    const params = getRouterParams(event);
    const id = parseInt(params.id);

    if (isNaN(id)) {
        throw createError({ statusCode: 400, statusMessage: 'ID do tratamento inválido.' });
    }

    const body = await readBody(event);
    
    // Converte os preços string (ex: "12.50") para Decimal do Prisma
    const parseDecimal = (value: string | undefined): Prisma.Decimal | null => {
        if (!value || isNaN(parseFloat(value))) return null;
        // O valor já vem saneado do frontend (com ponto decimal: "12.50")
        return new Prisma.Decimal(value);
    };

    const {
        treatment_name,
        description,
        precoP,
        precoM,
        precoG,
        precoGG,
    } = body;

    if (!treatment_name || treatment_name.trim() === '') {
        throw createError({ statusCode: 400, statusMessage: 'O nome do tratamento é obrigatório.' });
    }

    try {
        // 3. ATUALIZAÇÃO DO TRATAMENTO NO BANCO DE DADOS
        const updatedTreatment = await prisma.treatments.update({
            where: { id: id },
            data: {
                treatment_name: treatment_name.trim(),
                description: description || '', // Permite descrição opcional
                precoP: parseDecimal(precoP),
                precoM: parseDecimal(precoM),
                precoG: parseDecimal(precoG),
                precoGG: parseDecimal(precoGG),
            },
            select: {
                id: true,
                treatment_name: true,
            }
        });

        // 4. RETORNO DE SUCESSO
        return { 
            status: 'success', 
            message: `Tratamento "${updatedTreatment.treatment_name}" atualizado com sucesso!`,
            treatmentId: updatedTreatment.id
        };

    } catch (err: any) {
        console.error(`Erro ao atualizar tratamento ID ${id}:`, err);

        // Trata erro de unicidade (se tentar atualizar para um nome já existente)
        if (err.code === 'P2002' && err.meta?.target.includes('treatment_name')) {
            throw createError({ statusCode: 409, statusMessage: 'Já existe outro tratamento com este nome.' });
        }
        
        // Trata erro de registro não encontrado
        if (err.code === 'P2025') {
            throw createError({ statusCode: 404, statusMessage: 'Tratamento não encontrado.' });
        }

        // Erro genérico
        throw createError({ statusCode: 500, statusMessage: 'Falha interna ao atualizar o tratamento.' });
    }
});