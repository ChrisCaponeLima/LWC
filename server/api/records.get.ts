// /server/api/records.get.ts - V5.0 - Mantém Retorno em Array de Records (retrocompatível), Coleta Todas as Fotos.

import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma } from '~/server/utils/db.ts'

interface FileData {
  file_url: string;
  file_type: number;
  is_private: number;
    created_at: Date; // Necessário para ordenar as fotos
}

interface RecordPrisma {
    id: number;
    record_date: Date;
    weight: any;
    event: string | null;
    weekly_action: string | null;
    workout_days: number | null;
    observations: string | null;
    record_measurements: RecordMeasurementPrisma[];
    files: FileData[]; // Agora é um array completo de arquivos
}

interface RecordMeasurementPrisma {
  value: any;
  measurements: {
    id: number;
    name: string;
    unit: string;
  } | null;
}

const formatDbDate = (date: Date): string => {
  const year = date.getUTCFullYear();
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

    const records: RecordPrisma[] = await prisma.records.findMany({
      where: { user_id: userId },
      orderBy: { record_date: 'asc' },
      select: {
        id: true,
        record_date: true,
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
        files: { // 🚨 Agora files será um ARRAY COMPLETO de arquivos
          select: {
            file_url: true,
            file_type: true,
            is_private: true,
                        created_at: true
          },
                    orderBy: { created_at: 'asc' }
        }
      } as any
    })

    const formattedRecords = records.map((record) => {
      const filesData = record.files || []

      // 🚨 MUDANÇA: Usamos FIND para PEGAR APENAS A PRIMEIRA FOTO de cada tipo. 
            // Isso garante que os gráficos e a retrocompatibilidade funcionem.
            // O frontend agregará as demais.
      const photoFile = filesData.find(f => f.file_type === 1)
      const formaFile = filesData.find(f => f.file_type === 2)

      const photoIsPrivate = photoFile ? photoFile.is_private === 1 : false
      const formaIsPrivate = formaFile ? formaFile.is_private === 1 : false

      return {
        id: record.id,
        record_date: formatDbDate(record.record_date),
        record_timestamp: record.record_date.getTime(), 
        weight: record.weight ? parseFloat(record.weight.toString()) : null,
        event: record.event,
        weekly_action: record.weekly_action,
        workout_days: record.workout_days,
        observations: record.observations,

                // Campos retrocompatíveis com DataDisplay V1.9 para gráficos
        photo_url: photoFile ? photoFile.file_url : null,
        photo_is_private: photoIsPrivate,
        forma_url: formaFile ? formaFile.file_url : null,
        forma_is_private: formaIsPrivate,
                
                // 🚨 NOVO CAMPO: Contém TODAS as fotos do registro, não apenas a primeira
                all_files: filesData.map(f => ({
                    url: f.file_url,
                    isPrivate: f.is_private === 1,
                    type: f.file_type === 1 ? 'registro' : f.file_type === 2 ? 'forma' : 'outro',
                    // Adicione a data de criação do arquivo, se necessário para ordenação
                    created_at: f.created_at.toISOString() 
                })),
                
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

    // 🚨 RETORNA O ARRAY DE RECORDS - GARANTINDO RETROCOMPATIBILIDADE DE FLUXO
    return formattedRecords
  } catch (error: any) {
    console.error('Erro no handler records.get:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno ao buscar registros.' })
  }
})