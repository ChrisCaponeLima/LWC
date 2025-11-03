// /server/api/professional/user/[id]/treatments.get.ts - V2.2.0 - ATUALIZAÇÃO: Inclusão de novos campos (size, courtesy, cost) e renomeação de tabela.

import { defineEventHandler, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { verifyAuthToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
    try {
        const userData = verifyAuthToken(event)
        const professionalUserId = userData.userId ?? userData.id
        let professionalId: number | null = null

        const allowedRoles = ['profissional', 'admin', 'owner']
        const userRole = String(userData.role).trim().toLowerCase()

        // --- INÍCIO: BLOCO 403 DESATIVADO PARA DEBUG (Manter conforme o original) ---
        // if (!allowedRoles.includes(userRole)) {
        //  throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas perfis autorizados (profissional, admin) podem visualizar esta página.' })
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

        // 2. Busca de todos os dados do usuário alvo e seus tratamentos
        // 🚨 ATENÇÃO: productsHistory agora busca em user_administered_products
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
                    // 🌟 NOVOS CAMPOS ADICIONADOS
                    treatment_size: true,
                    is_courtesy: true,
                    real_cost: true,
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
            // 🚨 ATENÇÃO: Tabela alterada de 'treatment_products' para 'user_administered_products'
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
            // 🌟 CAMPOS DE PREÇO ADICIONADOS
            prisma.treatments.findMany({
                select: { 
                    id: true, 
                    treatment_name: true,
                    precoP: true, 
                    precoM: true, 
                    precoG: true, 
                    precoGG: true,
                },
                orderBy: { treatment_name: 'asc' }
            })
        ])

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
                startDate: t.start_date?.toISOString().split('T')[0],
                isActive: t.is_active,
                // 🌟 NOVOS CAMPOS FORMATADOS
                size: t.treatment_size,
                isCourtesy: t.is_courtesy,
                // Converte Decimal do Prisma para String para o frontend
                realCost: t.real_cost?.toString() ?? null 
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
                // 🌟 NOVOS CAMPOS FORMATADOS: Converte Decimal para String
                precoP: t.precoP?.toString() ?? null,
                precoM: t.precoM?.toString() ?? null,
                precoG: t.precoG?.toString() ?? null,
                precoGG: t.precoGG?.toString() ?? null,
            }))
        }
    } catch (err: any) {
        // (Bloco de tratamento de erro mantido conforme o original)
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

        throw createError({ statusCode: 500, statusMessage: 'Falha interna ao carregar dados de tratamento.' })
    }
})