// /server/api/records/image/[id].get.ts - V1.3 - Reforço de autorização e retorno consistente
import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { verifyAuthToken } from '~/server/utils/auth' // assume sua função existente

// Mapeamento tipo -> file_type (consistente com seu schema)
const FileTypeMap: Record<string, number> = {
  registro: 1,
  forma: 2,
}

export default defineEventHandler(async (event) => {
  const userData = verifyAuthToken(event)
  const userId = userData.userId ?? userData.id
  const recordId = parseInt(event.context.params?.id as string)
  const query = getQuery(event)
  const photoType = (query.type as string) || ''
  const fileTypeId = FileTypeMap[photoType]

  if (isNaN(recordId) || !photoType || !fileTypeId) {
    throw createError({ statusCode: 400, statusMessage: 'ID do registro ou tipo da foto ausente/inválido.' })
  }

  try {
    // Busca o record garantindo que pertence ao usuário (ou, se admin/owner, permitir?)
    // Aqui mantemos a checagem padrão: registro deve pertencer ao userId recebido no token.
    const record = await prisma.records.findUnique({
      where: { id: recordId },
      select: {
        id: true,
        record_date: true,
        user_id: true,
        files: {
          where: { file_type: fileTypeId },
          select: { file_url: true, is_private: true },
          take: 1,
        },
      },
    })

    if (!record) {
      throw createError({ statusCode: 404, statusMessage: 'Registro não encontrado.' })
    }

    // Autorização: se o record.user_id !== userId e o image for privada, retornar 403
    const file = record.files?.[0]
    if (!file || !file.file_url) {
      throw createError({ statusCode: 404, statusMessage: `Arquivo não encontrado para tipo ${photoType}.` })
    }

    // Se o arquivo estiver privado e o requestor não for o dono, negar.
    if (file.is_private === 1 && record.user_id !== userId) {
      throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Imagem privada.' })
    }

    const imagePayload = {
      id: record.id,
      date: (record.record_date instanceof Date) ? record.record_date.toISOString().split('T')[0] : record.record_date,
      url: file.file_url,
      isPrivate: file.is_private === 1,
      type: photoType,
      description: `Foto de ${photoType} em ${(record.record_date instanceof Date) ? record.record_date.toISOString().split('T')[0] : record.record_date}`
    }

    return imagePayload
  } catch (err: any) {
    console.error('Erro na API GET de imagem:', err)
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'Falha interna ao buscar dados da imagem.' })
  }
})
