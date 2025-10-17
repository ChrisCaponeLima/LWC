// /server/api/chat/upload.post.ts - V1.0 - Endpoint seguro para upload de arquivos de chat.

import { defineEventHandler, readMultipartFormData, createError } from 'h3';
import { verifyAuthToken } from '~/server/utils/auth'; 
// 🚨 Nota: 'path' e 'crypto' são módulos Node.js/Nitro nativos.
import path from 'path';
import { randomUUID } from 'crypto';

// 🚨 SIMULAÇÃO DE ARMAZENAMENTO SEGURO
// Em produção, você usaria 'fs' para salvar em disco ou SDKs para Cloud Storage (S3, GCS).
const saveFileSecurely = (file) => {
    // 1. Gerar nome de arquivo único
    const fileExtension = path.extname(file.filename || '');
    const newFileName = `${randomUUID()}${fileExtension}`;
    
    // 2. A URL retornada é uma REFERÊNCIA. O backend precisará de um endpoint 
    //    que autentique o usuário e sirva o arquivo desse caminho.
    const fileUrlReference = `/private-storage/${newFileName}`;
    
    return {
        fileUrlReference: fileUrlReference,
        fileType: file.type || 'application/octet-stream',
    };
};

export default defineEventHandler(async (event) => {
    // 1. SEGURANÇA: Apenas usuários autenticados podem enviar arquivos
    const userData = verifyAuthToken(event); 
    const uploaderId = userData.userId; 

    // 2. Processar a requisição Multipart
    const formData = await readMultipartFormData(event);

    if (!formData || formData.length === 0) {
        throw createError({ statusCode: 400, message: 'Nenhum arquivo enviado.' });
    }

    // Busca o arquivo no corpo (o frontend deve usar o nome 'chat_file')
    const filePart = formData.find(part => part.name === 'chat_file');
    
    if (!filePart || !filePart.filename || !filePart.data) {
        throw createError({ statusCode: 400, message: 'Arquivo de chat ausente ou inválido.' });
    }
    
    // 3. Validação Básica de Tipo
    if (!filePart.type?.startsWith('image/') && !filePart.type?.startsWith('video/')) {
        throw createError({ statusCode: 400, message: 'Tipo de arquivo não suportado. Apenas imagens ou vídeos.' });
    }

    try {
        // 4. Salvar o arquivo de forma segura e obter a URL de referência
        const { fileUrlReference, fileType } = saveFileSecurely(filePart);

        // 5. RETORNO: A URL e o tipo para o frontend usar na API de Mensagem
        return {
            success: true,
            fileUrl: fileUrlReference,
            fileType: fileType,
            message: 'Arquivo processado com sucesso.'
        };

    } catch (error) {
        console.error('Erro no upload seguro:', error);
        throw createError({ statusCode: 500, message: 'Falha interna ao processar o upload do arquivo.' });
    }
});