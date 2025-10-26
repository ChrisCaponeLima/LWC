// /server/api/professional/user/[id]/photos.get.ts - V1.2 - Incluído 'annotation_data' no retorno
import { defineEventHandler, createError, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';
// Removida a importação 'import { parseInt } from 'lodash';'

export default defineEventHandler(async (event: H3Event) => {
    const authPayload = verifyAuthToken(event);
    
    // 1. Autorização: Apenas profissionais (e admin/owner) podem acessar
    if (!['profissional', 'admin', 'owner'].includes(authPayload.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas perfis autorizados podem visualizar as fotos dos pacientes.' });
    }

    const targetUserId = parseInt(event.context.params?.id as string); 

    if (isNaN(targetUserId)) {
        throw createError({ statusCode: 400, statusMessage: 'ID do usuário alvo inválido.' });
    }

    try {
        // 2. Buscar todas as fotos do paciente alvo
        const photos = await prisma.userTreatmentPhotoAnnotation.findMany({ // Nome corrigido da tabela
            where: {
                user_id: targetUserId,
            },
            select: {
                id: true,
                photo_url: true, 
                photo_type: true,
                annotation_data: true, // 🚨 ESSENCIAL: Campo agora selecionado
                created_at: true,
                user_treatment_id: true,
                user_treatments: {
                    select: {
                        treatments: {
                            select: {
                                treatment_name: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // 3. Mapear e Limpar Dados
        const mappedPhotos = photos.map(photo => ({
            id: photo.id,
            url: photo.photo_url,
            type: photo.photo_type,
            annotation_data: photo.annotation_data, // 🚨 NOVO: Retorna a string JSON
            hasAnnotation: !!photo.annotation_data,
            createdAt: photo.created_at.toISOString(),
            associatedTreatment: photo.user_treatments
                ? {
                    userTreatmentId: photo.user_treatment_id,
                    name: photo.user_treatments.treatments.treatment_name,
                }
                : null
        }));


        return {
            photos: mappedPhotos,
            count: mappedPhotos.length
        };

    } catch (err: any) {
        console.error('Erro ao buscar fotos de avaliação:', err);
        if (err.statusCode) throw err;
        throw createError({ statusCode: 500, statusMessage: 'Falha interna ao carregar as fotos de avaliação.' });
    }
});