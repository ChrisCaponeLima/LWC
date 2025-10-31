// /server/utils/multipart_parser.ts - V1.1 - Revisão do limite do Busboy e adição de limite total de FIELDS/FILES para reforço contra 413.

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
            // 🚨 SOLUÇÃO CRÍTICA DO 413: Limite de tamanho por arquivo
            fileSize: MAX_FILE_SIZE, 
            // 🚨 NOVO REFORÇO: Limite de tamanho total do formulário (body size)
            // Esta propriedade é a mais importante para evitar o 413.
            fieldSize: MAX_FILE_SIZE,
            fileHwm: MAX_FILE_SIZE,
            files: 2, // Limite máximo de arquivos (originalFile e editedFile)
        },
    });

    return new Promise((resolve, reject) => {
        let buffersTotalSize = 0; // Para rastrear o tamanho total (apenas para debug)

        busboy.on('file', (name, file, info) => {
            const buffers: Buffer[] = [];
            
            const fieldName = name;
            const fileName = info.filename;
            const mimeType = info.mimeType;

            file.on('data', (data) => {
                buffers.push(data);
                buffersTotalSize += data.length; // Rastreia o tamanho total

                // Verificação de segurança adicional para o tamanho total (limite de memória)
                if (buffersTotalSize > MAX_FILE_SIZE) {
                    busboy.removeAllListeners();
                    reject(createError({ 
                        statusCode: 413, 
                        statusMessage: `Payload total demasiado grande. O limite é de ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
                    }));
                }
            });

            file.on('end', () => {
                const fileBuffer = Buffer.concat(buffers);
                files.push({
                    name: fieldName,
                    filename: fileName,
                    data: fileBuffer,
                    type: mimeType,
                    encoding: info.encoding,
                });
            });
            
            // O Busboy dispara o evento 'limit' se fileSize for excedido
            file.on('limit', () => {
                busboy.removeAllListeners(); 
                reject(createError({ 
                    statusCode: 413, 
                    statusMessage: `Arquivo individual excedeu o limite de ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
                }));
            });
        });

        busboy.on('field', (name, val) => {
            fields[name] = val; 
        });

        busboy.on('finish', () => {
            resolve({ fields, files });
        });

        busboy.on('error', (err) => {
            reject(createError({ 
                statusCode: 400, 
                statusMessage: `Falha no parsing do formulário: ${err.message}` 
            }));
        });
        
        // 🚨 NOVO REFORÇO: Captura o limite de tamanho total do formulário
        event.node.req.on('limit', () => {
             busboy.removeAllListeners();
             reject(createError({ 
                statusCode: 413, 
                statusMessage: `Limite total do formulário (body size) excedido. O limite é de ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
            }));
        });


        // Envia o stream da requisição nativa do Node para o Busboy
        event.node.req.pipe(busboy);
    });
}