// /server/api/records.post.ts - V3.5 - Versão Definitiva: Utiliza IDs temporários e Cloudinary Utility.
import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { prisma } from '~/server/utils/db'
import { uploadTempFileToCloudinary } from '~/server/utils/cloudinary_temp' // Importa o utilitário real
// Removed: import * as os from 'os'; import * as path from 'path'; (não são necessários nesta rota)

export default defineEventHandler(async (event) => {
if (event.method !== 'POST') {
 throw createError({ statusCode: 405, statusMessage: 'Método não permitido.' })
}

const formData = await readMultipartFormData(event)
if (!formData) {
 throw createError({
 statusCode: 400,
 statusMessage: 'Corpo da requisição vazio ou formato inválido.',
 })
}

const getFieldValue = (name: string): string | null => {
 const field = formData.find((item) => item.name === name)
 return field && !field.filename ? field.data.toString('utf-8') : null
}

// Campos obrigatórios
const userIdStr = getFieldValue('user_id')
const record_date = getFieldValue('record_date')
const weightStr = getFieldValue('weight')
const measurementsJson = getFieldValue('measurements')

if (!userIdStr || !record_date || !weightStr) {
 throw createError({
 statusCode: 400,
 statusMessage: 'Dados essenciais não fornecidos.',
 })
}

const user_id = Number(userIdStr)
const weight = parseFloat(weightStr)
if (isNaN(user_id) || isNaN(weight)) {
 throw createError({ statusCode: 400, statusMessage: 'ID ou Peso inválidos.' })
}

// 🚨 Captura dos IDs temporários
const tempPhotoFileIdsJson = getFieldValue('tempPhotoFileIds')
const tempFormaFileIdsJson = getFieldValue('tempFormaFileIds')

// Campos opcionais
const eventField = getFieldValue('event')
const weeklyAction = getFieldValue('weeklyAction')
const workoutDaysStr = getFieldValue('workoutDays')
const observations = getFieldValue('observations')
const workout_days = workoutDaysStr ? Number(workoutDaysStr) : null

// Conversão dos IDs temporários
// ⚠️ MANTIDO: Assumimos isPrivate=false (0) baseado no V2.2.12 do DataForm
const tempPhotoIds: { tempId: string; isPrivate: boolean }[] = tempPhotoFileIdsJson
? JSON.parse(tempPhotoFileIdsJson).map((id: string) => ({ tempId: id, isPrivate: false }))
: []
const tempFormaIds: { tempId: string; isPrivate: boolean }[] = tempFormaFileIdsJson
? JSON.parse(tempFormaFileIdsJson).map((id: string) => ({ tempId: id, isPrivate: false }))
: []

// Coleciona todos os arquivos temporários
const tempFiles = [
 ...tempPhotoIds.map(f => ({ ...f, file_type: 1, folder: 'record_photos' })), // 1 para 'Evolução'
 ...tempFormaIds.map(f => ({ ...f, file_type: 2, folder: 'record_forma' })), // 2 para 'Forma'
]

let newRecord: any;
const fileInserts: any[] = []

try {
 // 1. Cria o registro no DB
 const recordData = {
 user_id,
 record_date: new Date(record_date),
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
 if (measurementsJson) {
 const parsed = JSON.parse(measurementsJson)
 if (Array.isArray(parsed) && parsed.length > 0) {
  await prisma.record_measurements.createMany({
  data: parsed.map((m: { measurement_id: number; value: number }) => ({
   record_id: newRecord.id,
   measurement_id: m.measurement_id,
   value: m.value,
  })),
  })
 }
 }

 // 3. Processa e insere arquivos temporários
 for (const file of tempFiles) {
  // 🚨 MUDANÇA REAL: Chama o utilitário para fazer o upload e limpar o disco
  const file_url = await uploadTempFileToCloudinary(file.tempId, file.folder);

  if (file_url) {
  fileInserts.push({
   record_id: newRecord.id,
   file_url: file_url,
   file_type: file.file_type,
   is_private: file.isPrivate ? 1 : 0, 
  })
  }
 }

 if (fileInserts.length > 0) {
 await prisma.files.createMany({ data: fileInserts })
 }

 event.node.res.statusCode = 201
 return { message: 'Registro salvo com sucesso!', recordId: newRecord.id }
} catch (dbError: any) {
 console.error('Erro CRÍTICO no Prisma (POST /records):', dbError)
 throw createError({ 
     statusCode: 500, 
     statusMessage: 'Erro de banco de dados ao salvar registro.' 
    })
}
})