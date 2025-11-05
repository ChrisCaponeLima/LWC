// /server/api/users.get.ts - V2.1 - Correção da nomenclatura 'professional' para 'professionals' no select do Prisma.
import { defineEventHandler, createError, H3Event } from 'h3'
import { prisma } from '~/server/utils/db.ts'
import { verifyToken } from '~/server/utils/auth.ts'
import { calculateLatestMeasurementsWithTrend, LatestMeasurementData } from '~/server/utils/measurements' 

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

// Somente admin/owner tem permissão de consultar este endpoint
if (payload.role !== 'admin' && payload.role !== 'owner' && payload.role !== 'profissional') { // Role CORRETA
    throw createError({ statusCode: 403, statusMessage: 'Acesso Proibido. Você não tem permissão para listar usuários.' })
}

try {
// A busca no prisma já ordena os records.
const users = await prisma.users.findMany({
where: {
 role: { not: 'owner' }
},
select: {
 id: true,
 username: true,
 email: true,
 role: true,
 last_login: true,
 birthdate: true,
 photo_perfil_url: true,
 initial_weight_kg: true,
 sexo: true,
 phone: true,
 active: true,

 // 🎯 CORREÇÃO: Usar 'professionals' (plural) conforme o schema do Prisma
 professionals: {
 select: {
 id: true,
 job_title: true,
 registro_conselho: true,
 cpf: true,
 address_street: true,
 address_city: true,
 address_state: true,
 address_zipcode: true,
 is_active: true,
 professionals_specialties: {
 select: {
  specialty_id: true
 }
 }
 }
 },

 // BUSCA TODOS os records (ordenados desc) com medidas e arquivos
 records: {
 orderBy: { record_date: 'desc' },
 // Garantimos que estamos buscando DADOS SUFICIENTES para o cálculo da tendência
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
 },
 files: {
 select: {
  file_url: true,
  file_type: true,
  is_private: true,
  created_at: true
 }
 }
 }
 }
},
orderBy: { id: 'asc' }
})

// se caller for owner, permitimos incluir privados
const callerIsOwner = payload.role === 'owner'

const formattedUsers = users.map(user => {
const records = user.records || []
const latestRecord = records.length > 0 ? records[0] : null

// Substituímos a lógica de mapeamento simples
const latestMeasurementsWithTrend = calculateLatestMeasurementsWithTrend(records as any)

// --- Galerias (agrega TODOS os records)
const registroTypes = [1, 0] // 1 (registro) preferencial, 0 fallback histórico
const formaTypes = [2] // 2 => forma

const publicPhotos = records
 .flatMap(r => (r.files || [])
 .filter(f => registroTypes.includes(f.file_type) && (callerIsOwner || f.is_private === 0))
 .map(f => ({ url: f.file_url, date: r.record_date, recordId: r.id }))
 )

const publicFormas = records
 .flatMap(r => (r.files || [])
 .filter(f => formaTypes.includes(f.file_type) && (callerIsOwner || f.is_private === 0))
 .map(f => ({ url: f.file_url, date: r.record_date, recordId: r.id }))
 )

const formatDbDate = (dbDate: Date | null | undefined) => {
 if (!dbDate) return null
 if (!(dbDate instanceof Date)) return null
 return dbDate.toISOString().split('T')[0]
}

return {
 id: user.id,
 username: user.username,
 email: user.email,
 role: user.role,
 lastLogin: formatDbDate(user.last_login),
 birthdate: formatDbDate(user.birthdate),
 photo_perfil_url: user.photo_perfil_url,
 initialWeight: user.initial_weight_kg?.toString() || null,
 sexo: user.sexo,
 phone: user.phone,
 active: user.active,
 // 🎯 CORREÇÃO: Mapear user.professionals (plural do Prisma) para professional (singular da API de retorno)
 professional: user.professionals, 
 // O peso atual está AGORA incluído no objeto latestMeasurementsWithTrend
 currentWeight: latestRecord?.weight?.toString() || null, 
 latestMeasurements: latestMeasurementsWithTrend, // ⬅️ NOVO OBJETO COM DADOS E TENDÊNCIA
 publicPhotos,
 publicFormas
}
})

return formattedUsers
} catch (error: any) {
console.error('Erro ao buscar lista de usuários (API):', error)
throw createError({
statusCode: 500,
statusMessage: 'Erro interno ao carregar a lista de usuários. Verifique o log do servidor.'
})
}
})