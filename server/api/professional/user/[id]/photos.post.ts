// /server/api/professional/user/[id]/photos.post.ts - V4.3 - Ajuste da chave de persistência de 'Consideration' (PascalCase) para 'consideration' (camelCase) na Tabela 1, conforme correção do schema.
import { defineEventHandler, readMultipartFormData, createError, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';
import { v2 as cloudinary } from 'cloudinary';
import { Buffer } from 'node:buffer';

const getUserIdFromEvent = (event: H3Event): number => {
const payload = verifyAuthToken(event);
return payload.userId;
};

function bufferToDataURI(buffer: Buffer, mimetype: string): string {
return `data:${mimetype};base64,${buffer.toString('base64')}`
}

export default defineEventHandler(async (event) => {
let professionalUserId: number;
try {
professionalUserId = getUserIdFromEvent(event as H3Event);
} catch (e) {
throw e;
}

const targetUserId = parseInt(event.context.params?.id as string); 

if (isNaN(targetUserId)) {
throw createError({ statusCode: 400, statusMessage: 'ID do usuário alvo inválido.' });
}

const userRole = verifyAuthToken(event).role;
if (!['profissional', 'admin', 'owner'].includes(userRole)) {
throw createError({ statusCode: 403, statusMessage: 'Acesso negado.' });
}

const formData = await readMultipartFormData(event);

if (!formData) {
throw createError({ statusCode: 400, statusMessage: 'Bad Request: Nenhum dado de formulário multipart recebido.' });
}

// 2. Extrair Variáveis e Arquivo
let originalFilePart: any | undefined;
let photoType: string = '';
let annotationData: string | null = null;
let description: string | null = null; 
let consideration: string | null = null; // Variável para o campo consideration

let potentialTreatmentId: number | null = null; 
let potentialUserTreatmentId: number | null = null; 


for (const part of formData) {
const partValue = part.data ? part.data.toString('utf-8') : '';

if (part.name === 'photoFile' && part.filename && part.data) {
originalFilePart = part;
} else if (part.name === 'photoType' && part.data) {
photoType = partValue;
} else if (part.name === 'annotationData' && part.data) {
if (partValue.trim() !== '') {
 annotationData = partValue;
}
} else if (part.name === 'description' && part.data) {
if (partValue.trim() !== '') {
 description = partValue;
}
} else if (part.name === 'consideration' && part.data) { // Leitura do campo 'consideration'
if (partValue.trim() !== '') {
 consideration = partValue;
}
} else if (part.name === 'treatmentId' && part.data) { 
const id = parseInt(partValue);
if (!isNaN(id) && id > 0) {
 potentialTreatmentId = id;
}
} else if (part.name === 'userTreatmentId' && part.data) { 
const id = parseInt(partValue);
if (!isNaN(id) && id > 0) {
 potentialUserTreatmentId = id;
}
}
}

if (!originalFilePart || !photoType || potentialTreatmentId === null) {
throw createError({ 
statusCode: 400, 
statusMessage: 'Bad Request: Imagem, Local/Posição e Tipo de Tratamento são obrigatórios.' 
});
}

const treatmentId: number = potentialTreatmentId;
let userTreatmentId: number | null = null;

if (potentialUserTreatmentId) {
 const userTreatment = await prisma.user_treatments.findFirst({
 where: {
  id: potentialUserTreatmentId,
  user_id: targetUserId,
  treatment_id: treatmentId,
 },
 select: { id: true }
 });

 if (userTreatment) {
 userTreatmentId = userTreatment.id; 
 }
}


// 4. Upload para Cloudinary
let uploadedUrl: string;
let uploadedPublicId: string;
const cloudinaryFolder = `user_assessments/users/${targetUserId}`;

try {
const dataUri = bufferToDataURI(originalFilePart.data, originalFilePart.type || 'image/jpeg');
const uploadResult = await cloudinary.uploader.upload(dataUri, {
folder: `${cloudinaryFolder}/${photoType}`,
resource_type: 'image',
tags: [`user_${targetUserId}`, 'assessment', photoType, `treatment_${treatmentId}`],
});

uploadedUrl = uploadResult.secure_url;
uploadedPublicId = uploadResult.public_id;

} catch (error: any) {
console.error('Erro CRÍTICO no upload para Cloudinary (assessment photo):', error);
throw createError({ statusCode: 500, statusMessage: 'Falha ao fazer upload da foto para avaliação.', data: { details: error.message } });
}

// 5. Encontra o ID do Perfil Profissional
let professionalId: number | null = null;

if (userRole === 'profissional') {
const professionalProfile = await prisma.professionals.findUnique({
where: { user_id: professionalUserId },
select: { id: true }
});

if (professionalProfile) {
professionalId = professionalProfile.id;
} else {
throw createError({ statusCode: 403, statusMessage: 'Perfil profissional não encontrado ou inativo.' });
}
} else {
 professionalId = null;
}


// 6. Configurações condicionais para conexão Prisma

// Objeto de conexão condicional para 'user_treatments' (usado APENAS na Tabela 2)
const userTreatmentRelation = userTreatmentId !== null
 ? { user_treatments: { connect: { id: userTreatmentId } } }
 : {};
 
// Objeto de conexão condicional para 'professionals'
const professionalRelation = professionalId !== null
 ? { professionals: { connect: { id: professionalId } } }
 : {};

 // Objeto de conexão para 'treatments' (Usado na Tabela 1, campo obrigatório)
 const treatmentRelation = { treatments: { connect: { id: treatmentId } } };


// 7. Persistência de Ambas as Tabelas
let dbPhotoId: number | null = null;
let newPhotoAnnotation: any = null;


try {
// Tabela 1: user_treatment_photos (Registro Simples da Foto)
const newSimplePhoto = await prisma.user_treatment_photos.create({
data: {
 users: { connect: { id: targetUserId } }, 
 ...treatmentRelation, 
 
 uploaded_by_user: false,
 ...professionalRelation, 
 
 file_url: uploadedUrl,
 description: description, 
 consideration: consideration, // CORREÇÃO: Usando 'consideration' (camelCase)
 is_private: true,
 
 // userTreatmentRelation REMOVIDO: Não existe no schema SQL da Tabela 1.
},
select: { id: true }
});
dbPhotoId = newSimplePhoto.id;

// GARANTIA: dbPhotoId não pode ser null para criar a FK
if (dbPhotoId === null) {
 throw new Error("Erro interno: Falha ao obter o ID da foto (Tabela 1).");
}

// Tabela 2: user_treatment_photos_annotations (Avaliação/Anotações)
newPhotoAnnotation = await prisma.user_treatment_photos_annotations.create({
data: {
 users_user_treatment_photos_annotations_user_idTousers: { connect: { id: targetUserId } },
 users_user_treatment_photos_annotations_created_by_user_idTousers: { connect: { id: professionalUserId } },

 photo_url: uploadedUrl,
 photo_type: photoType,
 annotation_data: annotationData,
  
 // IMPLEMENTAÇÃO DO LINK EXPLÍCITO: Usa a relação do Prisma (user_treatment_photos)
 user_treatment_photos: { connect: { id: dbPhotoId } },
 
 ...userTreatmentRelation, // Conecta user_treatment_id (opcional)
 ...professionalRelation, // Conecta professional_id (opcional)
 
 created_at: new Date(),
 updated_at: new Date(),
},
select: {
 id: true,
 photo_url: true,
 photo_type: true,
 created_at: true,
}
});

return {
message: 'Foto de avaliação e anotações salvas com sucesso.',
photo: {
 id: newPhotoAnnotation.id,
 url: newPhotoAnnotation.photo_url,
 type: newPhotoAnnotation.photo_type,
 createdAt: newPhotoAnnotation.created_at,
 simplePhotoId: dbPhotoId,
}
};

} catch (prismaError: any) {
console.error('Erro CRÍTICO no Prisma (POST /photos):', prismaError);

if (uploadedPublicId) {
console.log(`DEBUG: Excluindo imagem do Cloudinary devido à falha de persistência: ${uploadedPublicId}`);
cloudinary.uploader.destroy(uploadedPublicId);
}
throw createError({
statusCode: 500,
statusMessage: 'Falha na persistência da foto de avaliação.',
data: { details: 'Falha na inserção no DB. Verifique o console do servidor.' }
});
}
});