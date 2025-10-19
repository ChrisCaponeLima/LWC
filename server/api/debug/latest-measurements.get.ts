// /server/api/debug/latest-measurements.get.ts - V1.0 - Endpoint de debug para testar o calculateLatestMeasurementsWithTrend.
import { defineEventHandler, createError, H3Event } from 'h3'
import { prisma } from '~/server/utils/db.ts'
import { verifyToken } from '~/server/utils/auth.ts'
import { calculateLatestMeasurementsWithTrend } from '~/server/utils/measurementUtils'

// Tipo de dados esperado no token
interface AuthPayload {
 userId: number
 role: string
}

export default defineEventHandler(async (event: H3Event) => {
 const token = event.headers.get('Authorization')?.split(' ')[1]

 if (!token) {
  throw createError({ statusCode: 401, statusMessage: 'Não autorizado. Token não fornecido.' })
 }

 let payload: AuthPayload
 try {
  payload = verifyToken(token) as AuthPayload
 } catch (e) {
  throw createError({ statusCode: 401, statusMessage: 'Token inválido ou expirado.' })
 }

 // Busca o usuário logado e seus records (com medidas)
 try {
  const user = await prisma.users.findUnique({
   where: { id: payload.userId },
   select: {
    username: true,
    records: {
     orderBy: { record_date: 'desc' },
     select: { 
      id: true,
      record_date: true,
      weight: true,
      record_measurements: {
       select: {
        value: true,
        measurements: {
         select: {
          name: true,
          unit: true
         }
        }
       }
      }
     }
    }
   }
  })

  if (!user) {
   return { username: 'Usuário não encontrado', latestMeasurements: {} }
  }

  // Processa os dados usando o utilitário
  const latestMeasurementsWithTrend = calculateLatestMeasurementsWithTrend(user.records as any)

  // Retorna apenas o nome do usuário e o objeto processado
  return {
   username: user.username,
   latestMeasurements: latestMeasurementsWithTrend
  }
 } catch (error: any) {
  console.error('Erro ao buscar dados de debug:', error)
  throw createError({
   statusCode: 500,
   statusMessage: 'Erro interno no debug da tendência de medidas.'
  })
 }
})