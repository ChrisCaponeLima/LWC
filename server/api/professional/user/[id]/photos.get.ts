// /server/api/professional/user/[id]/photos.get.ts - V3.2 - Ajuste da chave de leitura de 'Consideration' (PascalCase) para 'consideration' (camelCase) na consulta e no mapeamento.
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
 // Tabela principal: user_treatment_photos 
 const photos = await prisma.user_treatment_photos.findMany({ 
 where: {
  user_id: targetUserId, 
 },
 select: {
  id: true,
  file_url: true, 
  created_at: true,
  treatment_id: true, 
  description: true, 
  consideration: true, // CORREÇÃO: Usando 'consideration' (camelCase)
  treatments: { // Relacionamento DIRETO com treatments
  select: {
   treatment_name: true,
  }
  },
  // Buscamos a anotação relacionada (Tabela 2)
  user_treatment_photos_annotations: {
  select: {
   annotation_data: true,
   photo_type: true, 
  },
  orderBy: { created_at: 'desc' },
  take: 1, 
  }
 },
 orderBy: {
  created_at: 'desc'
 }
 });

 // 2. Mapear Dados
 const mappedPhotos = photos.map(photo => {
 // Se treatment_id for null, photo.treatments será null. Usamos optional chaining.
 const treatmentName = photo.treatments?.treatment_name;
 const annotation = photo.user_treatment_photos_annotations[0]; // Pega a primeira (mais recente) anotação
  
 let annotationDataParsed: object | null = null;
  
 if (annotation?.annotation_data) {
  try {
  annotationDataParsed = JSON.parse(annotation.annotation_data);
  } catch (e) {
  console.error('Erro ao fazer parse do annotation_data (JSON inválido) (V3.2):', targetUserId, e);
  annotationDataParsed = null; 
  }
 }

 // Tratamento do nome do tratamento (null se não houver)
 const finalTreatmentName = (typeof treatmentName === 'string' && treatmentName.trim() !== '') ? treatmentName : null;

 return {
  id: photo.id,
  url: photo.file_url, 
  photoType: annotation?.photo_type || 'Geral', // Tipo da foto (fallback alterado para 'Geral')
  annotationData: annotationDataParsed, 
  hasAnnotation: !!annotation?.annotation_data,
  createdAt: photo.created_at.toISOString(),
  description: photo.description, // Mapeamento da descrição
  consideration: photo.consideration, // CORREÇÃO: Mapeamento do campo 'consideration'
  associatedTreatment: finalTreatmentName
  ? {
   userTreatmentId: photo.treatment_id, 
   name: finalTreatmentName, 
  }
  : null // Se não há tratamento, envia null
 };
 });


 return {
  photos: mappedPhotos,
  count: mappedPhotos.length
 };

} catch (err: any) {
 console.error('Erro ao buscar fotos de avaliação (V3.2):', err);
 throw createError({ statusCode: 500, statusMessage: 'Falha interna ao carregar as fotos de avaliação.' });
}
});