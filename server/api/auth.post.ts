// /server/api/auth.post.ts

// ⚠️ Se você ainda não tem, crie uma variável de ambiente JWT_SECRET no seu .env.
// Por exemplo: JWT_SECRET="sua_chave_secreta_aqui"

import { defineEventHandler, readBody, createError } from 'h3';
import { prisma } from '~/server/utils/db'; // Mantido: '~/server/utils/db'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // 1. NOVO: Importa a biblioteca JWT

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
            process.env.JWT_SECRET || 'fallback_secret_NAO_USAR_EM_PRODUCAO', // Usa a chave secreta (deve ser carregada via runtimeConfig se for no frontend)
            { expiresIn: '1d' } // Expira em 1 dia
        );

        // 4. Retorna os dados do usuário JUNTO COM O TOKEN
        return {
            token: token, // <--- O CAMPO QUE O FRONTEND ESTAVA ESPERANDO!
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            apelido: user.apelido,
            photoUrl: user.photo_perfil_url,
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