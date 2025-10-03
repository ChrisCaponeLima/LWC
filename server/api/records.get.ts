// /server/api/records.get.ts - V3.7 - Fix de Fuso Horário: record_date enviado como string formatada
import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma } from '~/server/utils/db.ts'

// Interfaces de apoio para robustez
interface FileData {
    file_url: string;
    file_type: number;
    is_private: number; 
}

interface RecordMeasurementPrisma {
    value: any;
    measurements: { 
        id: number; 
        name: string; 
        unit: string; 
    } | null;
}

// Função auxiliar para formatação TZ-Safe
const formatDbDate = (date: Date): string => {
    // Usamos os métodos getUTC* para ler o dia, mês e ano EXATOS
    // que o banco de dados armazena (YYYY-MM-DD), ignorando o fuso horário local
    const year = date.getUTCFullYear();
    // Mês é base 0, então +1
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');

    return `${day}/${month}/${year}`;
}


export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const userId = Number(query.userId)

    try {
        if (!userId || isNaN(userId)) {
             throw createError({ statusCode: 400, statusMessage: 'ID de usuário não fornecido.' })
        }

        const records = await prisma.records.findMany({
            where: { user_id: userId },
            orderBy: { record_date: 'asc' },
            select: {
                id: true,
                record_date: true, // Aqui virá como objeto Date do DB
                weight: true,
                event: true,
                weekly_action: true,
                workout_days: true,
                observations: true,
                record_measurements: {
                    select: {
                        value: true,
                        measurements: { 
                            select: { id: true, name: true, unit: true }
                        }
                    }
                },
                files: {
                    select: {
                        file_url: true,
                        file_type: true,
                        is_private: true
                    }
                }
            }
        })

        const formattedRecords = records.map((record) => {
            
            const filesData = (record as any).files || [];
            const photoFile = (filesData as FileData[]).find(f => f.file_type === 1); 
            const formaFile = (filesData as FileData[]).find(f => f.file_type === 2);

            const photoIsPrivate = photoFile ? photoFile.is_private === 1 : false;
            const formaIsPrivate = formaFile ? formaFile.is_private === 1 : false;

            return {
                id: record.id,
                // CORREÇÃO CRÍTICA: Formata a data aqui para evitar erro de TZ no frontend
                record_date: formatDbDate(record.record_date), 
                weight: record.weight ? parseFloat(record.weight.toString()) : null,
                event: record.event,
                weekly_action: record.weekly_action,
                workout_days: record.workout_days,
                observations: record.observations,

                photo_url: photoFile ? photoFile.file_url : null,
                photo_is_private: photoIsPrivate, 
                forma_url: formaFile ? formaFile.file_url : null,
                forma_is_private: formaIsPrivate,

                record_measurements: (record.record_measurements as RecordMeasurementPrisma[])
                    .filter(rm => rm.measurements) 
                    .map((rm) => ({
                        value: parseFloat(rm.value.toString()),
                        measurements: { 
                            name: rm.measurements!.name,
                            unit: rm.measurements!.unit
                        }
                    }))
            }
        })

        return formattedRecords
    } catch (error: any) {
        console.error('Erro no handler records.get:', error)
        if (error.statusCode) throw error
        throw createError({ statusCode: 500, statusMessage: 'Erro interno ao buscar registros.' })
    }
})