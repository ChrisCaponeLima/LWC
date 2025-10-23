// /server/utils/cloudinary_temp.ts - V1.2 - Adiciona verificação de tamanho de arquivo (fs.stat) antes do upload.

import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const TMP_DIR = path.join(os.tmpdir(), 'nuxt_uploads'); 

/**
* Lê o arquivo temporário do disco, faz o upload para o Cloudinary e o exclui.
* @param tempFileId O UUID do arquivo temporário.
* @param uploadFolder O subdiretório no Cloudinary (ex: 'record_photos').
* @returns A URL segura do arquivo no Cloudinary, ou null em caso de falha.
*/
export async function uploadTempFileToCloudinary(
  tempFileId: string, 
  uploadFolder: string
): Promise<string | null> {
  
  // O pre_upload V1.3 garante que o arquivo é salvo como .png
  const tempFilePath = path.join(TMP_DIR, `${tempFileId}.png`);
  
  try {
    // 1. Verificar a existência e o tamanho do arquivo no disco
    const stats = await fs.stat(tempFilePath); 

        // 🚨 MUDANÇA PRINCIPAL: Verificar se o arquivo tem tamanho zero ou é muito pequeno (ex: < 1KB)
        // Se for 0, o upload do Cloudinary falhará.
        const MIN_FILE_SIZE_BYTES = 100; // Define um limite mínimo razoável (100 bytes)
        if (stats.size === 0 || stats.size < MIN_FILE_SIZE_BYTES) {
            console.error(`[CLOUDINARY] Arquivo encontrado, mas está vazio ou muito pequeno (${stats.size} bytes). Falha na conversão do HEIC/Frontend?`);
            // Se o arquivo estiver vazio, tentamos excluí-lo e retornamos null
            await fs.unlink(tempFilePath); 
            return null;
        }

    // 2. Upload para o Cloudinary
    const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
      folder: uploadFolder, 
      resource_type: 'image',
      public_id: `${tempFileId}`,
      overwrite: true,
    });

    // 3. Excluir o arquivo temporário após o upload bem-sucedido
    await fs.unlink(tempFilePath);
    console.log(`[CLOUDINARY] Arquivo temporário ${tempFileId} excluído com sucesso.`);
    
    return uploadResult.secure_url;

  } catch (error: any) {
    
    if (error.code === 'ENOENT') {
      console.warn(`[CLOUDINARY] Arquivo temporário não encontrado: ${tempFileId}. Pulando.`);
      return null;
    }
    
    console.error('[CLOUDINARY] Erro no processamento/upload (Verifique Credenciais):', error);
    
    // Tenta excluir o arquivo como fallback
    try {
      await fs.unlink(tempFilePath);
      console.log(`[CLOUDINARY] Arquivo ${tempFileId} excluído após falha de upload.`);
    } catch (unlinkError) {
      console.warn(`[CLOUDINARY] Falha ao tentar excluir o arquivo temporário: ${tempFileId} após erro.`);
    }
    
    return null; 
  }
}