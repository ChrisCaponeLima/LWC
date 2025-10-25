// /server/utils/cloudinary_temp.ts - V1.5 - Ajusta a verificação de 'is_private' no rename do Cloudinary e garante tipagem.

import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '~/server/utils/db'; // Acesso ao DB

/**
* Interface de retorno do utilitário.
*/
export interface CloudinaryMoveResult {
 url: string;
 publicId: string;
}

/**
* Busca o registro na tabela edited_files pelo tempId (file_id),
* move/renomeia o arquivo no Cloudinary para a pasta final (records),
* e limpa o registro temporário do DB.
* * @param tempFileId O UUID do arquivo temporário (file_id da edited_files).
* @param destinationFolder O subdiretório final no Cloudinary (ex: 'records/public/photos').
* @returns O objeto com a URL segura e o Public ID do arquivo final.
*/
export async function uploadTempFileToCloudinary(
tempFileId: string, 
destinationFolder: string
): Promise<CloudinaryMoveResult | null> {
 
try {
// 1. Encontrar o registro na tabela persistente edited_files
// A coluna is_private é um SmallInt (0 ou 1)
const editedFile = await prisma.edited_files.findUnique({
where: { file_id: tempFileId },
select: { 
 cloudinary_public_id: true, 
 is_private: true, // Será 0 ou 1
}
});

if (!editedFile || !editedFile.cloudinary_public_id) {
console.warn(`[CLOUDINARY_TEMP] Arquivo temporário não encontrado no DB para tempId: ${tempFileId}. Pulando.`);
return null; 
}

const currentPublicId = editedFile.cloudinary_public_id;
const isPrivate = editedFile.is_private === 1; // 🚨 GARANTINDO O BOOLEAN A PARTIR DO SMALLINT

// 2. Mover/Renomear o arquivo no Cloudinary para o destino final (records)
// A nova estrutura de public_id será: pasta_final/file_id
const newPublicId = `${destinationFolder}/${tempFileId}`;

console.log(`[CLOUDINARY_MOVE] Movendo de: ${currentPublicId} para: ${newPublicId}. Tipo: ${isPrivate ? 'private' : 'upload'}`);

const result = await cloudinary.uploader.rename(
currentPublicId, 
newPublicId, 
{ 
 overwrite: true, 
 type: isPrivate ? 'private' : 'upload' // 🚨 USANDO O NOVO BOOLEAN CONFIÁVEL
}
);

if (!result || !result.secure_url) {
throw new Error('Cloudinary Renomear falhou.');
}

// 3. Deletar o registro temporário (limpeza)
await prisma.edited_files.delete({ where: { file_id: tempFileId } });
console.log(`[CLOUDINARY_TEMP] Registro ${tempFileId} excluído do DB.`);

// 4. Retorno correto para o /api/records
return { url: result.secure_url, publicId: result.public_id }; 

} catch (error: any) {

console.error('[CLOUDINARY_TEMP] Erro CRÍTICO no processamento/move Cloudinary (Serverless):', error);

// Tenta limpar o registro DB mesmo em caso de erro
try {
await prisma.edited_files.delete({ where: { file_id: tempFileId } });
console.log(`[CLOUDINARY_TEMP] Tentativa de exclusão do registro ${tempFileId} após falha.`);
} catch (dbError) {
// Ignorar
}

return null; 
}
}