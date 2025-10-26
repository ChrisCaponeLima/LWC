// /server/api/professional/user/[id]/photos.post.ts - V1.1 - Correção de Importação do Lodash

import { defineEventHandler, readMultipartFormData, createError, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';
import { v2 as cloudinary } from 'cloudinary';
import { Buffer } from 'node:buffer';
// Removida a importação 'import { parseInt } from 'lodash';'

// Funções utilitárias (adaptadas do temp_upload.post.ts)
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

    // Usando o parseInt nativo do JavaScript
    const targetUserId = parseInt(event.context.params?.id as string); 

    if (isNaN(targetUserId)) {
        throw createError({ statusCode: 400, statusMessage: 'ID do usuário alvo inválido.' });
    }

    // 1. Autorização: Apenas profissionais (e admin/owner) podem acessar
    const userRole = verifyAuthToken(event).role;
    if (!['profissional', 'admin', 'owner'].includes(userRole)) {
        throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas perfis autorizados podem fazer upload de avaliação.' });
    }

    const formData = await readMultipartFormData(event);

    if (!formData) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request: Nenhum dado de formulário multipart recebido.' });
    }

    // 2. Extrair Variáveis e Arquivo
    let originalFilePart: any | undefined;
    let photoType: string = '';
    let annotationData: string | null = null;
    let userTreatmentId: number | null = null;

    for (const part of formData) {
        const partValue = part.data ? part.data.toString('utf-8') : '';

        if (part.name === 'photoFile' && part.filename && part.data) {
            originalFilePart = part;
        } else if (part.name === 'photoType' && part.data) {
            photoType = partValue;
        } else if (part.name === 'annotationData' && part.data) {
            // Assume que annotationData é uma string JSON (pode ser vazio, mas não nulo no formulário)
            if (partValue.trim() !== '') {
                 annotationData = partValue;
            }
        } else if (part.name === 'userTreatmentId' && part.data) {
            // Usando o parseInt nativo do JavaScript
            const id = parseInt(partValue);
            if (!isNaN(id) && id > 0) {
                userTreatmentId = id;
            }
        }
    }

    // 3. Validação dos Campos Essenciais
    if (!originalFilePart || !photoType) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request: Campos essenciais (photoFile, photoType) estão faltando.' });
    }

    // 4. Upload para Cloudinary
    let uploadedUrl: string;
    let uploadedPublicId: string;
    const cloudinaryFolder = `user_assessments/users/${targetUserId}`;

    try {
        const dataUri = bufferToDataURI(originalFilePart.data, originalFilePart.type || 'image/jpeg');
        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: `${cloudinaryFolder}/${photoType}`, // Subpasta baseada no tipo (ex: frontal)
            resource_type: 'image',
            tags: [`user_${targetUserId}`, 'assessment', photoType],
        });

        uploadedUrl = uploadResult.secure_url;
        uploadedPublicId = uploadResult.public_id;

    } catch (error: any) {
        console.error('Erro no upload para Cloudinary (assessment photo):', error);
        throw createError({ statusCode: 500, statusMessage: 'Falha ao fazer upload da foto para avaliação.', data: { details: error.message } });
    }

    // 5. Encontra o ID do Perfil Profissional
    let professionalId: number | null = null;
    const professionalProfile = await prisma.professionals.findUnique({
        where: { user_id: professionalUserId },
        select: { id: true }
    });

    if (professionalProfile) {
        professionalId = professionalProfile.id;
    } else if (userRole === 'professional') {
        // Se o usuário é professional mas não tem perfil, é um erro, a menos que seja admin/owner
        throw createError({ statusCode: 403, statusMessage: 'Perfil profissional não encontrado ou inativo.' });
    }


    // 6. Persistência na tabela final: user_treatment_photos_annotations
    try {
        const newPhotoAnnotation = await prisma.userTreatmentPhotoAnnotation.create({
            data: {
                user_id: targetUserId,
                photo_url: uploadedUrl,
                photo_type: photoType,
                annotation_data: annotationData, // JSON (String)
                user_treatment_id: userTreatmentId,
                professional_id: professionalId,
                created_by_user_id: professionalUserId,
                // created_at e updated_at são automáticos
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
            }
        };

    } catch (prismaError: any) {
        console.error('Erro CRÍTICO no Prisma (POST /photos):', prismaError);
        // Tenta remover a imagem do Cloudinary para evitar lixo se o DB falhar
        if (uploadedPublicId) {
             cloudinary.uploader.destroy(uploadedPublicId);
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Falha na persistência da foto de avaliação.',
            data: { details: 'Falha na inserção no DB. Verifique o console do servidor.' }
        });
    }
});