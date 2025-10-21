<!-- /pages/ocr/peso-test.vue - V1.1 - Interface de teste OCR completa, exibe imagem, texto e peso detectado -->
<template>
  <div class="p-6 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Teste de OCR - Peso da Balança</h1>

    <form @submit.prevent="enviarImagem" class="space-y-4">
      <input type="file" accept="image/*" @change="onFileChange" class="border p-2 rounded w-full" />
      <button
        type="submit"
        :disabled="carregando"
        class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
      >
        {{ carregando ? 'Processando OCR...' : 'Enviar Imagem' }}
      </button>
    </form>

    <div v-if="imagemPreview" class="mt-6">
      <h2 class="font-semibold mb-2">Pré-visualização:</h2>
      <img :src="imagemPreview" alt="Preview" class="border rounded shadow w-64" />
    </div>

    <div v-if="resultado" class="mt-8 bg-gray-50 border rounded p-4">
      <h2 class="text-xl font-bold mb-2">Resultado OCR</h2>
      <p><strong>Peso Detectado:</strong> {{ resultado.pesoDetectado || 'Nenhum' }}</p>
      <p><strong>Confiança:</strong> {{ resultado.confianca }}</p>

      <h3 class="font-semibold mt-4 mb-1">Texto Detectado:</h3>
      <textarea
        readonly
        class="w-full h-64 border rounded p-2 font-mono text-sm bg-white"
        :value="resultado.textoCompleto"
      />
    </div>

    <div v-if="erro" class="mt-4 text-red-600 font-semibold">
      ❌ {{ erro }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const imagem = ref<File | null>(null)
const imagemPreview = ref<string | null>(null)
const resultado = ref<any>(null)
const erro = ref<string | null>(null)
const carregando = ref(false)

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    imagem.value = file
    imagemPreview.value = URL.createObjectURL(file)
  }
}

async function enviarImagem() {
  if (!imagem.value) {
    erro.value = 'Selecione uma imagem antes de enviar.'
    return
  }

  erro.value = null
  carregando.value = true
  resultado.value = null

  try {
    const formData = new FormData()
    formData.append('file', imagem.value)

    const res = await $fetch('/api/ocr/peso-teste', {
      method: 'POST',
      body: formData,
    })

    resultado.value = res
  } catch (e: any) {
    erro.value = e?.message || 'Erro ao processar OCR.'
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
textarea {
  resize: none;
}
</style>
