// /server/api/images/edit_upload.post.ts - V1.0 - Recebe editedFile, upload Cloudinary, grava Edited e atualiza files
import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { uploadToCloudinary } from '~/server/utils/cloudinary'
import { verifyAuthToken } from '~/server/utils/auth' // adaptação: use a sua função de verificação

export default defineEventHandler(async (event) => {
  // autentica
  const userData = verifyAuthToken(event)
  const userId = userData.userId ?? userData.id

  // aceita apenas POST
  if (event.node.req.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Método não permitido.' })
  }

  // le multipart
  const parts = await readMultipartFormData(event)
  if (!parts) throw createError({ statusCode: 400, statusMessage: 'Corpo inválido.' })

  // extrai campos
  const getField = (name) => {
    const f = parts.find(p => p.name === name)
    if (!f) return null
    return f
  }

  const recordIdField = getField('recordId')
  const fileIdField = getField('fileId')
  const originalUrlField = getField('originalUrl')
  const isPrivateField = getField('isPrivate')
  const editedFilePart = parts.find(p => p.name === 'editedFile' && p.filename)

  const recordId = recordIdField ? Number(recordIdField.data.toString()) : null
  const fileId = fileIdField ? Number(fileIdField.data.toString()) : null
  const originalUrl = originalUrlField ? originalUrlField.data.toString() : ''
  const isPrivate = isPrivateField ? (String(isPrivateField.data.toString()) === 'true' ? 1 : 0) : 0

  if (!editedFilePart) {
    throw createError({ statusCode: 400, statusMessage: 'Arquivo editado não fornecido.' })
  }

  try {
    // 1) upload para cloudinary (pasta 'edited')
    const editedUrl = await uploadToCloudinary(editedFilePart, 'edited')

    // 2) registra a versão original na tabela edited (SQL raw)
    // (a tabela deve existir; ver migration abaixo)
    const inserted = await prisma.$queryRaw`
      INSERT INTO edited (user_id, record_id, file_id, original_url, edited_url, created_at, updated_at)
      VALUES (${userId}, ${recordId}, ${fileId}, ${originalUrl}, ${editedUrl}, NOW(), NOW())
      RETURNING id
    `
    // 3) atualiza o registro em files (se fileId fornecido)
    if (fileId) {
      await prisma.files.update({
        where: { id: fileId },
        data: { file_url: editedUrl, is_private: isPrivate, updated_at: new Date() }
      })
    } else if (recordId) {
      // caso não haja fileId, tentamos atualizar o primeiro arquivo daquele tipo no record (se desejar estender, ajuste)
      // Aqui deixamos sem alteração para não assumir
    }

    return { success: true, message: 'Imagem editada salva.', editedUrl }
  } catch (err) {
    console.error('Erro em edit_upload:', err)
    throw createError({ statusCode: 500, statusMessage: 'Falha interna ao salvar imagem editada.' })
  }
})
