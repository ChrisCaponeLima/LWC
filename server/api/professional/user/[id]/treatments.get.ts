// /server/api/professional/user/[id]/treatments.get.ts - V1.1 - CORRIGIDO (Permite profissional, admin e owner)
import { defineEventHandler, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { verifyAuthToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
    const userData = verifyAuthToken(event)
    const professionalUserId = userData.userId ?? userData.id

    // 1. Autorização: Apenas profissionais, admins e owners podem acessar esta rota
    // 💡 CORREÇÃO: Incluir 'admin' e 'owner' na lista de perfis permitidos.
    const allowedRoles = ['profissional', 'admin', 'owner']

    if (!allowedRoles.includes(userData.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas perfis autorizados (profissional, admin, owner) podem visualizar esta página.' })
    }

    const targetUserId = parseInt(event.context.params?.id as string)

    if (isNaN(targetUserId)) {
        throw createError({ statusCode: 400, statusMessage: 'ID do usuário inválido.' })
    }

    try {
        let professionalId: number | null = null

        // Se o usuário logado NÃO é um admin/owner, buscamos o seu perfil de profissional.
        // Se for admin/owner, não precisamos do professionalId para autorizar a leitura,
        // mas precisamos dele para a lógica de 'canDelete' (se aplicável, mas para admin/owner, podemos pular a busca).
        if (userData.role === 'profissional') {
            // Busca do Perfil do Profissional Logado
            const professional = await prisma.professionals.findUnique({
                where: { user_id: professionalUserId },
                select: { id: true }
            })

            if (!professional) {
                // Se for profissional, mas não tiver perfil profissional, bloqueia.
                throw createError({ statusCode: 403, statusMessage: 'Perfil de profissional não encontrado.' })
            }
            professionalId = professional.id
        } 
        // 💡 Se for admin/owner, 'professionalId' permanece null, o que está ok para a busca dos dados abaixo, 
        // exceto para a lógica 'canDelete' (que será tratada na formatação).
        
        // 2. Busca de todos os dados do usuário alvo e seus tratamentos
        // ... (Seção de transação mantida inalterada) ...
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
                    treatments: {
                        select: { id: true, treatment_name: true }
                    }
                },
                orderBy: { start_date: 'desc' }
            }),

            // Galeria de Fotos de Tratamento
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
            prisma.treatment_products.findMany({
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
                select: { id: true, treatment_name: true },
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
                treatmentId: t.treatments.id,
                name: t.treatments.treatment_name,
                startDate: t.start_date?.toISOString().split('T')[0],
                isActive: t.is_active
            })),
            treatmentPhotos: treatmentPhotos.map(p => ({
                id: p.id,
                url: p.file_url,
                description: p.description,
                date: p.treatment_date?.toISOString().split('T')[0],
                isPrivate: p.is_private,
                treatmentName: p.treatments.treatment_name,
                // 💡 AJUSTE: Permite que Admin/Owner sempre possam apagar fotos.
                canDelete: professionalId === p.uploaded_by_professional_id || 
                           (userData.role === 'admin' || userData.role === 'owner') 
            })),
            productsHistory: productsHistory.map(p => ({
                id: p.id,
                productName: p.product_name,
                dosage: p.dosage,
                notes: p.notes,
                date: p.administered_date?.toISOString().split('T')[0],
                treatmentName: p.treatments?.treatment_name || 'Geral'
            })),
            availableTreatments: allTreatments.map(t => ({
                id: t.id,
                name: t.treatment_name
            }))
        }
    } catch (err: any) {
        console.error('Erro ao buscar dados de tratamento:', err)
        if (err.statusCode) throw err
        throw createError({ statusCode: 500, statusMessage: 'Falha interna ao carregar dados de tratamento.' })
    }
})