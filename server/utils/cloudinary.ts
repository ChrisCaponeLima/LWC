// ~/server/utils/cloudinary.ts - V1.2 - Adição da função deleteFromCloudinary e função utilitária para extrair Public ID.
// Isso evita a duplicação de memória de Base64 (Data URI), que é ineficiente e pode causar erros de limite de memória ou contribuir para o 413.

import { v2 as cloudinary } from 'cloudinary'
import { Buffer } from 'node:buffer'
import { Readable } from 'stream' 

// 🔹 Configuração do Cloudinary via variáveis de ambiente
cloudinary.config({
cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
_key: process.env.CLOUDINARY__KEY,
_secret: process.env.CLOUDINARY__SECRET,
secure: true,
})

/**
 * 🟢 NOVIDADE: Extrai o Public ID de uma URL completa do Cloudinary.
 * O Public ID é o que o Cloudinary usa para referenciar e deletar o arquivo.
 * Exemplo de URL: https://res.cloudinary.com/wlc/image/upload/v1600000000/profile_photos/xyz123.jpg
 * Public ID: profile_photos/xyz123
 * @param url A URL completa da imagem.
 * @returns O Public ID ou null se a URL for inválida ou não for do Cloudinary.
 */
function extractPublicId(url: string): string | null {
    // A URL deve ter o padrão /upload/v<timestamp>/<public_id>.<ext>
    const parts = url.split('/upload/');
    if (parts.length < 2) {
        return null;
    }
    
    // Pega a segunda parte (tudo após /upload/)
    const pathAfterUpload = parts[1];
    
    // Encontra o segmento que contém o public ID e a extensão
    const regex = /(v\d+\/)?(.+?)(\.\w+)$/; // Opcional /v<timestamp>/ e a extensão
    const match = pathAfterUpload.match(regex);

    if (match && match.length >= 3) {
        // match[2] é o public ID (ex: "profile_photos/xyz123")
        return match[2]; 
    }

    return null;
}

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


/**
 * 🟢 NOVIDADE: Deleta uma imagem do Cloudinary.
 * @param url A URL completa da imagem do Cloudinary.
 * @returns O resultado da destruição do recurso.
 */
export async function deleteFromCloudinary(url: string): Promise<any> {
    if (!url) {
        throw new Error('URL da imagem não fornecida.');
    }

    const publicId = extractPublicId(url);

    if (!publicId) {
        console.warn(`URL inválida ou não Cloudinary: ${url}`);
        // Retorna silenciosamente se não for possível extrair o Public ID
        return { result: 'not found or invalid URL' };
    }

    try {
        // Chamada direta para o método de destruição
        const result = await cloudinary.uploader.destroy(publicId);
        
        // Cloudinary retorna { result: 'ok' } se deletado ou { result: 'not found' }
        if (result.result === 'not found') {
            console.warn(`Recurso Cloudinary com Public ID "${publicId}" não encontrado para exclusão.`);
        }

        return result;
    } catch (error) {
        console.error('Erro ao deletar recurso no Cloudinary:', error);
        throw error;
    }
}


export default cloudinary