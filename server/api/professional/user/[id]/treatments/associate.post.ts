// /server/api/professional/user/[id]/treatments/associate.post.ts - V2.0 - Implementação da Lógica de Precificação por Tamanho e Cortesia
import { defineEventHandler, createError, readBody } from 'h3'
import { prisma } from '~/server/utils/db' 
import { verifyAuthToken } from '~/server/utils/auth' 
import { Decimal } from '@prisma/client/runtime/library'

export default defineEventHandler(async (event) => {
    try {
        const userData = verifyAuthToken(event)
        const professionalUserId = userData.userId ?? userData.id; // ID do Usuário logado (FK na tabela professionals)
        const allowedRoles = ['profissional', 'admin', 'owner']
        const userRole = String(userData.role).trim().toLowerCase()

        if (!allowedRoles.includes(userRole)) {
            throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas perfis autorizados podem associar tratamentos.' })
        }

        // 1. Validação de IDs e Body
        const targetUserId = parseInt(event.context.params?.id as string)

        if (isNaN(targetUserId)) {
            throw createError({ statusCode: 400, statusMessage: 'ID do paciente inválido ou ausente.' })
        }

        const body = await readBody(event)
        // NOVOS CAMPOS: tratamentoId, tamanho (size), isCortesia
        const { treatmentId, treatment_size, isCortesia } = body 

        if (!treatmentId || !treatment_size) {
            throw createError({ statusCode: 400, statusMessage: 'treatmentId e treatment_size (P/M/G/GG) são obrigatórios.' })
        }

        const parsedTreatmentId = parseInt(treatmentId);
        const isCourtesyBool = Boolean(isCortesia);
        const sizeUpper = String(treatment_size).toUpperCase();
        
        // 2. Obter ID do Profissional que está associando (ID da tabela 'professionals')
        let professionalId: number | null = null;
        if (userRole === 'profissional' || userRole === 'admin' || userRole === 'owner') {
             const professional = await prisma.professionals.findFirst({
                where: { user_id: professionalUserId },
                select: { id: true }
            });

            // É importante ter o ID do registro 'professionals' para o log de associação
            if (professional) {
                professionalId = professional.id;
            } 
            // Se for admin/owner e não tiver registro em professionals, professionalId será null.
            // Isso é aceitável, mas é bom ter o log sempre que possível.
        }

        // 3. Buscar Tratamento e Definir o Custo Real
        const treatment = await prisma.treatments.findUnique({
            where: { id: parsedTreatmentId },
            select: { precoP: true, precoM: true, precoG: true, precoGG: true, treatment_name: true }
        });

        if (!treatment) {
            throw createError({ statusCode: 404, statusMessage: 'Tratamento não encontrado.' });
        }

        let realCost: Decimal | null = null;

        if (isCourtesyBool) {
            // Se for cortesia, o custo real é zero.
            realCost = new Decimal(0);
        } else {
            // Define o custo real baseado no tamanho
            switch (sizeUpper) {
                case 'P': realCost = treatment.precoP; break;
                case 'M': realCost = treatment.precoM; break;
                case 'G': realCost = treatment.precoG; break;
                case 'GG': realCost = treatment.precoGG; break;
                default:
                    // Se o tamanho for inválido, o custo real será null, o que exigirá atenção.
                    console.warn(`Tamanho de tratamento inválido (${sizeUpper}). Custo real não definido.`);
            }
        }
        
        // 4. Prevenção de Duplicidade (Tratamento ATIVO do mesmo TIPO e TAMANHO)
        const existingTreatment = await prisma.user_treatments.findFirst({
            where: {
                user_id: targetUserId,
                treatment_id: parsedTreatmentId,
                treatment_size: sizeUpper, // AGORA CHECA O TAMANHO
                is_active: true
            }
        });

        if (existingTreatment) {
            throw createError({ 
                statusCode: 409, 
                statusMessage: `Este tratamento (${sizeUpper}) já está ativo para o paciente.` 
            });
        }

        // 5. Execução: Cria um novo tratamento associado
        await prisma.user_treatments.create({
            data: {
                user_id: targetUserId,
                treatment_id: parsedTreatmentId,
                is_active: true,
                start_date: new Date(), // Usa a data atual como início
                treatment_size: sizeUpper,
                is_courtesy: isCourtesyBool,
                real_cost: realCost,
                // O campo 'associated_by_professional_id' (ID da tabela professionals)
                associated_by_professional_id: professionalId, 
            }
        })

        const courtesyStatus = isCourtesyBool ? 'Cortesia' : 'Pago';
        return { 
            success: true, 
            message: `Tratamento "${treatment.treatment_name}" (${sizeUpper} - ${courtesyStatus}) associado e iniciado com sucesso.` 
        }

    } catch (err: any) {
        console.error('Erro ao associar tratamento (V2.0):', err)
        if (err.statusCode) throw err
        throw createError({ statusCode: 500, statusMessage: 'Falha interna ao iniciar o tratamento.' })
    }
})