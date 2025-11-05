// /server/api/admin/treatments/create.post.ts - V1.0 - Criação de novo Tratamento (Admin)

import { defineEventHandler, createError, readBody } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';
import { Prisma } from '@prisma/client';

// Helper para converter a string de preço (ex: "1.234,50") para Decimal (ex: 1234.50)
const parsePrice = (priceString: string | undefined): Prisma.Decimal | undefined => {
    if (!priceString) return new Prisma.Decimal(0);
    // Remove pontos de milhar, substitui vírgula decimal por ponto e converte para Decimal
    const cleaned = priceString.replace(/\./g, '').replace(',', '.');
    // Retorna undefined se o valor final for NaN ou vazio
    if (cleaned === '' || isNaN(parseFloat(cleaned))) return new Prisma.Decimal(0);
    
    return new Prisma.Decimal(cleaned);
};

export default defineEventHandler(async (event) => {
    // 1. AUTENTICAÇÃO e AUTORIZAÇÃO
    try {
        const userData = verifyAuthToken(event);
        const allowedRoles = ['admin', 'owner'];
        const userRole = String(userData.role).trim().toLowerCase();

        if (!allowedRoles.includes(userRole)) {
            throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas administradores e proprietários podem criar tratamentos.' });
        }

        // 2. LEITURA E VALIDAÇÃO DO BODY
        const body = await readBody(event);
        
        const {
            treatment_name,
            description,
            precoP,
            precoM,
            precoG,
            precoGG,
        } = body;
        
        // 🚨 Verificação de Variáveis (Padronização)
        if (!treatment_name || treatment_name.length < 3) {
            throw createError({ statusCode: 400, statusMessage: 'O nome do tratamento é obrigatório e deve ter no mínimo 3 caracteres.' });
        }

        // 3. CONVERSÃO DE PREÇOS (Decimal)
        const decimalPrecoP = parsePrice(precoP);
        const decimalPrecoM = parsePrice(precoM);
        const decimalPrecoG = parsePrice(precoG);
        const decimalPrecoGG = parsePrice(precoGG);

        // 4. PERSISTÊNCIA NO BANCO DE DADOS
        const newTreatment = await prisma.treatments.create({
            data: {
                treatment_name,
                description: description || '', // Permite descrição vazia
                precoP: decimalPrecoP,
                precoM: decimalPrecoM,
                precoG: decimalPrecoG,
                precoGG: decimalPrecoGG,
                // Assumindo que você tem campos como created_by_id (se necessário)
                // created_by_id: userData.id,
            },
            select: {
                id: true,
                treatment_name: true,
            }
        });

        return {
            message: `Tratamento "${newTreatment.treatment_name}" criado com sucesso.`,
            id: newTreatment.id,
        };

    } catch (err: any) {
        console.error('Erro ao criar tratamento (Admin):', err);
        
        // Lidar com erros de validação Prisma (ex: campo único) ou erros customizados
        if (err.statusCode) throw err;
        
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Ex: P2002: Unique constraint failed on the {constraint}
            if (err.code === 'P2002') {
                 throw createError({ statusCode: 409, statusMessage: `Um tratamento com este nome já existe.` });
            }
        }

        throw createError({ statusCode: 500, statusMessage: 'Falha interna ao criar o tratamento.' });
    }
});