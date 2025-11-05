// /server/api/professional/user/[id]/treatments.get.ts - V2.4 - CORREÇÃO CRÍTICA DO 500: Movendo a busca de áreas para fora da transação do Prisma.

import { defineEventHandler, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { verifyAuthToken } from '~/server/utils/auth'

// Função utilitária para converter Prisma Decimal para String (mantendo a precisão) ou null
const formatPrismaDecimal = (decimalValue: any): string | null => {
if (decimalValue === null || decimalValue === undefined) {
 return null;
}
try {
 return decimalValue.toString();
} catch (e) {
 console.error(`[formatPrismaDecimal] Falha ao processar o valor: ${decimalValue}`, e);
 return null;
}
}

/**
 * Função auxiliar para buscar e mapear as áreas de tratamento.
 * Replicando a lógica do /server/api/treatments/areas.get.ts.
 */
const fetchAvailableAreas = async () => {
    try {
   const availableAreas = await prisma.treatment_areas.findMany({
    select: {
     id: true,
     name: true,
    },
    orderBy: {
     name: 'asc'
    }
   });

   // Mapear e Padronizar (mantendo o mesmo formato do endpoint dedicado)
   return availableAreas.map(a => ({
    id: a.id,
    name: a.name,
   }));

    } catch (e) {
        console.error('[TREATMENTS.GET] Falha ao buscar treatment_areas. Retornando array vazio.', e);
        return [];
    }
}


export default defineEventHandler(async (event) => {
 try {
  const userData = verifyAuthToken(event)
  const professionalUserId = userData.userId ?? userData.id
  let professionalId: number | null = null

  const allowedRoles = ['profissional', 'admin', 'owner']
  const userRole = String(userData.role).trim().toLowerCase()

  // --- INÍCIO: BLOCO 403 DESATIVADO PARA DEBUG (Manter conforme o original) ---
  // if (!allowedRoles.includes(userRole)) {
  // throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas perfis autorizados (profissional, admin) podem visualizar esta página.' })
  // }
  // --- FIM: BLOCO 403 DESATIVADO PARA DEBUG ---

  // Validação do ID do paciente na URL
  const patientIdParam = event.context.params?.id
  if (!patientIdParam) {
   throw createError({ statusCode: 400, statusMessage: 'ID do usuário inválido ou ausente na rota.' })
  }

  const targetUserId = parseInt(patientIdParam as string)

  if (isNaN(targetUserId)) {
   throw createError({ statusCode: 400, statusMessage: 'ID do usuário inválido.' })
  }

  // Lógica Condicional para Obter professionalId
  if (userRole === 'profissional') {
   const professional = await prisma.professionals.findFirst({
    where: { user_id: professionalUserId },
    select: { id: true }
   })

   if (professional) {
    professionalId = professional.id
   } 
  } 

    // ✅ CORREÇÃO CRÍTICA: Chamamos a busca de áreas FORA do $transaction
    const areas = await fetchAvailableAreas();

  // O restante das consultas que dependem do usuário alvo permanece no $transaction
  const [targetUser, activeTreatments, treatmentPhotos, productsHistory, allTreatments] = await prisma.$transaction([
   // Target User (para display de nome)
   prisma.users.findUnique({
    where: { id: targetUserId },
    select: { id: true, apelido: true, username: true, photo_perfil_url: true }
   }),

   // Tratamentos Ativos do Usuário
   prisma.user_treatments.findMany({
    where: { user_id: targetUserId },
    select: {
     id: true,
     is_active: true,
     start_date: true,
     // ❌ CAMPOS REMOVIDOS/COMENTADOS
     treatments: {
      select: { id: true, treatment_name: true }
     }
    },
    orderBy: { start_date: 'desc' }
   }),

   // Galeria de Fotos de Tratamento (Sem alteração)
   prisma.user_treatment_photos.findMany({
    where: { user_id: targetUserId },
    select: {
     id: true,
     file_url: true,
     description: true,
     treatment_date: true,
     is_private: true,
     treatments: { select: { treatment_name: true } },
     uploaded_by_professional_id: true,
     uploaded_by_user: true
    },
    orderBy: { created_at: 'desc' }
   }),

   // Histórico de Produtos Ministrados
   prisma.user_administered_products.findMany({
    where: { user_id: targetUserId },
    select: {
     id: true,
     product_name: true,
     dosage: true,
     notes: true,
     administered_date: true,
     treatments: { select: { treatment_name: true } }
    },
    orderBy: { administered_date: 'desc' }
   }),

   // Todos os Tratamentos disponíveis (para o formulário de associação)
   prisma.treatments.findMany({
    select: { 
     id: true, 
     treatment_name: true,
     // ✅ CAMPOS DE PREÇO MANTIDOS
     precoP: true, 
     precoM: true, 
     precoG: true, 
     precoGG: true,
    },
    orderBy: { treatment_name: 'asc' }
   }),
  ]) // Fim do $transaction

  if (!targetUser) {
   throw createError({ statusCode: 404, statusMessage: 'Usuário alvo não encontrado.' })
  }

  // 3. Formatação e retorno
  return {
   targetUser: {
    id: targetUser.id,
    name: targetUser.apelido || targetUser.username,
    profilePhoto: targetUser.photo_perfil_url,
   },
   activeTreatments: activeTreatments.map(t => ({
    id: t.id,
    treatmentId: t.treatments?.id ?? 0, 
    name: t.treatments?.treatment_name ?? 'Tratamento Desconhecido',
    // Garante que a data é serializável
    startDate: t.start_date?.toISOString().split('T')[0],
    isActive: t.is_active,
    // ❌ CAMPOS REMOVIDOS/COMENTADOS
    // size: t.treatment_size,
    // isCourtesy: t.is_courtesy,
    // realCost: t.real_cost?.toString() ?? null 
   })),
   treatmentPhotos: treatmentPhotos.map(p => ({
    id: p.id,
    url: p.file_url,
    description: p.description,
    date: p.treatment_date?.toISOString().split('T')[0],
    isPrivate: p.is_private,
    treatmentName: p.treatments?.treatment_name ?? 'Não Especificado',
    canDelete: (userRole === 'admin' || userRole === 'owner') 
   })),
   productsHistory: productsHistory.map(p => ({
    id: p.id,
    productName: p.product_name,
    dosage: p.dosage,
    notes: p.notes,
    date: p.administered_date?.toISOString().split('T')[0],
    treatmentName: p.treatments?.treatment_name ?? 'Geral'
   })),
   availableTreatments: allTreatments.map(t => ({
    id: t.id,
    name: t.treatment_name,
    // ✅ CAMPOS DE PREÇO FORMATADOS
    precoP: formatPrismaDecimal(t.precoP),
    precoM: formatPrismaDecimal(t.precoM),
    precoG: formatPrismaDecimal(t.precoG),
    precoGG: formatPrismaDecimal(t.precoGG),
   })),
      // ✅ ADICIONANDO AS ÁREAS OBTIDAS FORA DA TRANSAÇÃO
      availableAreas: areas, 
  }
 } catch (err: any) {
  console.error('--- INÍCIO: DETALHES DE ERRO AO CARREGAR DADOS DE TRATAMENTO ---')
  console.error('Mensagem Original do Erro:', err.message || err)
  console.error('Stack Trace:', err.stack)
  console.error('Objeto Erro Completo:', err)
  console.error('--- FIM: DETALHES DE ERRO AO CARREGAR DADOS DE TRATAMENTO ---')

  if (err.statusCode) {
   if (err.statusCode === 401) {
    throw createError({ statusCode: 401, statusMessage: 'Sessão inválida. Necessário login.' })
   }
   throw err
  }

  // Em caso de erro não tratado (como o do Prisma), retorna 500
  throw createError({ statusCode: 500, statusMessage: 'Falha interna ao carregar dados de tratamento.' })
 }
})