import { defineEventHandler, createError, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyToken } from '~/server/utils/auth';
import { calculateLatestMeasurementsWithTrend } from '~/server/utils/measurementUtils';

// Tipo de dados esperado no token
interface AuthPayload {
  userId: number;
  role: string;
}

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
  
  // O ID do usuário a ser buscado é o do próprio token
  const userId = payload.userId;

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        apelido: true, // Campo essencial para o requisito
        email: true,
        role: true,
        last_login: true,
        birthdate: true,
        photo_perfil_url: true,
        initial_weight_kg: true,
        height_cm: true, // Adicionado para desabilitar no formulário
        sexo: true,
                // INSERÇÃO: phone e active no SELECT do Prisma
                phone: true,
                active: true,
        
        // BUSCA TODOS os records (ordenados desc) com medidas e arquivos
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
                  select: {
                    name: true,
                    unit: true
                  }
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
    
    // 1. Processamento das Medidas e Tendência
    // Usamos a mesma lógica do users.get.ts
    const latestMeasurementsWithTrend = calculateLatestMeasurementsWithTrend(records as any);
    
    // 2. Processamento das Galerias
    // Acesso total aos arquivos, pois é o próprio usuário
    const registroTypes = [1, 0];
    const formaTypes = [2];

    const allPhotos = records
      .flatMap(r => (r.files || [])
        .filter(f => registroTypes.includes(f.file_type))
        .map(f => ({ url: f.file_url, date: r.record_date, recordId: r.id, isPrivate: f.is_private === 1, type: 'registro' as const }))
      )
      .reverse(); // Invertemos para mostrar do mais antigo para o mais novo na galeria

    const allFormas = records
      .flatMap(r => (r.files || [])
        .filter(f => formaTypes.includes(f.file_type))
        .map(f => ({ url: f.file_url, date: r.record_date, recordId: r.id, isPrivate: f.is_private === 1, type: 'forma' as const }))
      )
      .reverse(); // Invertemos para mostrar do mais antigo para o mais novo na galeria


    const formatDbDate = (dbDate: Date | null | undefined) => {
      if (!dbDate) return null;
      if (!(dbDate instanceof Date)) return null;
      return dbDate.toISOString().split('T')[0];
    };

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
            // INSERÇÃO: phone e active no RETURN do objeto
            phone: user.phone || null,
            active: user.active ?? true, // Usando ?? true para o caso de ser nulo (null) no banco, mas por default é true
      currentWeight: records[0]?.weight?.toString() || null, 
      
      // Dados para o frontend
      latestMeasurements: Object.values(latestMeasurementsWithTrend),
      photoGallery: allPhotos,
      formaGallery: allFormas,
    };

  } catch (error: any) {
    console.error('Erro ao buscar dados do perfil (API):', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno ao carregar dados do perfil. Verifique o log do servidor.'
    });
  }
});