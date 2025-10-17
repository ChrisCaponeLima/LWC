// /server/api/records/image/[id].patch.ts - V1.2 - Atualiza flag is_private com checagem de dono
import { defineEventHandler, getQuery, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { verifyAuthToken } from '~/server/utils/auth'

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

  const body = await readBody(event)
  const isPrivateNew = body?.isPrivate

  if (isNaN(recordId) || !photoType || !fileTypeId || typeof isPrivateNew !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Dados de requisição incompletos ou inválidos.' })
  }

  const isPrivateDb = isPrivateNew ? 1 : 0

  try {
    // Atualiza somente se o arquivo pertence ao record e o record pertence ao userId
    const updated = await prisma.files.updateMany({
      where: {
        record_id: recordId,
        file_type: fileTypeId,
        // Garante que o record pertence ao userId
        records: { user_id: userId }
      },
      data: {
        is_private: isPrivateDb,
        updated_at: new Date()
      }
    })

    if (updated.count === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Arquivo não encontrado ou permissão negada.' })
    }

    return { success: true, message: 'Metadados da imagem atualizados com sucesso.', count: updated.count }
  } catch (err: any) {
    console.error('Erro na API PATCH de imagem:', err)
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'Falha interna ao atualizar metadados da imagem.' })
  }
})
