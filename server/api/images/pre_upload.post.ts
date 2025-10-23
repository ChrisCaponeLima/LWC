// /server/api/images/pre_upload.post.ts - V1.6 - Depuração de Erros de I/O (Leitura/Escrita) e log de campos.
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
    console.log(`[PRE-UPLOAD] Diretório temporário acessível: ${TMP_DIR}`);
 } catch (error) {
    console.log(`[PRE-UPLOAD] Diretório temporário não encontrado. Criando: ${TMP_DIR}`);
  // Cria o diretório se ele não existir
  await fs.mkdir(TMP_DIR, { recursive: true });
    console.log(`[PRE-UPLOAD] Diretório temporário criado com sucesso.`);
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
    
    // LOG DE DEPURAÇÃO
    console.log('[PRE-UPLOAD] Requisição recebida. Campos:', data.map(p => p.name));

  // Padronização de variáveis: mantendo 'camelCase' para as partes do multipart
  const editedFilePart = data.find(p => p.name === 'editedFile');
  const typePart = data.find(p => p.name === 'type');
  const isPrivatePart = data.find(p => p.name === 'isPrivate');

  if (!editedFilePart || !editedFilePart.data || editedFilePart.data.length === 0) {
   throw createError({ 
          statusCode: 400, 
          statusMessage: 'Arquivo de imagem ausente ou vazio.',
          data: { details: `Tamanho do buffer recebido: ${editedFilePart?.data?.length || 0} bytes` }
      });
  }
    
    console.log(`[PRE-UPLOAD] Buffer de imagem lido. Tamanho: ${editedFilePart.data.length} bytes.`);

  const fileBuffer = editedFilePart.data;
  const fileType = typePart?.data.toString('utf-8') || 'photo';
  const isPrivate = isPrivatePart?.data.toString('utf-8') === 'true';
  
  // Forçar a extensão para '.png'
  const fileExtension = 'png'; 
  
  const tempFileId = uuidv4();
  const fileName = `${tempFileId}.${fileExtension}`;
  const filePath = path.join(TMP_DIR, fileName);

    console.log(`[PRE-UPLOAD] Tentando escrever arquivo em: ${filePath}`);
  // Salva o arquivo no diretório temporário
  await fs.writeFile(filePath, fileBuffer);
  
  console.log(`[PRE-UPLOAD] Arquivo temporário salvo com SUCESSO: ${fileName}`);

  return {
   message: 'Pré-upload realizado com sucesso.',
   fileId: tempFileId,
   type: fileType,
   isPrivate: isPrivate,
   serverPath: filePath 
  };

 } catch (error: any) {
  console.error('----- ERRO CRÍTICO NO PRÉ-UPLOAD DA API -----');
  console.error('Mensagem de Erro:', error.message);
  console.error('Nome/Tipo do Erro:', error.name);
    console.error('Pilha de Erros:', error.stack);
  console.error('-------------------------------------------');
  
  throw createError({
   statusCode: error.statusCode || 500,
   statusMessage: error.statusMessage || 'Falha interna do servidor ao processar o arquivo.',
   data: { details: error.message || 'Verifique o console do servidor para detalhes da falha de I/O.' }
  });
 }
});