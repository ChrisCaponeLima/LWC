// /server/api/users/[id]/treatment-photos.get.ts - V1.1 - Ajuste da tabela principal de busca para 'user_treatment_photos' (a tabela de fotos) ao invés de 'user_treatment_photos_annotations' (a tabela de anotações).
import { defineEventHandler, createError, H3Event } from 'h3';
import { prisma } from '~/server/utils/db'; 
import { verifyAuthToken } from '~/server/utils/auth';

export default defineEventHandler(async (event: H3Event) => {
 const authPayload = verifyAuthToken(event);
 
 const targetUserId = parseInt(event.context.params?.id as string); 

 if (isNaN(targetUserId)) {
  throw createError({ statusCode: 400, statusMessage: 'ID do usuário alvo inválido.' });
 }

 // 🛑 VERIFICAÇÃO DE AUTORIZAÇÃO: O usuário só pode buscar suas próprias fotos (exceto Admin/Owner)
 if (authPayload.userId !== targetUserId && !['admin', 'owner'].includes(authPayload.role)) {
  throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Usuário não tem permissão para visualizar fotos de terceiros.' });
 }

 try {
  // 1. Buscar fotos de tratamento (da tabela correta: user_treatment_photos).
  const photos = await prisma.user_treatment_photos.findMany({ 
   where: {
    user_id: targetUserId, 
    // 💡 Excluir fotos privadas se o usuário não for profissional/admin (A ser considerado no futuro).
    // is_private: { equals: false }
   },
   select: {
    id: true,
    file_url: true, // ⬅️ Nova chave de URL (de 'photo_url' para 'file_url')
    created_at: true,
    treatment_id: true,
    treatments: { // Relation para obter o nome do tratamento
     select: {
      treatment_name: true,
     }
    },
    // Incluir as anotações relacionadas (se for necessário usar os dados da anotação, como o annotation_data)
    user_treatment_photos_annotations: {
     select: {
      annotation_data: true,
      photo_type: true, // Exemplo de dado que pode estar na anotação
     },
     orderBy: { created_at: 'desc' },
     take: 1, // Pega a anotação mais recente se houver mais de uma
    }
   },
   orderBy: {
    created_at: 'desc'
   }
  });

  // 2. Mapear Dados
  const mappedPhotos = photos.map(photo => {
   const treatmentName = photo.treatments.treatment_name;
   const annotation = photo.user_treatment_photos_annotations[0]; // Pega a primeira (mais recente) anotação
      
   let annotationDataParsed: object | null = null;
      
   if (annotation?.annotation_data) {
    try {
      // Parseia a anotação se existir
      annotationDataParsed = JSON.parse(annotation.annotation_data);
    } catch (e) {
      console.error('Erro ao fazer parse do annotation_data (JSON inválido) para user:', targetUserId, e);
      annotationDataParsed = null; 
    }
   }

   return {
    id: photo.id,
    url: photo.file_url, // ⬅️ Usando file_url
    photoType: annotation?.photo_type || 'default', // Tipo da foto vem da anotação ou 'default'
    annotationData: annotationDataParsed, 
    hasAnnotation: !!annotation?.annotation_data,
    createdAt: photo.created_at.toISOString(),
    associatedTreatment: {
     userTreatmentId: photo.treatment_id, // Usando treatment_id como referência
     name: treatmentName,
    }
   };
  });


  return {
   photos: mappedPhotos,
   count: mappedPhotos.length
  };

 } catch (err: any) {
  console.error('Erro ao buscar fotos de tratamento para o user (V1.1):', err);
  throw createError({ statusCode: 500, statusMessage: 'Falha interna ao carregar as fotos de tratamento.' });
 }
});