// /server/api/users/find-by-phone/index.post.ts - V1.0 - Endpoint para buscar ID de usuário por número de telefone.

import { defineEventHandler, createError, readBody } from 'h3';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '~/server/utils/auth'; 

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
    // 1. SEGURANÇA: Verificar autenticação
    const userData = verifyAuthToken(event); 
    const currentUserId = userData.userId; 

    // 2. OBTER TELEFONE do corpo da requisição
    const { phone } = await readBody(event);

    if (!phone) {
        throw createError({ statusCode: 400, message: 'O número de telefone é obrigatório.' });
    }

    const cleanPhone = String(phone).replace(/\D/g, ''); // Garantir apenas números

    if (cleanPhone.length < 10) {
         throw createError({ statusCode: 400, message: 'O número de telefone deve ter pelo menos 10 dígitos (DDD + Número).' });
    }

    try {
        // 3. BUSCAR PARCEIRO NO BANCO DE DADOS
        const partner = await prisma.users.findFirst({
            where: {
                // Supondo que o campo `telefone` armazena o número limpo (apenas dígitos)
                telefone: cleanPhone, 
                // CRUCIAL: Não permitir que o usuário inicie um chat consigo mesmo
                id: { not: currentUserId } 
            },
            select: {
                id: true,
                username: true,
                apelido: true,
            }
        });

        if (!partner) {
            throw createError({ statusCode: 404, message: 'Nenhum usuário encontrado com este telefone.' });
        }

        // 4. RETORNO DE SUCESSO
        return {
            partnerId: partner.id,
            partnerName: partner.apelido || partner.username,
        };

    } catch (error) {
        // Se for um erro 404, propaga a mensagem, senão, retorna erro genérico
        if (error.statusCode === 404) throw error;
        
        console.error('ERRO AO BUSCAR USUÁRIO POR TELEFONE:', error);
        throw createError({ statusCode: 500, message: 'Falha interna ao buscar o usuário.' });
    }
});