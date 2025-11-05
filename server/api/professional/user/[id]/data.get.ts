// /server/api/professional/user/[id]/data.get.ts - V1.9 - REMOÇÃO DA BUSCA GLOBAL DE ÁREAS: A busca por treatment_areas foi movida para o endpoint dedicado /api/treatments/areas.get.ts.

import { defineEventHandler, createError, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyAuthToken } from '~/server/utils/auth';

// Função utilitária para converter Date ou string para o formato de data YYYY-MM-DD esperado.
// É a função mais crítica para o erro 500.
const formatPrismaDate = (dateValue: Date | string | null | undefined): string | null => {
if (!dateValue) {
 return null;
}

let dateObj: Date;

try {
 if (dateValue instanceof Date) {
 dateObj = dateValue;
 } else if (typeof dateValue === 'string') {
 // Tenta criar um objeto Date a partir da string
 dateObj = new Date(dateValue);
 } else {
 // Se não for Date ou string, retorna null e loga o tipo inesperado
 console.warn(`[formatPrismaDate] Valor de data inesperado, tipo: ${typeof dateValue}. Valor:`, dateValue);
 return null;
 }

 // Verifica se o objeto Date é válido
 if (isNaN(dateObj.getTime())) {
 console.error('[formatPrismaDate] Objeto Date Inválido criado a partir do valor:', dateValue);
 return null;
 }

 // Converte para string ISO e pega a parte da data (YYYY-MM-DD)
 return dateObj.toISOString().split('T')[0];

} catch (e) {
 console.error(`[formatPrismaDate] Falha ao processar o valor: ${dateValue}`, e);
 return null;
}
}

// Função utilitária para converter Prisma Decimal para String (mantendo a precisão) ou null
const formatPrismaDecimal = (decimalValue: any): string | null => {
if (decimalValue === null || decimalValue === undefined) {
 return null;
}
// O Prisma Decimal possui um método .toString() para serialização segura
// Se não for um objeto Decimal do Prisma, tentará usar o toString()
try {
 return decimalValue.toString();
} catch (e) {
 console.error(`[formatPrismaDecimal] Falha ao processar o valor: ${decimalValue}`, e);
 return null;
}
}


export default defineEventHandler(async (event: H3Event) => {
const authPayload = verifyAuthToken(event);

// 1. Autorização: Apenas profissionais (e admin/owner) podem acessar
if (!['profissional', 'admin', 'owner'].includes(authPayload.role)) {
 throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas perfis autorizados podem visualizar o gerenciamento de pacientes.' });
}

const targetUserId = parseInt(event.context.params?.id as string); 

if (isNaN(targetUserId)) {
 throw createError({ statusCode: 400, statusMessage: 'ID do usuário alvo inválido.' });
}

try {
 console.log(`[DATA.GET] Buscando dados para User ID: ${targetUserId} (Role: ${authPayload.role})`);
  
 // 2. Buscar Detalhes do Usuário (apenas o essencial)
 const user = await prisma.users.findUnique({
 where: { id: targetUserId },
 select: {
  id: true,
  username: true,
  email: true,
  active: true, 
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
 select: {
  id: true,
  treatment_name: true,
  description: true,
  precoP: true, 
  precoM: true, 
  precoG: true, 
  precoGG: true, 
 },
 orderBy: {
  treatment_name: 'asc'
 }
 });
  console.log('[DATA.GET] Passo 4 (Available Treatments) OK.');

 
 // 🚨 REMOVIDO: A busca por treatment_areas foi movida para um endpoint dedicado.
 

 // 5. Mapear e Limpar Dados de Tratamento
 const mappedActiveTreatments = activeTreatments.map(t => ({
 id: t.id,
 treatmentId: t.treatment_id,
 name: t.treatments.treatment_name,
 startDate: formatPrismaDate(t.start_date),
 endDate: formatPrismaDate(t.end_date),
 isActive: t.is_active,
 }));

 const mappedAvailableTreatments = availableTreatments.map(t => ({
 id: t.id,
 name: t.treatment_name,
 description: t.description,
 precoP: formatPrismaDecimal(t.precoP), 
 precoM: formatPrismaDecimal(t.precoM),
 precoG: formatPrismaDecimal(t.precoG),
 precoGG: formatPrismaDecimal(t.precoGG),
 }));
  console.log('[DATA.GET] Passo 5 (Mapping) OK. Enviando resposta.');


 return {
 user: user,
 activeTreatments: mappedActiveTreatments,
 availableTreatments: mappedAvailableTreatments,
 // 🚨 REMOVIDO: availableAreas não é mais retornado aqui.
 };

} catch (err: any) {
 console.error(`[DATA.GET] Erro CRÍTICO de execução para User ID ${targetUserId}:`, err);
 
 if (err.statusCode) throw err;
 
 throw createError({ 
 statusCode: 500, 
 statusMessage: 'Falha interna ao carregar os dados do paciente.',
 data: { 
  details: err.message || 'Erro não especificado.',
  type: err.constructor.name 
 } 
 });
}
});