// /server/api/auth.post.ts - V1.1 - Garantia do campo photo_perfil_url no retorno

// ⚠️ Se você ainda não tem, crie uma variável de ambiente JWT_SECRET no seu .env.
// Por exemplo: JWT_SECRET="sua_chave_secreta_aqui"

import { defineEventHandler, readBody, createError } from 'h3';
import { prisma } from '~/server/utils/db'; // Mantido: '~/server/utils/db'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
    try {
        const { username, password } = await readBody(event);
        
        // Validação básica
        if (!username || !password) {
            throw createError({ statusCode: 400, statusMessage: 'Nome de usuário e senha são obrigatórios.' });
        }

        // 1. Busca o usuário
        const user = await prisma.users.findUnique({
            where: { username },
        });

        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Credenciais inválidas.' });
        }

        // 2. Compara a senha
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            throw createError({ statusCode: 401, statusMessage: 'Credenciais inválidas.' });
        }
        
        // --- NOVO PASSO CRÍTICO: Geração do Token ---
        
        // 3. Gera o Token JWT após autenticação bem-sucedida
        // Usa o ID e a role do usuário para o payload do token
        const token = jwt.sign(
            { userId: user.id, role: user.role }, 
            process.env.JWT_SECRET || 'fallback_secret_NAO_USAR_EM_PRODUCAO', 
            { expiresIn: '1d' }
        );

        // 4. Retorna os dados do usuário JUNTO COM O TOKEN
        // 🚨 Double Check: Todos os campos importantes estão aqui, especialmente 'role' e 'photo_perfil_url'
        return {
            token: token,
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role, // O CAMPO CRÍTICO PARA O MENU ADMIN
            apelido: user.apelido,
            photo_perfil_url: user.photo_perfil_url, // Corrigido para corresponder ao DB e Store
            heightCm: user.height_cm,
            initialWeight: user.initial_weight_kg, 
        };
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }
        console.error('Erro de autenticação:', error);
        throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor.' });
    }
});