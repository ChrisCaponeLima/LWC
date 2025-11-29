// /server/api/profile.get.ts - V2.5 - Correção de campos da galeria (type, isPrivate) e implementação de cálculo de tendências.
import { defineEventHandler, createError, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyToken } from '~/server/utils/auth';
import { calculateLatestMeasurementsWithTrend } from '~/server/utils/measurements'; // Garantindo a importação correta

interface AuthPayload {
  userId: number;
  role: string;
}

const formatDbDate = (dbDate: Date | null | undefined) => {
  if (!dbDate) return null;
  if (!(dbDate instanceof Date)) return null;
  return dbDate.toISOString().split('T')[0];
};

export default defineEventHandler(async (event: H3Event) => {
  const token = event.headers.get('Authorization')?.split(' ')[1];

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado. Token não fornecido.' });
  }

  let payload: AuthPayload;
  try {
    payload = verifyToken(token) as AuthPayload;
  } catch (e) {
    throw createError({ statusCode: 401, statusMessage: 'Token inválido ou expirado.' });
  }

  const userId = payload.userId;

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true, 
        username: true, 
        apelido: true, 
        email: true, 
        role: true, 
        last_login: true, 
        birthdate: true, 
        photo_perfil_url: true, 
        initial_weight_kg: true, 
        height_cm: true, 
        sexo: true, 
        phone: true, 
        active: true,
        records: {
          orderBy: { record_date: 'desc' },
          select: { 
            id: true, 
            record_date: true, 
            weight: true,
            record_measurements: {
              select: { 
                value: true, 
                measurements: { 
                  select: { name: true, unit: true } 
                } 
              }
            },
            files: {
              select: { 
                file_url: true, 
                file_type: true, 
                is_private: true, 
                created_at: true 
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado.' });
    }

    const records = user.records || [];
    const latestRecord = records[0];

    // 1. Processamento de Medidas e Tendências
    // Implementação baseada em users.get.ts para garantir consistência visual
    const latestMeasurementsWithTrend = calculateLatestMeasurementsWithTrend(records as any);
    
    // 2. Processamento das Galerias
    const registroTypes = [1, 0];
    const formaTypes = [2];

    // 🛑 CORREÇÃO: Adicionados 'isPrivate' e 'type' que são obrigatórios para o frontend (profile.vue)
    // Isso evita o crash ao gerar os links e ícones de cadeado.
    const allPhotos = records
      .flatMap(r => (r.files || [])
        .filter(f => registroTypes.includes(f.file_type))
        .map(f => ({ 
          url: f.file_url, 
          date: r.record_date, 
          recordId: r.id,
          isPrivate: f.is_private, // Necessário para o ícone 🔒
          type: f.file_type        // Necessário para o link do editor
        })) 
      )
      .reverse();

    const allFormas = records
      .flatMap(r => (r.files || [])
        .filter(f => formaTypes.includes(f.file_type))
        .map(f => ({ 
          url: f.file_url, 
          date: r.record_date, 
          recordId: r.id,
          isPrivate: f.is_private, // Necessário para o ícone 🔒
          type: f.file_type        // Necessário para o link do editor
        })) 
      )
      .reverse();

    return {
      id: user.id, 
      username: user.username, 
      apelido: user.apelido, 
      email: user.email, 
      role: user.role,
      lastLogin: formatDbDate(user.last_login), 
      birthdate: formatDbDate(user.birthdate),
      photo_perfil_url: user.photo_perfil_url,
      
      initialWeight: user.initial_weight_kg?.toString() || null, 
      heightCm: user.height_cm?.toString() || null,
      sexo: user.sexo, 
      phone: user.phone || null, 
      active: user.active ?? true,

      currentWeight: latestRecord?.weight?.toString() || null, 
      
      // Retorna as medidas calculadas com tendência, igual ao users.get.ts
      latestMeasurements: latestMeasurementsWithTrend, 
      
      photoGallery: allPhotos,
      formaGallery: allFormas,
    };

  } catch (error: any) {
    console.error('Erro ao buscar dados do perfil (API):', error);
    throw createError({ statusCode: 500, statusMessage: 'Erro interno ao carregar dados do perfil. Verifique o log do servidor.' });
  }
});