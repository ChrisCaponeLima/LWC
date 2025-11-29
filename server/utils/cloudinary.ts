// ~/server/utils/cloudinary.ts - V1.5 - Reversão CRÍTICA: Retorna ao uso direto de process.env para as chaves Cloudinary, que comprovadamente funciona na sua arquitetura.

import { v2 as cloudinary } from 'cloudinary'
import { Buffer } from 'node:buffer'
import { Readable } from 'stream' 
// 🚨 REMOÇÃO: removemos a importação de useRuntimeConfig, pois não é necessária se process.env funciona.
// import { useRuntimeConfig } from '#imports' 

// 🚨 REMOÇÃO: removemos a chamada useRuntimeConfig();

// 🔹 Configuração do Cloudinary via variáveis de ambiente
// 🚨 REVERSÃO: Voltando ao uso direto de process.env, que é o que funcionava no seu sistema.
cloudinary.config({
cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Antes: config.CLOUDINARY_CLOUD_NAME
api_key: process.env.CLOUDINARY_API_KEY,    // Antes: config.CLOUDINARY_API_KEY
api_secret: process.env.CLOUDINARY_API_SECRET, // Antes: config.CLOUDINARY_API_SECRET
secure: true,
})


/**
 * Extrai o Public ID de uma URL completa do Cloudinary.
 * O Public ID é o que o Cloudinary usa para referenciar e deletar o arquivo.
 * @param url A URL completa da imagem.
 * @returns O Public ID ou null se a URL for inválida ou não for do Cloudinary.
 */
function extractPublicId(url: string): string | null {
    // Código inalterado
  const parts = url.split('/upload/');
  if (parts.length < 2) {
    return null;
  }
  
  const pathAfterUpload = parts[1];
  
  const regex = /(v\d+\/)?(.+?)(\.\w+)$/; 
  const match = pathAfterUpload.match(regex);

  if (match && match.length >= 3) {
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
throw new Error('Arquivo inválido para upload no Cloudinary.')
}
 
 try {
  const result = await new Promise((resolve, reject) => {
    // Usa o Cloudinary configurado com process.env
   const stream = cloudinary.uploader.upload_stream({
    folder: folder, 
    resource_type: 'image',
   }, (error, result) => {
    if (error) return reject(error);
    resolve(result);
   });

   const readableStream = new Readable();
   readableStream.push(file.data); 
   readableStream.push(null); 
   
   readableStream.pipe(stream);
  });
  
  const uploadResult = result as { secure_url: string };
  return uploadResult.secure_url
  
 } catch (err) {
  console.error('Erro no upload para Cloudinary:', err)
  throw err
 }
}


/**
 * Deleta uma imagem do Cloudinary.
 * @param url A URL completa da imagem do Cloudinary.
 * @returns O resultado da destruição do recurso.
 */
export async function deleteFromCloudinary(url: string): Promise<any> {
    // Código inalterado
  if (!url) {
    throw new Error('URL da imagem não fornecida.');
  }

  const publicId = extractPublicId(url);

  if (!publicId) {
    console.warn(`URL inválida ou não Cloudinary: ${url}`);
    return { result: 'not found or invalid URL' };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
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