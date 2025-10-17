// /server/api/ocr/peso-balanca.post.ts - V2.2 - Corrige OCR.space (usa /parse/image com FormData e integra Cloudinary)

import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { v2 as cloudinary } from 'cloudinary'

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  OCR_SPACE_API_KEY
} = process.env

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('❌ Variáveis do Cloudinary ausentes. Verifique seu .env')
}

// Configura Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true
})

/**
 * Extrai o peso (em kg) de uma string retornada pelo OCR.
 */
/**
 * Extrai o peso (em kg) de uma string retornada pelo OCR.
 * - Prioriza números que aparecem com ponto decimal (ex: "86.9")
 * - Evita valores de legenda como "Max 180kg" ou "d=100g"
 */
function extractWeightFromText(fullText: string): string | null {
  if (!fullText) return null

  // Normaliza texto para maiúsculas e remove espaços extras
  const cleaned = fullText.toUpperCase().replace(/\s+/g, ' ')
  const numbers = cleaned.match(/(\d+[.,]?\d*)/g)
  if (!numbers) return null

  // 🔹 Remove valores claramente de especificações da balança
  const filtered = numbers.filter((num) => {
    const context = cleaned.slice(
      Math.max(0, cleaned.indexOf(num) - 10),
      cleaned.indexOf(num) + num.length + 10
    )
    return !/MAX|D=|DIV|GR|G|CAP|LOAD|LB|LBS/i.test(context)
  })

  if (filtered.length === 0) return null

  // 🔹 Prioriza números com ponto (ex: "86.9" sobre "180")
  const prioritized = filtered.find((n) => n.includes('.') || n.includes(','))
  const candidate = prioritized || filtered[0]

  const value = parseFloat(candidate.replace(',', '.'))
  if (isNaN(value)) return null

  // 🔹 Valida intervalo plausível de peso humano
  if (value >= 30 && value <= 200) {
    return `${value.toFixed(1)} kg`
  }

  return null
}

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  const file = formData?.find((item) => item.name === 'file')

  if (!file) {
    throw createError({ statusCode: 400, statusMessage: 'Nenhum arquivo enviado.' })
  }

  // Converte o arquivo em Data URI
  const dataUri = `data:${file.type};base64,${file.data.toString('base64')}`

  let uploadResult: any = null

  try {
    // 1️⃣ Upload temporário ao Cloudinary
    uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'temp_ocr_uploads',
      resource_type: 'image'
    })
  } catch (err) {
    console.error('Erro ao enviar imagem ao Cloudinary:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha no upload ao Cloudinary. Verifique as credenciais.'
    })
  }

  // 2️⃣ Envia a URL da imagem ao OCR.space
  try {
    const form = new FormData()
    form.append('apikey', OCR_SPACE_API_KEY || '')
    form.append('url', uploadResult.secure_url)
    form.append('language', 'por')
    form.append('isOverlayRequired', 'false')

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: form
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`OCR.space retornou ${response.status}: ${text}`)
    }

    const result = await response.json()

    if (!result?.ParsedResults?.length) {
      throw new Error('Nenhum texto reconhecido na imagem.')
    }

    const parsedText = result.ParsedResults[0].ParsedText
    const detectedWeight = extractWeightFromText(parsedText)

    return {
      pesoDetectado: detectedWeight,
      message: detectedWeight
        ? 'OCR realizado com sucesso.'
        : 'Texto detectado, mas nenhum peso válido encontrado.'
    }
  } catch (err: any) {
    console.error('Erro na chamada OCR.space:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao processar OCR.space.',
      data: err.message
    })
  } finally {
    // 3️⃣ Remove upload temporário
    if (uploadResult?.public_id) {
      await cloudinary.uploader
        .destroy(uploadResult.public_id, { resource_type: 'image' })
        .catch(() => {})
    }
  }
})
