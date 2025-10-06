// /server/api/profile/photo.put.ts - V1.0 - Atualização da foto de perfil
import { defineEventHandler, createError, readMultipartFormData } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyToken } from '~/server/utils/auth';
import { uploadToCloudinary } from '~/server/utils/cloudinary'; // Reutilizando sua função existente

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
        // Lendo os dados multipart/form-data
        const formData = await readMultipartFormData(event);
        
        // 1. Encontra o arquivo (o nome do campo é 'profile_photo', conforme ProfileForm.vue V4.0)
        const photoFile = formData?.find(item => item.name === 'profile_photo' && item.filename);

        if (!photoFile) {
            throw createError({ statusCode: 400, statusMessage: 'Nenhum arquivo de foto de perfil enviado.' });
        }
        
        // 2. Upload para o Cloudinary (Reutilizando a função existente)
        // Usamos uma pasta específica para fotos de perfil
        const newPhotoUrl = await uploadToCloudinary(photoFile, 'profile_photos');
        
        if (!newPhotoUrl) {
            throw createError({ statusCode: 500, statusMessage: 'Falha no upload da foto para o armazenamento externo.' });
        }

        // 3. Atualiza a URL no banco de dados
        const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: { 
                photo_perfil_url: newPhotoUrl 
            },
            select: { // Retorna o mínimo necessário para a store
                id: true,
                username: true,
                apelido: true,
                email: true,
                role: true,
                birthdate: true,
                sexo: true,
                photo_perfil_url: true, // A nova URL é a principal
                initial_weight_kg: true,
                height_cm: true,
            }
        });
        
        // Função de formatação de data para consistência com o frontend
        const formatDbDate = (dbDate: Date | null | undefined) => {
             if (!dbDate) return null;
             return dbDate.toISOString().split('T')[0];
        };

        // Retorna o objeto de usuário formatado para atualização da store
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
        console.error('Erro ao atualizar foto de perfil (API):', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, statusMessage: 'Erro interno ao processar a foto.' });
    }
});