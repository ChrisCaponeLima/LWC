// /server/api/professional/user/[id]/treatments/associate.post.ts - V1.2 - Mudança para salvar treatment_area_id (FK) e tratamento de ID
import { defineEventHandler, createError, readBody } from 'h3'
import { prisma } from '~/server/utils/db' 
import { verifyAuthToken } from '~/server/utils/auth' 

export default defineEventHandler(async (event) => {
  // Autenticação e Autorização (Reutiliza a lógica corrigida)
  const userData = verifyAuthToken(event)
  const allowedRoles = ['profissional', 'admin', 'owner']

  if (!allowedRoles.includes(userData.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas perfis autorizados podem associar tratamentos.' })
  }

  const targetUserId = parseInt(event.context.params?.id as string)
    // ID do profissional logado
  const professionalUserId = userData.user_id 

  if (isNaN(targetUserId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID do usuário alvo inválido.' })
  }

  const body = await readBody(event)
  // NOVO: Captura treatment_area_id (pode ser 0 ou null)
  const { treatment_id, start_date, treatment_area_id } = body 

  // 1. Validação do Body
  if (!treatment_id || !start_date) {
    throw createError({ statusCode: 400, statusMessage: 'treatment_id e start_date são obrigatórios.' })
  }
    
    // Converte e valida o ID da área, garantindo que seja number ou null.
    let areaId: number | null = null;
    if (treatment_area_id) {
        // Converte para número e verifica se o ID é válido (> 0)
        areaId = Number(treatment_area_id); 
        if (isNaN(areaId) || areaId <= 0) {
            areaId = null; // Garante NULL se não for um ID válido.
        }
    }

  try {
    // 2. Checa se o tratamento já está ativo (Prevenção de Duplicidade)
    const existingTreatment = await prisma.user_treatments.findFirst({
      where: {
        user_id: targetUserId,
        treatment_id: treatment_id,
        is_active: true
      }
    })

    if (existingTreatment) {
      throw createError({ 
        statusCode: 409, // Conflict
        statusMessage: 'Este tratamento já está ativo para o paciente.' 
      })
    }

    // 3. Execução: Cria um novo tratamento associado (Início)
    await prisma.user_treatments.create({
      data: {
        user_id: targetUserId,
        treatment_id: treatment_id,
        is_active: true,
        start_date: new Date(start_date), 
        professional_user_id: professionalUserId, 
                // NOVO: Usa o ID validado (ou null)
        treatment_area_id: areaId, 
      }
    })

    return { success: true, message: 'Tratamento associado e iniciado com sucesso.' }

  } catch (err: any) {
    console.error('Erro ao associar tratamento:', err)
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'Falha interna ao iniciar o tratamento.' })
  }
})