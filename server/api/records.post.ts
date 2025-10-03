// /server/api/records.post.ts - V3.0 - Migração para tabela `files`
import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { prisma } from '~/server/utils/db'
import { uploadToCloudinary } from '~/server/utils/cloudinary'

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

  // Campos opcionais
  const eventField = getFieldValue('event')
  const weeklyAction = getFieldValue('weeklyAction')
  const workoutDaysStr = getFieldValue('workoutDays')
  const observations = getFieldValue('observations')
  const workout_days = workoutDaysStr ? Number(workoutDaysStr) : null

  const photoPrivateInput = getFieldValue('photo_is_private')
  const formaPrivateInput = getFieldValue('forma_is_private')
  const photo_is_private = photoPrivateInput === 'true' ? 1 : 0
  const forma_is_private = formaPrivateInput === 'true' ? 1 : 0

  // Arquivos
  const photoFile = formData.find((i) => i.name === 'photo' && i.filename)
  const formaFile = formData.find((i) => i.name === 'forma' && i.filename)

  let photo_url: string | null = null
  let forma_url: string | null = null

  try {
    if (photoFile) {
      photo_url = await uploadToCloudinary(photoFile, 'record_photos')
    }
    if (formaFile) {
      forma_url = await uploadToCloudinary(formaFile, 'record_forma')
    }
  } catch (uploadError) {
    console.error('Erro ao fazer upload de fotos:', uploadError)
    throw createError({ statusCode: 500, statusMessage: 'Erro no upload das fotos.' })
  }

  try {
    const newRecord = await prisma.records.create({
      data: {
        user_id,
        record_date: new Date(record_date),
        weight,
        event: eventField,
        weekly_action: weeklyAction,
        workout_days,
        observations,
      },
    })

    // Inserir medições
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

    // Inserir arquivos vinculados
    const fileInserts: any[] = []
    if (photo_url) {
      fileInserts.push({
        record_id: newRecord.id,
        file_url: photo_url,
        file_type: 1,
        is_private: photo_is_private,
      })
    }
    if (forma_url) {
      fileInserts.push({
        record_id: newRecord.id,
        file_url: forma_url,
        file_type: 2,
        is_private: forma_is_private,
      })
    }

    if (fileInserts.length > 0) {
      await prisma.files.createMany({ data: fileInserts })
    }

    event.node.res.statusCode = 201
    return { message: 'Registro salvo com sucesso!', recordId: newRecord.id }
  } catch (dbError: any) {
    console.error('Erro de DB ao salvar registro:', dbError)
    throw createError({ statusCode: 500, statusMessage: 'Erro de banco de dados ao salvar registro.' })
  }
})
