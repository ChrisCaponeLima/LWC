// ~/server/utils/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'
import { Buffer } from 'node:buffer'

// 🔹 Configuração do Cloudinary via variáveis de ambiente
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/**
 * Converte Buffer em Data URI
 */
function bufferToDataURI(buffer: Buffer, mimetype: string): string {
  return `data:${mimetype};base64,${buffer.toString('base64')}`
}

/**
 * Faz upload de arquivo para Cloudinary
 * @param file Objeto do `readMultipartFormData` (com `data`, `type`, `filename`)
 * @param folder Nome da pasta no Cloudinary
 * @returns URL segura da imagem (https)
 */
export async function uploadToCloudinary(file: any, folder: string): Promise<string> {
  if (!file?.data) {
    throw new Error('Arquivo inválido para upload no Cloudinary.')
  }

  const dataUri = bufferToDataURI(file.data, file.type || 'image/jpeg')

  try {
    const result = await cloudinary.uploader.upload(dataUri, { folder })
    return result.secure_url
  } catch (err) {
    console.error('Erro no upload para Cloudinary:', err)
    throw err
  }
}

export default cloudinary
