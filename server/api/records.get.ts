// /server/api/records.get.ts – v1.2 – corrigido e com chaves balanceadas
import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma } from '~/server/utils/db.ts'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = Number(query.userId)

  try {
    if (!userId || isNaN(userId)) {
      throw createError({ statusCode: 400, statusMessage: 'ID de usuário não fornecido.' })
    }

    const records = await prisma.records.findMany({
      where: { user_id: userId },
      orderBy: { record_date: 'asc' },
      select: {
        id: true,
        record_date: true,
        weight: true,
        event: true,
        weekly_action: true,
        workout_days: true,
        observations: true,
        photo_url: true,
        forma_url: true,
        record_measurements: {
          select: {
            value: true,
            measurements: {
              select: { id: true, name: true, unit: true }
            }
          }
        }
      }
    })

    const formattedRecords = records.map((record) => ({
      id: record.id,
      record_date: record.record_date,
      weight: record.weight ? parseFloat(record.weight.toString()) : null,
      event: record.event,
      weekly_action: record.weekly_action,
      workout_days: record.workout_days,
      observations: record.observations,
      photo_url: record.photo_url,
      forma_url: record.forma_url,
      measurements: record.record_measurements.map((rm) => ({
        id: rm.measurements.id,
        name: rm.measurements.name,
        unit: rm.measurements.unit,
        value: parseFloat(rm.value.toString())
      }))
    }))

    return formattedRecords
  } catch (error: any) {
    console.error('Erro no handler records.get:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno ao buscar registros.' })
  }
})
