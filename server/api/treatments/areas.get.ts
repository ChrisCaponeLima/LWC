// /server/api/treatments/areas.get.ts - V1.3 - REFORÇO NO TRATAMENTO DE ERROS E LOGS: Melhora a captura e log de falhas para isolar a causa (Dados vazios vs. Falha da API).

import { defineEventHandler, createError, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';

/**
* Handler para buscar todas as áreas de tratamento disponíveis.
* Este é um recurso global.
*/
export default defineEventHandler(async (event: H3Event) => {
 const authPayload = verifyAuthToken(event);

 // Autorização: O primeiro ponto de falha a ser verificado
 if (!['profissional', 'admin', 'owner'].includes(authPayload.role)) {
   console.warn('[AREAS.GET] Acesso negado para o perfil:', authPayload.role);
   throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Perfil não autorizado.' });
 }
 
 let availableAreas = [];
 try {
   // 1. Buscar TODAS as Áreas de Tratamento Disponíveis (treatment_areas)
   availableAreas = await prisma.treatment_areas.findMany({
     select: {
       id: true,
       name: true, // Campo correto: 'name'
     },
     orderBy: {
       name: 'asc' // Campo correto: 'name'
     }
   });

   console.log(`[AREAS.GET] SUCCESSO: Buscando ${availableAreas.length} áreas disponíveis. (Se 0, o DB está vazio)`);

   // 2. Mapear e Padronizar para o Frontend
   const mappedAvailableAreas = availableAreas.map(a => ({
     id: a.id,
     name: a.name, // Campo correto: 'name'
   }));

   return {
     availableAreas: mappedAvailableAreas,
   };

 } catch (err: any) {
   // Se chegarmos aqui, é um erro de DB, conexão ou Prisma, e não de dados vazios.
   console.error('[AREAS.GET] Erro CRÍTICO do Prisma/DB:', err.message, err);

   throw createError({
     statusCode: 500,
     statusMessage: `Falha interna ao carregar áreas de tratamento. Por favor, verifique a conexão com o DB.`,
     data: { details: err.message || 'Erro não especificado.' }
   });
 }
});