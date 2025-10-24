// /server/api/users/[id].put.ts - V2.1 - Correção da lógica de sobrescrita do Cargo para preservar o privilégio 'admin'/'owner' e garantir a persistência na tabela 'professionals'.
import { defineEventHandler, readBody, createError, getRouterParam, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyToken } from '~/server/utils/auth';
import { Prisma } from '@prisma/client'; // Importar Prisma para erros conhecidos

// Tipo de dados esperado no token
interface AuthPayload {
userId: number
role: string
}

// O tipo de dados recebido para Profissionais, conforme emitido pelo modal
interface ProfessionalUpdateData {
job_title?: string | null;
registro_conselho?: string | null;
cpf?: string | null;
address_street?: string | null;
address_city?: string | null;
address_state?: string | null;
address_zipcode?: string | null;
specialtyIds: number[]; // Array de IDs de especialidades
}

// O tipo de dados recebido no corpo da requisição PUT (User + Professional aninhado)
interface UserUpdatePayload {
id: number; // Adicionado do frontend
username: string;
email: string;
// 🎯 ALTERADO: Novo cargo 'profissional'
role: 'user' | 'admin' | 'owner' | 'profissional';
birthdate: string | null;
height_cm: number | null;
initial_weight_kg: number | null;
sexo: 'M' | 'F' | null;
phone: string | null;
professionalData: ProfessionalUpdateData; // NOVO
}

