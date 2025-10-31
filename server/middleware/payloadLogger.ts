// /server/middleware/payloadLogger.ts - V1.0 - Middleware para logar Content-Length em requisições POST/PUT.

import { defineEventHandler, getRequestHeader, createError } from 'h3';

const MAX_PAYLOAD_SIZE = 4718592; // 4.5 MB em bytes

export default defineEventHandler((event) => {
    // 1. Filtrar apenas requisições que podem ter body (POST, PUT, PATCH)
    const method = event.method;
    if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
        return;
    }
    
    // 2. Acessar o Content-Length
    const contentLengthHeader = getRequestHeader(event, 'content-length');
    
    if (contentLengthHeader) {
        const payloadSize = parseInt(contentLengthHeader, 10);
        
        // 3. Logar o tamanho da requisição
        const url = event.node.req.url || 'URL desconhecida';
        
        console.log(`[PAYLOAD LOGGER] Requisição ${method} para ${url}`);
        console.log(`[PAYLOAD LOGGER] Content-Length (Tamanho do Payload): ${payloadSize} bytes.`);

        // 4. Logar se o Content-Length excede o limite (para fins de depuração)
        if (payloadSize > MAX_PAYLOAD_SIZE) {
            console.warn(`[PAYLOAD LOGGER] ALERTA: Content-Length excede o limite de ${MAX_PAYLOAD_SIZE} bytes (4.5MB).`);
            // Nota: Não lançamos o 413 aqui, pois o Busboy já fará isso com mais precisão. 
            // O objetivo é apenas LOGAR o que o cliente enviou.
        }
    } else {
        console.warn(`[PAYLOAD LOGGER] Requisição sem Content-Length. URL: ${event.node.req.url}`);
    }
});