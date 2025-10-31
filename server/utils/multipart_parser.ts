// /server/utils/multipart_parser.ts - V1.0 - Utilitário para parsear Multipart/Form-Data com limite de tamanho definido.
// Implementa Busboy para contornar o limite baixo e inconfigurável do H3/readMultipartFormData, 
// garantindo que o payload de 4.5MB (4718592 bytes) seja aceito (Erro 413).

import Busboy from 'busboy';
import { H3Event, createError } from 'h3';
import { Buffer } from 'node:buffer';

// 🚨 Define o limite de payload em bytes (4.5 MB)
const MAX_FILE_SIZE = 4718592; // 4.5 * 1024 * 1024 bytes

/**
 * Interface para os dados parseados do multipart.
 */
interface MultipartData {
    fields: Record<string, string>;
    files: {
        name: string;
        filename: string;
        data: Buffer;
        type: string;
        encoding: string;
    }[];
}

/**
 * Faz o parsing de uma requisição H3 multipart/form-data usando Busboy, 
 * respeitando o limite de 4.5MB.
 * @param event O evento H3.
 * @returns Um objeto contendo campos (fields) e arquivos (files).
 */
export function readCustomMultipartFormData(event: H3Event): Promise<MultipartData> {
    const fields: Record<string, string> = {};
    const files: MultipartData['files'] = [];

    // O objeto Busboy precisa do header 'content-type' e da requisição nativa do Node
    const busboy = Busboy({
        headers: event.node.req.headers,
        limits: {
            fileSize: MAX_FILE_SIZE, // 🚨 SOLUÇÃO CRÍTICA DO 413
            files: 2, // Limite máximo de arquivos (originalFile e editedFile)
        },
    });

    return new Promise((resolve, reject) => {
        // Objeto para armazenar o Buffer do arquivo atual
        let fileBuffer: Buffer | null = null;
        let fileName: string = '';
        let fieldName: string = '';
        let mimeType: string = '';

        busboy.on('file', (name, file, info) => {
            // Inicializa o Buffer para o arquivo
            const buffers: Buffer[] = [];
            
            fieldName = name;
            fileName = info.filename;
            mimeType = info.mimeType;

            file.on('data', (data) => {
                buffers.push(data);
            });

            file.on('end', () => {
                fileBuffer = Buffer.concat(buffers);
                files.push({
                    name: fieldName,
                    filename: fileName,
                    data: fileBuffer,
                    type: mimeType,
                    encoding: info.encoding,
                });
            });
            
            // O Busboy não rejeita no 'data' para fileSize, mas usa o evento 'limit'
            file.on('limit', () => {
                // Remove listeners para evitar chamadas duplas
                busboy.removeAllListeners(); 
                reject(createError({ 
                    statusCode: 413, 
                    statusMessage: `Payload demasiado grande. O limite é de ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
                }));
            });
        });

        busboy.on('field', (name, val) => {
            fields[name] = val; // Campos não-arquivos (type, isPrivate, etc.)
        });

        busboy.on('finish', () => {
            // Se o parsing foi bem-sucedido
            resolve({ fields, files });
        });

        busboy.on('error', (err) => {
            reject(createError({ 
                statusCode: 400, 
                statusMessage: `Falha no parsing do formulário: ${err.message}` 
            }));
        });

        // Envia o stream da requisição nativa do Node para o Busboy
        event.node.req.pipe(busboy);
    });
}