// /server/api/ocr/peso-balanca.post.ts - V2.3 - Retorna parsedText para debug no frontend
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

function extractWeightFromText(fullText: string): string | null {
  if (!fullText) return null

  const cleaned = fullText.toUpperCase().replace(/\s+/g, ' ')
  const numbers = cleaned.match(/(\d+[.,]?\d*)/g)
  if (!numbers) return null

  const filtered = numbers.filter((num) => {
    const idx = cleaned.indexOf(num)
    const context = cleaned.slice(Math.max(0, idx - 10), idx + num.length + 10)
    return !/MAX|D=|DIV|GR|G|CAP|LOAD|LB|LBS/i.test(context)
  })

  if (filtered.length === 0) return null

  const prioritized = filtered.find((n) => n.includes('.') || n.includes(','))
  const candidate = prioritized || filtered[0]

  const value = parseFloat(candidate.replace(',', '.'))
  if (isNaN(value)) return null

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

  const dataUri = `data:${file.type};base64,${file.data.toString('base64')}`

  let uploadResult: any = null

  try {
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
      return {
        pesoDetectado: null,
        message: 'Nenhum texto reconhecido na imagem.',
        parsedText: ''
      }
    }

    const parsedText = result.ParsedResults[0].ParsedText || ''
    const detectedWeight = extractWeightFromText(parsedText)

    return {
      pesoDetectado: detectedWeight,
      message: detectedWeight ? 'OCR realizado com sucesso.' : 'Texto detectado, mas nenhum peso válido encontrado.',
      parsedText
    }
  } catch (err: any) {
    console.error('Erro na chamada OCR.space:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Falha ao processar OCR.space.',
      data: err.message
    })
  } finally {
    if (uploadResult?.public_id) {
      await cloudinary.uploader
        .destroy(uploadResult.public_id, { resource_type: 'image' })
        .catch(() => {})
    }
  }
})
