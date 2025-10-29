// /server/api/professional/user/[id]/treatments/end.post.ts - V1.4 - REESTRUTURAÇÃO: Usa updateMany para atomicidade e corrige o Erro 500 (falha na atualização).
import { defineEventHandler, createError, readBody } from 'h3'
import { prisma } from '~/server/utils/db' 
import { verifyAuthToken } from '~/server/utils/auth' 

// Função utilitária para normalizar a data para comparação
const normalizeDate = (date: Date): Date => {
 const normalized = new Date(date);
 normalized.setUTCHours(0, 0, 0, 0); 
 return normalized;
}

export default defineEventHandler(async (event) => {
 // Autorização: Apenas perfis autorizados
 const userData = verifyAuthToken(event)
 const allowedRoles = ['profissional', 'admin', 'owner']

 if (!allowedRoles.includes(userData.role)) {
  throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas perfis autorizados podem encerrar tratamentos.' })
 }

 const targetUserId = parseInt(event.context.params?.id as string)

 if (isNaN(targetUserId)) {
  throw createError({ statusCode: 400, statusMessage: 'ID do usuário alvo inválido.' })
 }

 const body = await readBody(event)
 const { user_treatment_id, end_date } = body

 // 1. Validação do Body e Conversão do ID do Tratamento
 if (!user_treatment_id || !end_date) {
  throw createError({ statusCode: 400, statusMessage: 'user_treatment_id e end_date são obrigatórios.' })
 }
 
 const treatmentIdNum = parseInt(user_treatment_id);
 if (isNaN(treatmentIdNum)) {
  throw createError({ statusCode: 400, statusMessage: 'ID do registro de tratamento (user_treatment_id) inválido.' })
 }

 try {
  // 🛑 REESTRUTURAÇÃO: Busca o tratamento APENAS para validação da data de início.
  const existingTreatment = await prisma.user_treatments.findUnique({
   where: { id: treatmentIdNum },
   select: { start_date: true, is_active: true }
  })

  if (!existingTreatment) {
   throw createError({ statusCode: 404, statusMessage: 'Registro de tratamento não encontrado.' })
  }
  
  if (!existingTreatment.is_active) {
   throw createError({ statusCode: 400, statusMessage: 'O tratamento já está encerrado.' })
  }

  // Validação da Regra de Negócio: Data de Encerramento vs Data de Início
  const startDateNormalized = normalizeDate(existingTreatment.start_date);
  // Cria a data de encerramento, garantindo que seja lida no fuso horário correto (UTC)
  const endDateObj = new Date(end_date + 'T00:00:00.000Z'); 
  const endDateNormalized = normalizeDate(endDateObj); 

  if (endDateNormalized < startDateNormalized) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'A data de encerramento não pode ser anterior à data de início do tratamento.' 
    })
  }

  // 3. Execução: Usa updateMany com todas as restrições para segurança e atomicidade.
  // Se a atualização falhar, é porque o registro não atendeu todas as condições (e.g., pertence a outro usuário).
  const result = await prisma.user_treatments.updateMany({
   where: {
    id: treatmentIdNum,
    user_id: targetUserId, // Garante que o tratamento pertence ao paciente
    is_active: true // Garante que apenas tratamentos ativos são encerrados
   },
   data: {
    is_active: false,
    end_date: endDateObj, 
   }
  })

  if (result.count === 0) {
   // Se count for 0, o registro não foi encontrado ou não atendeu às condições do where (já inativo, ID errado, ou user_id errado)
   throw createError({ statusCode: 404, statusMessage: 'Tratamento ativo não encontrado para este paciente.' })
  }

  return { success: true, message: 'Tratamento encerrado com sucesso.' }

 } catch (err: any) {
  console.error('Erro ao encerrar tratamento:', err)
  if (err.statusCode) throw err
  // Se o erro não for um erro de validação (400, 403, 404), é um erro interno (500)
  throw createError({ statusCode: 500, statusMessage: 'Falha interna ao encerrar o tratamento.' })
 }
})