// /server/api/specialties.get.ts - V1.0 - Endpoint para buscar todas as especialidades
import { defineEventHandler, createError, H3Event } from 'h3'
import { prisma } from '~/server/utils/db.ts'
import { verifyToken } from '~/server/utils/auth.ts'

// Tipo de dados esperado no token
interface AuthPayload {
userId: number
role: string
}

export default defineEventHandler(async (event: H3Event) => {
// Embora esta informação seja considerada "pública" para usuários logados,
// a validação de token é mantida por segurança do endpoint interno.
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

// Acesso liberado para qualquer usuário autenticado (user, professional, admin, owner)
// if (payload.role === 'user' || payload.role === 'client') { 
//  throw createError({ statusCode: 403, statusMessage: 'Acesso Proibido.' })
// }

try {
 const specialtiesList = await prisma.specialties.findMany({
  select: {
   id: true,
   name: true,
  },
  orderBy: {
   name: 'asc'
  }
 })

 return specialtiesList
} catch (error: any) {
 console.error('Erro ao buscar lista de especialidades (API):', error)
 throw createError({
  statusCode: 500,
  statusMessage: 'Erro interno ao carregar a lista de especialidades. Verifique o log do servidor.'
 })
}
})