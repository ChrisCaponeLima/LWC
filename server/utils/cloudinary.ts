// ~/server/utils/cloudinary.ts - V1.1 - Refatoração CRÍTICA para usar cloudinary.uploader.upload_stream.
// Isso evita a duplicação de memória de Base64 (Data URI), que é ineficiente e pode causar erros de limite de memória ou contribuir para o 413.

import { v2 as cloudinary } from 'cloudinary'
import { Buffer } from 'node:buffer'
import { Readable } from 'stream' // 🚨 NOVO: Importa Readable para criar stream do Buffer

// 🔹 Configuração do Cloudinary via variáveis de ambiente
cloudinary.config({
 cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
 api_key: process.env.CLOUDINARY_API_KEY,
 api_secret: process.env.CLOUDINARY_API_SECRET,
 secure: true,
})

// 🚨 REMOÇÃO: A função 'bufferToDataURI' foi removida por ser ineficiente e não será mais utilizada.
// ANTES: function bufferToDataURI(buffer: Buffer, mimetype: string): string { ... }

/**
* Faz upload de arquivo para Cloudinary usando upload_stream (eficiente em memória).
* @param file Objeto do `readMultipartFormData` (com `data`, `type`, `filename`)
* @param folder Nome da pasta no Cloudinary
* @returns URL segura da imagem (https)
*/
export async function uploadToCloudinary(file: any, folder: string): Promise<string> {
 if (!file?.data) {
  // Comentário: Garante que o objeto de arquivo do multipart tenha dados.
  throw new Error('Arquivo inválido para upload no Cloudinary.')
 }
    
    // 🚨 ALTERAÇÃO CRÍTICA: Substitui o upload do Data URI pela Promise do upload_stream.
    try {
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({
                folder: folder, // Usa a pasta de destino fornecida
                resource_type: 'image',
            }, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });

            // Cria um stream legível a partir do Buffer do arquivo
            const readableStream = new Readable();
            readableStream.push(file.data); // Envia o Buffer completo
            readableStream.push(null); // Sinaliza o fim do stream
            
            readableStream.pipe(stream);
        });
        
        const uploadResult = result as { secure_url: string };
        return uploadResult.secure_url
        
    } catch (err) {
        // Comentário: Tratamento de erro padronizado para upload.
        console.error('Erro no upload para Cloudinary:', err)
        throw err
    }
}

export default cloudinary