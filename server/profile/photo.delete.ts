// /server/api/profile/photo.delete.ts - V1.0 - Remoção da foto de perfil e do Cloudinary
import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyToken } from '~/server/utils/auth';
import { deleteFromCloudinary } from '~/server/utils/cloudinary'; // Assumindo que você tem uma função de exclusão

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
        // 1. Buscar usuário para obter a URL da foto atual
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { 
                photo_perfil_url: true 
            }
        });

        if (!user) {
            throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' });
        }
        
        const oldUrl = user.photo_perfil_url;

        // 2. Tentar remover o recurso do Cloudinary, se existir uma URL
        if (oldUrl) {
            // A função deleteFromCloudinary deve ser capaz de extrair o Public ID da URL
            // Se a função 'deleteFromCloudinary' não existir, precisaremos criá-la
            // Para este exemplo, assumimos que ela existe e lida com o erro se o recurso não for encontrado.
            try {
                await deleteFromCloudinary(oldUrl);
            } catch (cloudError) {
                console.warn('Aviso: Falha ao deletar o recurso antigo no Cloudinary, continuando com a atualização do DB.', cloudError);
                // Continuamos a execução para não bloquear a remoção do DB
            }
        }

        // 3. Atualiza o banco de dados definindo a URL como NULL
        const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: { 
                photo_perfil_url: null // Define o campo como nulo (removido)
            },
            select: { 
                photo_perfil_url: true 
            }
        });

        // 4. Retorna o sucesso (a URL será null)
        return {
            message: 'Foto de perfil removida com sucesso.',
            photo_perfil_url: updatedUser.photo_perfil_url // Deve ser null
        };

    } catch (error: any) {
        console.error('Erro ao remover foto de perfil (API):', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, statusMessage: 'Erro interno ao remover a foto.' });
    }
});