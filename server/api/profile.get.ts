// /server/api/profile.get.ts - V2.7 - INCLUSÃO DO ID DO ARQUIVO (fileId)
import { defineEventHandler, createError, H3Event } from 'h3';
import { prisma } from '~/server/utils/db';
import { verifyToken } from '~/server/utils/auth';
import { calculateLatestMeasurementsWithTrend } from '~/server/utils/measurements'; 

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
                                id: true, 
                                measurement_id: true, 
                                value: true, 
                                measurements: { 
                                    select: { name: true, unit: true } 
                                } 
                            }
                        },
                        files: {
                            select: { 
                                // 🛑 CORREÇÃO 1: Incluir o ID do arquivo (tabela files)
                                id: true, 
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
        const latestMeasurementsWithTrend = calculateLatestMeasurementsWithTrend(records as any);
        
        // 2. Processamento das Galerias
        const registroTypes = [1, 0];
        const formaTypes = [2];

        const allPhotos = records
            .flatMap(r => (r.files || [])
                .filter(f => registroTypes.includes(f.file_type))
                .map(f => ({ 
                    url: f.file_url, 
                    date: r.record_date, 
                    recordId: r.id,
                    // 🛑 CORREÇÃO 2: Mapear o ID do arquivo para 'fileId'
                    fileId: f.id, 
                    isPrivate: f.is_private, 
                    type: f.file_type 
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
                    // 🛑 CORREÇÃO 2: Mapear o ID do arquivo para 'fileId'
                    fileId: f.id, 
                    isPrivate: f.is_private, 
                    type: f.file_type 
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
            
            latestMeasurements: latestMeasurementsWithTrend, 
            
            photoGallery: allPhotos,
            formaGallery: allFormas,
        };

    } catch (error: any) {
        console.error('Erro ao buscar dados do perfil (API):', error);
        throw createError({ statusCode: 500, statusMessage: 'Erro interno ao carregar dados do perfil. Verifique o log do servidor.' });
    }
});