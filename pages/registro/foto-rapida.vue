// /pages/ocr/peso-balanca.vue - V3.4 - Integra seven-segment-ocr, exibe texto detectado e resultado do peso

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-center">Leitura de Peso via OCR</h1>

    <div class="bg-white shadow-md rounded-2xl p-6 space-y-6">
      <div class="flex flex-col items-center space-y-4">
        <label
          for="file"
          class="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Enviar imagem da balança
        </label>
        <input
          id="file"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileChange"
        />

        <div v-if="previewUrl" class="relative mt-4">
          <img
            :src="previewUrl"
            alt="Pré-visualização"
            class="rounded-lg shadow-md max-h-80 object-contain"
          />
        </div>
      </div>

      <div v-if="isLoading" class="text-center text-gray-600">Processando OCR...</div>

      <div v-if="ocrResult || ocrRaw || ocrError" class="space-y-4">
        <div v-if="ocrResult" class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p class="font-semibold text-green-700">Peso Detectado:</p>
          <p class="text-xl font-bold text-green-800">{{ ocrResult }}</p>
        </div>

        <div v-if="ocrRaw" class="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p class="font-semibold text-gray-700 mb-1">Texto detectado pelo OCR:</p>
          <textarea
            v-model="ocrRaw"
            readonly
            class="w-full border rounded-lg p-2 text-sm font-mono bg-white"
            rows="5"
          ></textarea>
        </div>

        <div v-if="ocrError" class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="font-semibold text-red-700">Erro:</p>
          <p class="text-sm text-red-600">{{ ocrError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// -------------------------------------------------------------
// /pages/ocr/peso-balanca.vue - V3.4
// Integração Nuxt3-first com endpoint /api/ocr/peso-balanca.post.ts
// Exibe texto detectado e resultado de peso usando seven-segment-ocr
// -------------------------------------------------------------

import { ref } from 'vue'

const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const isLoading = ref(false)
const ocrResult = ref<string | null>(null)
const ocrRaw = ref<string | null>(null)
const ocrError = ref<string | null>(null)

/**
 * Evento de seleção de arquivo
 */
function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)

  // Limpa estados anteriores
  ocrResult.value = null
  ocrRaw.value = null
  ocrError.value = null

  performOcr()
}

/**
 * Envia imagem para o endpoint OCR
 */
async function performOcr() {
  if (!selectedFile.value) return

  isLoading.value = true
  ocrResult.value = null
  ocrRaw.value = null
  ocrError.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const res = await fetch('/api/ocr/peso-balanca', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    console.log('📦 Retorno OCR:', data)

    if (!res.ok) {
      throw new Error(data?.statusMessage || 'Erro desconhecido no servidor.')
    }

    // ✅ Texto bruto detectado (OCR local)
    if (data?.ocrTexto) {
      ocrRaw.value = data.ocrTexto
    } else if (data?.parsedText) {
      ocrRaw.value = data.parsedText
    } else if (typeof data === 'string') {
      ocrRaw.value = data
    }

    // ✅ Peso detectado
    if (data?.pesoDetectado) {
      ocrResult.value = String(data.pesoDetectado)
      console.log(`✅ OCR Concluído. Peso detectado: ${ocrResult.value}`)
    } else {
      ocrError.value = data?.message || 'Texto detectado, mas nenhum peso válido encontrado.'
      console.warn('⚠️ OCR sem peso detectado. Payload:', data)
    }
  } catch (err: any) {
    console.error('❌ Erro ao processar OCR:', err)
    ocrError.value = err.message || 'Falha ao processar imagem.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
textarea {
  resize: vertical;
}
</style>