export default defineEventHandler(async (event: H3Event) => {
if (event.method !== 'PUT') {
throw createError({ statusCode: 405, statusMessage: 'Método não permitido.' });
}

const userIdToUpdate = Number(getRouterParam(event, 'id'));
if (isNaN(userIdToUpdate)) {
throw createError({ statusCode: 400, statusMessage: 'ID de usuário inválido.' });
}

const token = event.headers.get('Authorization')?.split(' ')[1]

if (!token) {
throw createError({ statusCode: 401, statusMessage: 'Não autorizado. Token não fornecido.' })
}

let payload: AuthPayload
try {
payload = verifyToken(token) as AuthPayload
} catch (e) {
throw createError({ statusCode: 401, statusMessage: 'Token inválido ou expirado.' })
}

const body = await readBody<UserUpdatePayload>(event);
// CORREÇÃO 1: Garante que 'professionalData' seja um objeto vazio se for undefined.
const { professionalData = {}, ...userData } = body; 
let { username, email, role, birthdate, height_cm, initial_weight_kg, sexo, phone } = userData;
// CORREÇÃO 2: Garante que 'specialtyIds' seja um array vazio se não estiver presente.
const { specialtyIds = [] } = professionalData as ProfessionalUpdateData; 

// 🎯 Definição clara dos cargos que disparam o registro profissional
const PROFESSIONAL_ROLES = ['profissional', 'admin', 'owner']; // Assume que admin/owner também são profissionais

// 🎯 NOVO CÓDIGO CRÍTICO: SOBRESCRITA INTELIGENTE DO CAMPO 'role'
// Verifica se a profissionalização está sendo solicitada (ou seja, se o admin enviou dados profissionais)
const hasRelevantProfessionalData = (
    // Se há pelo menos uma chave diferente de 'specialtyIds' OU se 'specialtyIds' não está vazio
    Object.keys(professionalData).some(key => key !== 'specialtyIds') || 
    (specialtyIds && specialtyIds.length > 0)
);

if (hasRelevantProfessionalData) {
    // REGRA DE OURO: Se a intenção é cadastrar como profissional,
    // e o cargo VAI ser 'user', elevamos para 'profissional'.
    // Cargos 'admin' ou 'owner' são mantidos.
    if (role === 'user') {
        role = 'profissional';
    }
}
// -------------------------------------------------------------------------

// 🛑 AUTORIZAÇÃO AVANÇADA: Owner/Admin pode editar. Admin não pode se promover a Owner.
// Mantemos a regra de quem pode editar: admin ou owner.
if (payload.role !== 'owner' && payload.role !== 'admin') {
throw createError({ statusCode: 403, statusMessage: 'Acesso Proibido. Você não tem permissão para editar usuários.' })
}
if (payload.role === 'admin' && role === 'owner') {
throw createError({ statusCode: 403, statusMessage: 'Somente um Owner pode atribuir o cargo de Owner.' })
}


try {

// Prepara o objeto de dados para a tabela 'users'
const dataToUpdate: any = {};
if (username !== undefined) dataToUpdate.username = username;
if (email !== undefined) dataToUpdate.email = email;
// 🎯 ATENÇÃO: 'role' agora usa o valor potencialmente sobrescrito!
if (role !== undefined) dataToUpdate.role = role;
if (birthdate !== undefined) dataToUpdate.birthdate = birthdate ? new Date(birthdate) : null;
if (height_cm !== undefined) dataToUpdate.height_cm = height_cm || null;
if (initial_weight_kg !== undefined) dataToUpdate.initial_weight_kg = initial_weight_kg || null;
if (sexo !== undefined) dataToUpdate.sexo = sexo || null;
if (phone !== undefined) dataToUpdate.phone = phone || null;

// CORREÇÃO: Verifica se há dados para atualizar, tanto em 'dataToUpdate' quanto em 'professionalData'
if (Object.keys(dataToUpdate).length === 0 && Object.keys(professionalData).length === 0) {
throw createError({ statusCode: 400, statusMessage: 'Nenhum dado válido para atualização foi fornecido.' });
}

// 1. Encontra o ID do registro 'professionals' existente (se houver)
const existingProfessional = await prisma.professionals.findUnique({
where: { user_id: userIdToUpdate },
select: { id: true, is_active: true }
});


// Inicia a transação atômica
const [updatedUser, finalProfessionalRecord] = await prisma.$transaction(async (tx) => {

// 🎯 NOVO: Declara 'professionalId' e 'professionalRecord' dentro da transação para garantir o escopo.
let professionalId: number | undefined = existingProfessional?.id;
let professionalRecord: any = undefined; 

// A. Atualiza os dados básicos do Usuário
const userUpdateOperation = tx.users.update({
where: { id: userIdToUpdate },
data: dataToUpdate,
select: { 
id: true, 
username: true, 
email: true, 
role: true,
birthdate: true,
height_cm: true,
initial_weight_kg: true,
sexo: true,
created_at: true, 
last_login: true,
photo_perfil_url: true,
phone: true
}
});

// 🎯 B. Lógica de Profissional (Prioridade de execução para obter o ID se for CREATE)
// AJUSTE CRÍTICO: Usar ?? null para garantir que o Prisma receba null em vez de undefined.
const profData = {
job_title: professionalData.job_title ?? null,
registro_conselho: professionalData.registro_conselho ?? null,
cpf: professionalData.cpf ?? null,
address_street: professionalData.address_street ?? null,
address_city: professionalData.address_city ?? null,
address_state: professionalData.address_state ?? null,
address_zipcode: professionalData.address_zipcode ?? null,
is_active: true, // Padrão é ativo se for um cargo profissional
};

// 🎯 CORREÇÃO CRÍTICA: Verifica se o novo cargo (potencialmente sobrescrito) é um dos cargos profissionais
if (PROFESSIONAL_ROLES.includes(role)) {

if (existingProfessional) {
// UPDATE: Se já existe, preparamos a Promise para execução paralela
professionalRecord = tx.professionals.update({
 where: { id: professionalId },
 data: profData,
});
} else {
// 🎯 CREATE (Criação de novo profissional) - EXECUTA SÉRIE PARA OBTER O ID
professionalRecord = await tx.professionals.create({
 data: {
 ...profData,
 user_id: userIdToUpdate,
 }
});
// OBTEMOS O ID DO NOVO REGISTRO IMEDIATAMENTE
professionalId = professionalRecord.id;
}

} else if (existingProfessional && existingProfessional.is_active) {
// Rebaixamento para um cargo NÃO profissional (ex: 'user'): Inativa o profissional
professionalRecord = tx.professionals.update({
where: { id: professionalId },
data: { is_active: false },
});
// Note: profData.is_active não é necessário aqui, mas manteremos o professionalRecord para o retorno da transação.
} else {
// Usuário comum sem alterações no registro professional, ou inativo.
professionalRecord = undefined;
}

// C. Sincronização de Especialidades (AQUI USAMOS O professionalId, que agora é garantido se houve CREATE)
// 🎯 CORREÇÃO CRÍTICA: Verifica novamente se o novo cargo é profissional para sincronizar especialidades
if (professionalId && PROFESSIONAL_ROLES.includes(role)) {

// 1. DELETE: Remove todas as especialidades que NÃO estão na nova lista
const deleteSpecialties = tx.professionals_specialties.deleteMany({
where: {
professional_id: professionalId,
specialty_id: {
notIn: specialtyIds
}
}
});

// 2. CREATE: Cria apenas as novas especialidades
const createSpecialties = tx.professionals_specialties.createMany({
data: specialtyIds.map(id => ({
professional_id: professionalId!, // O ID existe neste ponto
specialty_id: id
})),
skipDuplicates: true, // Ignora IDs já existentes, garantindo a atomicidade
});

await Promise.all([deleteSpecialties, createSpecialties]);
}


// 🎯 EXECUÇÃO PARALELA FINAL: Agora, 'professionalRecord' ou é o resultado (do CREATE) 
// ou é a Promise (do UPDATE/INACTIVATE) ou é undefined.
const operations: Promise<any>[] = [userUpdateOperation];

// Se for uma Promise (UPDATE/INACTIVATE), adiciona para execução paralela
if (professionalRecord && professionalRecord instanceof Promise) {
operations.push(professionalRecord);
}

// Executa as operações paralelas (user update + professional update/inactivate)
const results = await Promise.all(operations);

const updatedUserResult = results[0];
// Se 'professionalRecord' foi uma Promise, seu resultado estará na última posição
if (professionalRecord && professionalRecord instanceof Promise) {
professionalRecord = results[results.length - 1];
}

// Retorna os resultados do usuário e do profissional (seja Promise resolvida ou resultado do CREATE)
return [updatedUserResult, professionalRecord];

}, {
// Nível de isolamento para garantir que as especialidades sejam atualizadas corretamente
maxWait: 5000, 
timeout: 10000 
});


// 3. Retorna o Usuário Final (Incluindo todas as relações necessárias para o Frontend)
const finalUser = await prisma.users.findUnique({
where: { id: userIdToUpdate },
select: { 
id: true, 
username: true, 
email: true, 
role: true,
birthdate: true,
height_cm: true,
initial_weight_kg: true,
sexo: true,
created_at: true, 
last_login: true,
photo_perfil_url: true,
phone: true,
// CORREÇÃO: Usar 'professionals' (plural) conforme o schema do Prisma
professionals: {
select: {
id: true,
job_title: true,
registro_conselho: true,
cpf: true,
address_street: true,
address_city: true,
address_state: true,
address_zipcode: true,
is_active: true,
// NOVO: Incluir a relação M:N para que o modal saiba o que foi selecionado
professionals_specialties: {
select: {
specialty_id: true
}
}
}
}
}
})

// Mapeia o campo 'professionals' (Prisma) para 'professional' (API/Componente)
const userForFrontend: any = { ...finalUser };
// Garante que 'professionals' não seja null antes de acessar .length
userForFrontend.professional = (userForFrontend.professionals ?? []).length > 0 
? userForFrontend.professionals[0] 
: null;
delete userForFrontend.professionals;

return userForFrontend;


} catch (error: any) {
console.error('Erro ao atualizar usuário e profissional (PUT /users/[id]):', error);
if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
throw createError({ statusCode: 409, statusMessage: `E-mail, Nome de Usuário ou CPF já está em uso.` });
}
if (error.statusCode) throw error;
// ⚠️ ATENÇÃO: Se o erro original não for um erro de status, o Nuxt/H3 usará o statusMessage
// para o corpo da resposta HTTP e o status 500.
throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor ao atualizar usuário.' });
}
});