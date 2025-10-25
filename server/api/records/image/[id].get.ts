// /server/api/records/image/[id].get.ts - V1.4 - Correção Crítica: Busca direta por fileId (parâmetro de rota) e uso do recordId (query) como validação.
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

 // 🚨 ATENÇÃO: O ID da rota (event.context.params.id) agora é o FILE ID (imageId)
 const fileId = parseInt(event.context.params?.id as string)
 const query = getQuery(event)
 const photoType = (query.type as string) || ''
 // 🚨 NOVO: O recordId deve ser usado apenas para checagem de integridade, 
 // pois a busca principal é pelo fileId
 const recordIdQuery = parseInt(query.recordId as string) 

 const fileTypeId = FileTypeMap[photoType]

 if (isNaN(fileId) || !photoType || !fileTypeId || isNaN(recordIdQuery)) {
  throw createError({ 
   statusCode: 400, 
   statusMessage: 'ID do arquivo, ID do registro ou tipo da foto ausente/inválido.' 
  })
 }

 try {
  // 1. Busca o arquivo (files) pelo fileId
  const fileRecord = await prisma.files.findUnique({
   where: { 
    id: fileId,
    record_id: recordIdQuery, // 🚀 Filtro de segurança: Garante que o arquivo pertence ao registro esperado
    file_type: fileTypeId
   },
   select: {
    id: true,
    file_url: true,
    is_private: true,
    record_id: true, // Para o retorno
    // 2. Inclui os dados do registro pai (records)
    records: {
     select: {
      user_id: true,
      record_date: true,
     },
    },
   },
  })

  if (!fileRecord || !fileRecord.records) {
   throw createError({ statusCode: 404, statusMessage: 'Arquivo de imagem ou Registro associado não encontrado.' })
  }

  // 3. Autorização
  const record = fileRecord.records
  if (fileRecord.is_private === 1 && record.user_id !== userId) {
   throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Imagem privada.' })
  }
  // Autorização final: Garante que o arquivo/registro pertence ao usuário logado
  if (record.user_id !== userId) {
   throw createError({ statusCode: 403, statusMessage: 'Acesso negado. O registro não pertence ao usuário.' })
  }


  // 4. Retorno do Payload (Padronizado para o que o frontend espera)
  const imagePayload = {
   // 🚨 Retorna o fileId e o recordId para o ImageEditorComponent usar no salvamento
   fileId: fileRecord.id, 
   recordId: fileRecord.record_id,
   date: (record.record_date instanceof Date) ? record.record_date.toISOString().split('T')[0] : record.record_date,
   url: fileRecord.file_url,
   isPrivate: fileRecord.is_private === 1,
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