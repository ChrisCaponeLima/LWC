// /server/api/records.post.ts
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

  // Helper para extrair valores de campos de texto
  const getFieldValue = (name: string): string | null => {
    const field = formData.find((item) => item.name === name)
    if (field && field.data && !field.filename) {
      return field.data.toString('utf-8')
    }
    return null
  }

  // Campos obrigatórios
  const userIdStr = getFieldValue('user_id')
  const record_date = getFieldValue('record_date')
  const weightStr = getFieldValue('weight')
  const measurementsJson = getFieldValue('measurements')

  if (!userIdStr || !record_date || !weightStr) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Dados essenciais (ID do usuário, data ou peso) não fornecidos no corpo da requisição.',
    })
  }

  const user_id = Number(userIdStr)
  const weight = parseFloat(weightStr)

  if (isNaN(user_id) || isNaN(weight)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do usuário ou Peso fornecidos em formato inválido.',
    })
  }

  // Campos opcionais
  const eventField = getFieldValue('event')
  const weeklyAction = getFieldValue('weeklyAction')
  const workoutDaysStr = getFieldValue('workoutDays')
  const observations = getFieldValue('observations')
  const workout_days = workoutDaysStr ? Number(workoutDaysStr) : null

  // Arquivos
  const photoFile = formData.find((item) => item.name === 'photo' && item.filename)
  const formaFile = formData.find((item) => item.name === 'forma' && item.filename)

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
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao fazer upload de fotos. Verifique a configuração do Cloudinary.',
    })
  }

  // Transação de banco de dados
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
        photo_url,
        forma_url,
      },
    })

    if (measurementsJson) {
      const parsedMeasurements = JSON.parse(measurementsJson)
      if (Array.isArray(parsedMeasurements) && parsedMeasurements.length > 0) {
        const measurementInserts = parsedMeasurements.map(
          (m: { measurement_id: number; value: number }) => ({
            record_id: newRecord.id,
            measurement_id: m.measurement_id,
            value: m.value,
          })
        )

        await prisma.record_measurements.createMany({
          data: measurementInserts,
        })
      }
    }

    event.node.res.statusCode = 201
    return { message: 'Registro salvo com sucesso!', recordId: newRecord.id }
  } catch (dbError: any) {
    console.error('Erro de DB ao salvar registro:', dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro de banco de dados ao salvar registro.',
    })
  }
})
