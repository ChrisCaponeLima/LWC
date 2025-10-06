import { defineEventHandler, readBody, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyToken, verifyPassword, hashPassword } from '~/server/utils/auth'; // 🚨 IMPORTANTE: Assegure-se de que verifyPassword e hashPassword estão em auth.ts

interface AuthPayload {
    userId: number;
}

export default defineEventHandler(async (event) => {
    const token = event.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
        throw createError({ statusCode: 401, statusMessage: 'Não autorizado. Token não fornecido.' });
    }

    let payload: AuthPayload;
    try {
        payload = verifyToken(token) as AuthPayload;
    } catch (e) {
        throw createError({ statusCode: 401, statusMessage: 'Token inválido ou expirado.' });
    }
    
    const userId = payload.userId;

    try {
        const body = await readBody(event);
        const { currentPassword, newPassword } = body;
        
        // 1. Validação simples
        if (!currentPassword || !newPassword) {
            throw createError({ statusCode: 400, statusMessage: 'Senha atual e nova senha são obrigatórias.' });
        }
        if (newPassword.length < 6) {
            throw createError({ statusCode: 400, statusMessage: 'A nova senha deve ter no mínimo 6 caracteres.' });
        }

        // 2. Busca o usuário para verificar a senha
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { password_hash: true }
        });

        if (!user || !user.password_hash) {
            throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado ou sem hash de senha.' });
        }

        // 3. Verifica a senha atual
        const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash);
        
        if (!isCurrentPasswordValid) {
            // MENSAGEM GENÉRICA DE SEGURANÇA: Não diga "senha atual incorreta"
            throw createError({ statusCode: 401, statusMessage: 'Falha na autenticação. Verifique suas credenciais.' });
        }
        
        // 4. Gera o novo hash da senha
        const newPasswordHash = await hashPassword(newPassword);

        // 5. Atualiza a senha no banco de dados
        await prisma.users.update({
            where: { id: userId },
            data: { 
                password_hash: newPasswordHash,
                // Opcional: Forçar logout em todos os outros dispositivos
                // last_login: new Date(), 
            }
        });

        // Sucesso
        return { message: 'Senha atualizada com sucesso.' };

    } catch (error: any) {
        console.error('Erro ao atualizar senha (API):', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, statusMessage: 'Erro interno ao processar a alteração de senha.' });
    }
});