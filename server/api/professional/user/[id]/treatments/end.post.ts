// /server/api/professional/user/[id]/treatments/end.post.ts - V1.1 - ADICIONANDO VALIDAÇÃO DE REGRA DE NEGÓCIO DA DATA
import { defineEventHandler, createError, readBody } from 'h3'
import { prisma } from '~/server/utils/db' 
import { verifyAuthToken } from '~/server/utils/auth' 

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

  // 1. Validação do Body
  if (!user_treatment_id || !end_date) {
    throw createError({ statusCode: 400, statusMessage: 'user_treatment_id e end_date são obrigatórios.' })
  }

  try {
        // 2. Busca o tratamento para validação da data de início
        const existingTreatment = await prisma.user_treatments.findFirst({
      where: {
        id: user_treatment_id,
        user_id: targetUserId,
        is_active: true
      }
    })

    if (!existingTreatment) {
      throw createError({ statusCode: 404, statusMessage: 'Tratamento ativo não encontrado ou já encerrado.' })
    }

        // Validação da Regra de Negócio: Data de Encerramento vs Data de Início
        const startDate = existingTreatment.start_date;
        const endDate = new Date(end_date); 

        // O Prisma/DB armazena a data de início como Date, então a comparação é feita com objetos Date.
        // A comparação deve ser feita apenas pela data (ignorando a hora)
        if (endDate < startDate) {
            throw createError({ 
                statusCode: 400, 
                statusMessage: 'A data de encerramento não pode ser anterior à data de início do tratamento.' 
            })
        }

    // 3. Execução: Atualiza o registro para inativá-lo
    const updatedTreatment = await prisma.user_treatments.update({
      where: {
        id: user_treatment_id,
        user_id: targetUserId, 
        is_active: true 
      },
      data: {
        is_active: false,
        end_date: endDate, 
      }
    })

    return { success: true, message: 'Tratamento encerrado com sucesso.' }

  } catch (err: any) {
    console.error('Erro ao encerrar tratamento:', err)
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'Falha interna ao encerrar o tratamento.' })
  }
})