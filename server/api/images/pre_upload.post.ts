// /server/api/images/pre_upload.post.ts - V1.5 - Adiciona log de campos recebidos para depuração de FormData.
import { defineEventHandler, readMultipartFormData, createError, getHeader } from 'h3';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as os from 'os'; 
import * as path from 'path'; 

// Define o diretório temporário do sistema operacional (mais robusto em ambientes serverless)
// Cria uma subpasta para garantir que não haja colisões e para facilitar a limpeza.
const TMP_DIR = path.join(os.tmpdir(), 'nuxt_uploads'); 

/**
* Garante que o diretório temporário exista.
*/
async function ensureTempDir() {
 try {
  await fs.access(TMP_DIR);
 } catch (error) {
  // Cria o diretório se ele não existir
  await fs.mkdir(TMP_DIR, { recursive: true });
 }
}

export default defineEventHandler(async (event) => {
 const authHeader = getHeader(event, 'Authorization');
 if (!authHeader || !authHeader.startsWith('Bearer ')) {
  throw createError({ statusCode: 401, statusMessage: 'Não Autorizado.' });
 }

 try {
  await ensureTempDir(); // Garante o diretório

  const data = await readMultipartFormData(event);
  if (!data) {
   throw createError({ statusCode: 400, statusMessage: 'Nenhum dado de arquivo enviado.' });
  }
    
    // 🚨 LOG DE DEPURAÇÃO: Quais campos o servidor recebeu?
    console.log('[PRE-UPLOAD] Campos recebidos:', data.map(p => p.name));

  // Padronização de variáveis: mantendo 'camelCase' para as partes do multipart
  const editedFilePart = data.find(p => p.name === 'editedFile');
  const typePart = data.find(p => p.name === 'type');
  const isPrivatePart = data.find(p => p.name === 'isPrivate');

  if (!editedFilePart || !editedFilePart.data) {
   throw createError({ statusCode: 400, statusMessage: 'Arquivo de imagem ausente.' });
  }
    
    console.log(`[PRE-UPLOAD] Recebendo arquivo de ${editedFilePart.data.length} bytes.`);

  const fileBuffer = editedFilePart.data;
  const fileType = typePart?.data.toString('utf-8') || 'photo';
  const isPrivate = isPrivatePart?.data.toString('utf-8') === 'true';
  
  // 🚨 MUDANÇA PRINCIPAL: Forçar a extensão para '.png'
  const fileExtension = 'png'; 
  
  const tempFileId = uuidv4();
  const fileName = `${tempFileId}.${fileExtension}`;
  const filePath = path.join(TMP_DIR, fileName);

  // Salva o arquivo no diretório temporário
  await fs.writeFile(filePath, fileBuffer);
  
  console.log(`[PRE-UPLOAD] Arquivo temporário salvo: ${fileName}`);

  return {
   message: 'Pré-upload realizado com sucesso.',
   fileId: tempFileId,
   type: fileType,
   isPrivate: isPrivate,
   serverPath: filePath 
  };

 } catch (error: any) {
  console.error('Erro no pré-upload da API:', error);
  
  throw createError({
   statusCode: 500,
   statusMessage: 'Falha interna do servidor ao processar o arquivo.',
   data: { details: error.message || 'Verifique se as dependências estão instaladas e o ambiente possui permissão de escrita.' }
  });
 }
});