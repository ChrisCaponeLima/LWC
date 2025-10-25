// /server/api/records.post.ts - V3.11 - Adaptação crítica para o retorno do utilitário Cloudinary_temp (V1.3), incluindo o public_id na tabela files.
import { defineEventHandler, createError, readBody } from 'h3'
import { prisma } from '~/server/utils/db'
// 🚨 O utilitário agora retorna { url: string, publicId: string }
import { uploadTempFileToCloudinary } from '~/server/utils/cloudinary_temp' 

// Interface para o novo payload JSON (para tipagem)
interface RecordPayload {
 userId: number;
 recordDate: string;
 weight: number;
 event?: string;
 weeklyAction?: string;
 workoutDays?: number | null;
 observations?: string;
 measurements: Array<{ measurement_id: number; value: number }>;
 tempFiles: Array<{ tempId: string; type: 'photo' | 'forma'; isPrivate: boolean }>;
}


export default defineEventHandler(async (event) => {
if (event.method !== 'POST') {
throw createError({ statusCode: 405, statusMessage: 'Método não permitido.' })
}

// 🚨 MUDANÇA: Lê o corpo como JSON
const body = await readBody<RecordPayload>(event)

// 🚨 LOG DE DEPURAÇÃO CRÍTICA
console.log('--- DIAGNÓSTICO DO BODY ---');
console.log('Corpo da requisição recebido (body):', body);
console.log('Body está vazio (condição):', !body || Object.keys(body).length === 0);
console.log('Número de arquivos temporários recebidos:', body?.tempFiles?.length || 0);
console.log('---------------------------');

if (!body || Object.keys(body).length === 0) {
throw createError({
statusCode: 400,
statusMessage: 'Corpo da requisição vazio ou formato inválido.',
})
}

// 🚨 MUDANÇA: Captura de variáveis do corpo JSON (camelCase)
const userId = body.userId
const recordDate = body.recordDate
const weight = body.weight
const measurements = body.measurements // Já é um array de objetos
const tempFilesPayload = body.tempFiles // Já é um array de objetos

if (!userId || !recordDate || weight === undefined) {
throw createError({
statusCode: 400,
statusMessage: 'Dados essenciais (userId, recordDate, weight) não fornecidos.',
})
}

const user_id = Number(userId)
if (isNaN(user_id) || isNaN(weight)) {
throw createError({ statusCode: 400, statusMessage: 'ID ou Peso inválidos.' })
}

// 🚨 Mapeamento dos campos opcionais do JSON
const eventField = body.event || null
const weeklyAction = body.weeklyAction || null
const workout_days = body.workoutDays !== undefined && body.workoutDays !== null ? Number(body.workoutDays) : null
const observations = body.observations || null

// 🚨 MUDANÇA: Formata os tempFiles para o formato esperado pela lógica de upload (V3.7)
const tempFilesFormatted = tempFilesPayload.map(file => {
 let file_type: number;
 let folder: string;

 if (file.type === 'photo') {
  file_type = 1; // 1 para 'Evolução'
  folder = 'records/public/photos'; // Ajuste o nome da pasta permanente se necessário
 } else {
  file_type = 2; // 2 para 'Forma'
  folder = 'records/public/forma'; // Ajuste o nome da pasta permanente se necessário
 }
 
 // Se for privado, ajuste a pasta raiz
 const finalFolder = file.isPrivate ? folder.replace('public', 'private') : folder;


 return {
  tempId: file.tempId, 
  isPrivate: file.isPrivate,
  file_type, 
  folder: finalFolder // Pasta de destino final
 };
});

let newRecord: any;
const fileInserts: any[] = []

try {
// 1. Cria o registro no DB
const recordData = {
user_id,
record_date: new Date(recordDate),
weight,
event: eventField,
weekly_action: weeklyAction,
workout_days,
observations,
}

console.log('Dados do Record sendo enviados ao Prisma:', recordData);

newRecord = await prisma.records.create({
data: recordData, 
})

// 2. Insere medições
if (Array.isArray(measurements) && measurements.length > 0) {
await prisma.record_measurements.createMany({
data: measurements.map((m: { measurement_id: number; value: number }) => ({
record_id: newRecord.id,
measurement_id: m.measurement_id,
value: m.value,
})),
})
}

// 3. Processa e insere arquivos temporários
for (const file of tempFilesFormatted) {
console.log(`[Cloudinary] Tentando upload para tempId: ${file.tempId} na pasta: ${file.folder}. isPrivate: ${file.isPrivate}`);

// 🚨 PONTO DE CORREÇÃO CRÍTICA 1: O retorno AGORA é um objeto!
const uploadResult = await uploadTempFileToCloudinary(file.tempId, file.folder);

if (uploadResult) {
    // 🚨 PONTO DE CORREÇÃO CRÍTICA 2: Desestruturação para obter URL e Public ID
    const { url, publicId } = uploadResult;

    console.log(`[Cloudinary] Sucesso! URL final: ${url.substring(0, 50)}... Public ID: ${publicId}`);
    
    fileInserts.push({
        record_id: newRecord.id,
        file_url: url, // Usa a URL do objeto de retorno
        public_id: publicId, // 👈 PONTO CHAVE: Salva o public_id do Cloudinary
        file_type: file.file_type,
        is_private: file.isPrivate ? 1 : 0, 
    })
} else {
// 🚨 LOG MELHORADO: Detalhando que o arquivo não pôde ser encontrado/processado.
console.warn(`[Cloudinary] ARQUIVO NÃO ENCONTRADO/FALHOU: Arquivo temporário ${file.tempId} foi ignorado. (Verifique edited_files ou logs de Cloudinary_temp)`);
}
}

if (fileInserts.length > 0) {
  console.log(`[Prisma] Inserindo ${fileInserts.length} arquivos na tabela files.`);
  await prisma.files.createMany({ data: fileInserts })
} else if (tempFilesFormatted.length > 0) {
  console.warn(`[Prisma] Nenhum arquivo inserido na tabela files, apesar de ${tempFilesFormatted.length} arquivos terem sido solicitados.`);
}


event.node.res.statusCode = 201
return { message: 'Registro salvo com sucesso!', recordId: newRecord.id }

} catch (prismaError: any) { 
// Se houver um erro de DB, logamos e lançamos o 500
console.error('Erro CRÍTICO no Prisma (POST /records):', prismaError)
throw createError({ 
statusCode: 500, 
statusMessage: 'Erro de banco de dados ao salvar registro.' 
})
}
})