// /server/api/images/permanent_save.post.ts - V1.0 - Cria endpoint para simular o salvamento permanente de blobs editado e original.

import { defineEventHandler, readMultipartFormData, createError, getRequestHeader } from 'h3';
import { v4 as uuidv4 } from 'uuid';

export default defineEventHandler(async (event) => {
    // 1. Verificar o Token de Autenticação (Padrão do arquivo pre_upload.post.ts)
    const authHeader = getRequestHeader(event, 'Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createError({ 
            statusCode: 401, 
            statusMessage: 'Unauthorized: Token de autorização ausente ou inválido.' 
        });
    }

    // 2. Processar o FormData multipart
    const formData = await readMultipartFormData(event);

    if (!formData) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request: Nenhum dado de formulário multipart recebido.',
        });
    }

    // 3. Extrair e Padronizar Variáveis (camelCase)
    let editedFilePart: any | undefined;
    let originalFilePart: any | undefined;
    let imageType: string = '';
    let isPrivate: boolean = false;

    // Lendo as partes do formulário
    for (const part of formData) {
        if (part.name === 'editedFile' && part.filename && part.data) {
            editedFilePart = part;
        } else if (part.name === 'originalFile' && part.filename && part.data) {
            originalFilePart = part;
        } else if (part.name === 'type' && part.data) {
            imageType = part.data.toString('utf-8');
        } else if (part.name === 'isPrivate' && part.data) {
            isPrivate = part.data.toString('utf-8') === 'true';
        }
    }

    // 4. Validação de Campos
    if (!editedFilePart || !originalFilePart || !imageType) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request: Campos essenciais (editedFile, originalFile, type) estão faltando ou vazios.',
        });
    }

    if (imageType !== 'photo' && imageType !== 'forma') {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request: Tipo de imagem inválido. Deve ser "photo" ou "forma".',
        });
    }
    
    // LOG DE DEPURAÇÃO
    console.log(`[PERMANENT-SAVE] Recebido. Type: ${imageType}, Private: ${isPrivate}`);
    console.log(`[PERMANENT-SAVE] Tamanho Edited: ${editedFilePart.data.length} bytes.`);
    console.log(`[PERMANENT-SAVE] Tamanho Original: ${originalFilePart.data.length} bytes.`);

    // ===========================================
    // === LÓGICA DE NEGÓCIO (SIMULAÇÃO) ===
    // ===========================================
    
    // Nesta simulação, não realizamos a I/O real (leitura/escrita no disco/storage)
    // para focar na resposta da API que o frontend espera.

    // 1. Simulação de ID único para o par de arquivos (pode ser usado no nome do arquivo no Storage)
    const fileUniqueId = uuidv4(); 
    
    // 2. Simulação de URLs de Storage (permanentes)
    const editedUrl = `/storage/permanent/${fileUniqueId}_edited.png`;
    const originalUrl = `/storage/permanent/${fileUniqueId}_original.png`;
    
    // 3. Simulação de Registro no Banco de Dados
    // O ID retornado deve ser o ID da linha na tabela `edited` (ou equivalente)
    const recordId = Math.floor(Date.now() / 1000).toString() + Math.floor(Math.random() * 99).toString().padStart(2, '0'); // ID de 12 dígitos simulando um BIGINT
    
    console.log(`[PERMANENT-SAVE] Simulação de Registro. ID: ${recordId}`);

    // 4. Retorno esperado pelo frontend (ImageEditor.vue -> permanentSaveApiCall)
    return {
        id: recordId, // ID do registro na tabela 'edited' (usado como tempId no frontend)
        type: imageType,
        fileId: fileUniqueId, 
        editedUrl: editedUrl,
        originalUrl: originalUrl
    };
});