// /server/api/professional/user/[id]/photos.get.ts - V2.5 - Parseamento da Anotação JSON
import { defineEventHandler, createError, H3Event } from 'h3';
import { prisma } from '~/server/utils/db'; 
import { verifyAuthToken } from '~/server/utils/auth';

export default defineEventHandler(async (event: H3Event) => {
  const authPayload = verifyAuthToken(event);
  
  if (!['profissional', 'admin', 'owner'].includes(authPayload.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas perfis autorizados podem visualizar as fotos dos pacientes.' });
  }

  const targetUserId = parseInt(event.context.params?.id as string); 

  if (isNaN(targetUserId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID do usuário alvo inválido.' });
  }

  try {
    // 1. Buscar fotos do paciente.
    const photos = await prisma.user_treatment_photos_annotations.findMany({ 
      where: {
        user_id: targetUserId, 
      },
      select: {
        id: true,
        photo_url: true, 
        photo_type: true,
        annotation_data: true, // Continua sendo a string do banco
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

    // 2. Mapear Dados com Optional Chaining e Parseamento de JSON
    const mappedPhotos = photos.map(photo => {
      const treatmentName = photo.user_treatments?.treatments?.treatment_name;
            
            let annotationDataParsed: object | null = null;
            
            // 🟢 TENTAR PARSEAR O JSON se o campo annotation_data não for nulo
            if (photo.annotation_data) {
                try {
                    annotationDataParsed = JSON.parse(photo.annotation_data);
                } catch (e) {
                    console.error('Erro ao fazer parse do annotation_data (JSON inválido):', e);
                    // Se o JSON for inválido, enviamos null ou a string original dependendo do que o frontend espera.
                    // Vamos enviar null para forçar o frontend a não tentar renderizar dados corrompidos.
                    annotationDataParsed = null; 
                }
            }

      return {
        id: photo.id,
        url: photo.photo_url,
        photoType: photo.photo_type, 
        annotationData: annotationDataParsed, // ⬅️ DADO ENVIADO COMO OBJETO OU NULL
        hasAnnotation: !!photo.annotation_data,
        createdAt: photo.created_at.toISOString(),
        associatedTreatment: treatmentName
          ? {
            userTreatmentId: photo.user_treatment_id,
            name: treatmentName,
          }
          : null
      };
    });


    return {
      photos: mappedPhotos,
      count: mappedPhotos.length
    };

  } catch (err: any) {
    console.error('Erro ao buscar fotos de avaliação (V2.5):', err);
    throw createError({ statusCode: 500, statusMessage: 'Falha interna ao carregar as fotos de avaliação.' });
  }
});