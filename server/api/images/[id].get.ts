// /server/api/records/image/[id].get.ts - V1.4 - Adiciona validação explícita de ID e sanitiza photoType.

import { defineEventHandler, getQuery, createError } from 'h3'
import { PrismaClient } from '@prisma/client'
import { verifyAuthToken } from '~/server/utils/auth'

const prisma = new PrismaClient()

const FileTypeMap = {
  registro: 1,
  forma: 2
}

export default defineEventHandler(async (event) => {
  // 1️⃣ Autenticação
  const userData = verifyAuthToken(event)
  const userId = userData.userId

  // 2️⃣ Parâmetros e Query
  const rawId = parseInt(event.context.params?.id as string)

  // 🚨 CORREÇÃO: VALIDAÇÃO EXPLÍCITA DO ID
  if (isNaN(rawId) || rawId <= 0) {
      throw createError({ statusCode: 400, message: 'ID do registro ou arquivo ausente/inválido.' })
      // Esta mensagem cobre o erro que você está vendo.
  }
  
  const query = getQuery(event)
  
  // SANITIZAÇÃO E VALIDAÇÃO ROBUSTA DO QUERY.TYPE
  const photoTypeRaw = Array.isArray(query.type) ? query.type[0] : query.type
  const photoType = (photoTypeRaw as string) || ''

  const isValidType = photoType === 'registro' || photoType === 'forma'
  const fileTypeId = isValidType ? FileTypeMap[photoType as keyof typeof FileTypeMap] : undefined

  if (!photoType || !isValidType || !fileTypeId) {
    throw createError({ statusCode: 400, message: 'Tipo de foto ausente ou inválido.' })
  }

  // 3️⃣ Primeiro tenta como record_id
  let record = await prisma.records.findUnique({
    where: { id: rawId },
    select: {
      id: true,
      user_id: true,
      record_date: true,
      files: {
        where: { file_type: fileTypeId },
        select: {
          id: true,
          file_url: true,
          is_private: true
        },
        take: 1
      }
    }
  })

  // 4️⃣ Caso não encontre, tenta como file_id
  if (!record) {
    const file = await prisma.files.findUnique({
      where: { id: rawId },
      select: {
        id: true,
        file_url: true,
        is_private: true,
        records: {
          select: {
            id: true,
            user_id: true,
            record_date: true
          }
        }
      }
    })

    if (file && file.records) {
      record = {
        id: file.records.id,
        user_id: file.records.user_id,
        record_date: file.records.record_date,
        files: [file]
      }
    }
  }

  // 5️⃣ Validação final
  if (!record) {
    throw createError({
      statusCode: 404,
      message: 'Registro ou arquivo não encontrado.'
    })
  }

  // 6️⃣ Permissão
  if (record.user_id !== userId) {
    throw createError({
      statusCode: 403,
      message: 'Acesso negado a este registro.'
    })
  }

  const file = record.files[0]
  if (!file) {
    throw createError({
      statusCode: 404,
      message: 'Arquivo da foto não encontrado neste registro.'
    })
  }

  // 7️⃣ Retorno formatado
  return {
    id: record.id,
    date: record.record_date,
    url: file.file_url,
    isPrivate: file.is_private === 1,
    type: photoType,
    description: `Foto de ${photoType} em ${record.record_date.toISOString().split('T')[0]}`
  }
})
// O arquivo /server/api/records/image/[id].patch.ts permanece inalterado.