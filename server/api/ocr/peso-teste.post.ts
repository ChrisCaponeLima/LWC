// /server/api/ocr/peso-teste.post.ts - V1.2 - Foco em números do display e binarização agressiva

import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import Tesseract from 'tesseract.js'

export default defineEventHandler(async (event) => {
  try {
    const form = await readMultipartFormData(event)
    if (!form) throw createError({ statusCode: 400, message: 'Nenhum arquivo recebido.' })

    const file = form.find((f) => f.name === 'file')
    if (!file) throw createError({ statusCode: 400, message: 'Arquivo inválido.' })

    // Caminho temporário
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

    const tempPath = path.join(tempDir, `ocr_temp_${Date.now()}.png`)
    await fs.promises.writeFile(tempPath, file.data)

    // Lê a imagem para descobrir dimensões
    const meta = await sharp(tempPath).metadata()

    // Corta automaticamente a área central (onde geralmente está o display)
    const cropWidth = Math.round(meta.width! * 0.4)
    const cropHeight = Math.round(meta.height! * 0.2)
    const left = Math.round((meta.width! - cropWidth) / 2)
    const top = Math.round(meta.height! * 0.3)

    const processedPath = path.join(tempDir, `ocr_processed_${Date.now()}.png`)
    await sharp(tempPath)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .grayscale()
      .linear(2, -50) // aumenta contraste
      .modulate({ brightness: 1.5, contrast: 2 })
      .threshold(160)
      .toFile(processedPath)

    // Execução do OCR
    const { data } = await Tesseract.recognize(processedPath, 'eng', {
      tessedit_char_whitelist: '0123456789.',
      tessedit_pageseg_mode: 8, // apenas um bloco de texto
      logger: (m) => console.log(m),
    })

    const text = data.text.replace(/\s+/g, '')
    const pesoMatch = text.match(/(\d{2,3}\.\d)/)
    const pesoDetectado = pesoMatch ? pesoMatch[1] : 'Nenhum'

    // Limpeza de arquivos temporários
    try {
      fs.unlinkSync(tempPath)
      fs.unlinkSync(processedPath)
    } catch (err) {
      console.warn('Erro ao remover arquivos temporários:', err.message)
    }

    return {
      sucesso: true,
      pesoDetectado,
      confianca: (data.confidence || 0).toFixed(2) + '%',
      textoDetectado: data.text,
    }
  } catch (err) {
    console.error('Erro no endpoint OCR:', err)
    throw createError({
      statusCode: 500,
      message: 'Falha ao processar imagem.',
    })
  }
})
