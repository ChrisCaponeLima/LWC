// /server/api/professional/user/[id]/data.get.ts - V1.3 - Removida verificação de relacionamento (Qualquer Profissional -> Qualquer Paciente). Adicionado log de isolamento de erro.
import { defineEventHandler, createError, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';

export default defineEventHandler(async (event: H3Event) => {
  const authPayload = verifyAuthToken(event);
  
  // 1. Autorização: Apenas profissionais (e admin/owner) podem acessar
  if (!['profissional', 'admin', 'owner'].includes(authPayload.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas perfis autorizados podem visualizar o gerenciamento de pacientes.' });
  }

  // Usando o parseInt nativo do JavaScript
  const targetUserId = parseInt(event.context.params?.id as string); 

  if (isNaN(targetUserId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID do usuário alvo inválido.' });
  }

  try {
    console.log(`[DATA.GET] Buscando dados para User ID: ${targetUserId} (Role: ${authPayload.role})`);
        
    // 2. Buscar Detalhes do Usuário (apenas o essencial)
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        email: true,
        is_active: true,
        role: true, 
      }
    });

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'Paciente não encontrado.' });
    }
        console.log('[DATA.GET] Passo 2 (User Details) OK.');

    // 3. Buscar Tratamentos Ativos (user_treatments)
    const activeTreatments = await prisma.user_treatments.findMany({
      where: {
        user_id: targetUserId,
        is_active: true,
      },
      select: {
        id: true,
        start_date: true,
        end_date: true,
        is_active: true,
        treatment_id: true,
        treatments: {
          select: {
            treatment_name: true,
          }
        }
      },
      orderBy: {
        start_date: 'desc'
      }
    });
        console.log('[DATA.GET] Passo 3 (Active Treatments) OK.');


    // 4. Buscar TODOS os Tratamentos Disponíveis (treatments)
    const availableTreatments = await prisma.treatments.findMany({
      where: {
        is_active: true, 
      },
      select: {
        id: true,
        treatment_name: true,
        description: true,
      },
      orderBy: {
        treatment_name: 'asc'
      }
    });
        console.log('[DATA.GET] Passo 4 (Available Treatments) OK.');


    // 5. Mapear e Limpar Dados de Tratamento
    const mappedActiveTreatments = activeTreatments.map(t => ({
      id: t.id,
      treatmentId: t.treatment_id,
      name: t.treatments.treatment_name,
      startDate: t.start_date ? t.start_date.toISOString().split('T')[0] : null,
      endDate: t.end_date ? t.end_date.toISOString().split('T')[0] : null,
      isActive: t.is_active,
    }));

    const mappedAvailableTreatments = availableTreatments.map(t => ({
      id: t.id,
      name: t.treatment_name,
      description: t.description,
    }));
        console.log('[DATA.GET] Passo 5 (Mapping) OK. Enviando resposta.');


    return {
      user: user,
      activeTreatments: mappedActiveTreatments,
      availableTreatments: mappedAvailableTreatments,
    };

  } catch (err: any) {
    console.error(`[DATA.GET] Erro CRÍTICO de execução para User ID ${targetUserId}:`, err);
    
    // Re-throw erros HTTP criados explicitamente (403, 404, etc.)
    if (err.statusCode) throw err;
    
    // Erro interno desconhecido
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Falha interna ao carregar os dados do paciente.',
      data: { details: err.message || 'Erro não especificado.' } // 💡 Adiciona detalhes para debug no frontend
    });
  }
});