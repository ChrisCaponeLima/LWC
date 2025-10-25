// /server/api/records.get.ts - V5.1 - Correção: Adicionado 'id' do arquivo para o all_files
import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma } from '~/server/utils/db.ts'

interface FileData {
 id: number; // 🚨 Adicionado**
 file_url: string;
 file_type: number;
 is_private: number;
 created_at: Date; 
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
  files: FileData[]; 
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
    files: { 
     select: {
      id: true, // 🚨 ADICIONADO: Seleciona o ID do arquivo**
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

   // MANTIDO: Lógica de retrocompatibilidade para photo_url/forma_url
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

    photo_url: photoFile ? photoFile.file_url : null,
    photo_is_private: photoIsPrivate,
    forma_url: formaFile ? formaFile.file_url : null,
    forma_is_private: formaIsPrivate,
        
        // 🚨 CORREÇÃO DE ERRO: Mapeamento do ID do arquivo
    all_files: filesData.map(f => ({
      id: f.id, // 🚨 INCLUÍDO: Resolve o 'undefined' no frontend**
      url: f.file_url,
      isPrivate: f.is_private === 1,
      type: f.file_type === 1 ? 'registro' : f.file_type === 2 ? 'forma' : 'outro',
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

  return formattedRecords
 } catch (error: any) {
  console.error('Erro no handler records.get:', error)
  if (error.statusCode) throw error
  throw createError({ statusCode: 500, statusMessage: 'Erro interno ao buscar registros.' })
 }
})