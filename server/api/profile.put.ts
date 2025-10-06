import { defineEventHandler, readBody, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyToken } from '~/server/utils/auth';

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
        
        // Validação de dados (simples)
        if (!body.username || !body.email || !body.sexo) {
            throw createError({ statusCode: 400, statusMessage: 'Dados obrigatórios (nome, email, sexo) ausentes.' });
        }

        // Prepara os dados para atualização (apenas campos que podem ser editados)
        const updateData: Record<string, any> = {
            username: body.username,
            apelido: body.apelido === '' ? null : body.apelido, // Salva vazio como NULL no DB
            email: body.email,
            sexo: body.sexo,
            // A data pode ser null se o usuário limpar
            birthdate: body.birthdate ? new Date(body.birthdate) : null,
            // Não permitimos a edição de initial_weight_kg ou height_cm
        };

        const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: updateData,
            select: { // Seleciona apenas os campos necessários para retornar à store
                id: true,
                username: true,
                apelido: true,
                email: true,
                role: true,
                birthdate: true,
                sexo: true,
                photo_perfil_url: true,
                initial_weight_kg: true,
                height_cm: true,
            }
        });

        // Formatamos as datas antes de enviar para o frontend
        const formatDbDate = (dbDate: Date | null | undefined) => {
            if (!dbDate) return null;
            return dbDate.toISOString().split('T')[0];
        };

        return {
            id: updatedUser.id,
            username: updatedUser.username,
            apelido: updatedUser.apelido,
            email: updatedUser.email,
            role: updatedUser.role,
            birthdate: formatDbDate(updatedUser.birthdate),
            sexo: updatedUser.sexo,
            photo_perfil_url: updatedUser.photo_perfil_url,
            initialWeight: updatedUser.initial_weight_kg?.toString() || null,
            heightCm: updatedUser.height_cm?.toString() || null,
        };

    } catch (error: any) {
        console.error('Erro ao atualizar perfil (API):', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, statusMessage: 'Erro interno ao atualizar perfil.' });
    }
});