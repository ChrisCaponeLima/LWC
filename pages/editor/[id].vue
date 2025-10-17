// /pages/editor/[id].vue - V1.18 - Corrige Crop funcional e rotação instantânea mantendo blur real da V1.17

<template>
  <NuxtLayout>
    <div>
      <Header pageTitle="Editor de Imagens" />

      <div class="min-h-screen bg-gray-100 p-4 sm:p-8">
        <div class="max-w-7xl mx-auto bg-white shadow-xl rounded-lg p-6">
          <NuxtLink
            to="/dashboard"
            class="text-indigo-600 hover:text-indigo-800 mb-6 inline-block font-semibold"
          >
            ← Voltar para o Dashboard
          </NuxtLink>

          <div v-if="error" class="text-red-600 p-4 border border-red-200 rounded bg-red-50">
            <i class="fas fa-exclamation-triangle mr-2"></i> {{ error }}
          </div>

          <div v-else-if="isLoading" class="text-center p-10">
            <i class="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
            <p class="mt-2 text-gray-600">Carregando imagem e ferramentas...</p>
          </div>

          <ClientOnly v-else>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- CANVAS -->
              <div class="lg:col-span-2">
                <div class="relative w-full border-x border-gray-200">
                  <div ref="imageContainer" class="w-full relative">
                    <img
                      ref="baseImage"
                      :src="image?.url"
                      crossorigin="anonymous"
                      @load="onImageLoad"
                      class="w-full object-contain block max-h-[70vh] transition-transform duration-300"
                      :style="{ transform: `rotate(${rotation}deg)` }"
                    />
                    <canvas ref="overlayCanvas" class="absolute top-0 left-0"></canvas>
                  </div>
                </div>

                <div class="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  <i class="fas fa-info-circle text-gray-400"></i>
                  Desenhe, recorte, gire ou aplique blur antes de salvar.
                </div>
              </div>

              <!-- CONTROLES -->
              <div class="lg:col-span-1 p-4 border rounded-lg bg-gray-50 flex flex-col gap-4">
                <div class="flex items-center gap-3 flex-wrap">
                  <button @click="setMode('stripe')" class="p-2 rounded-md hover:bg-gray-200" title="Tarja preta">
                    <i class="fas fa-minus text-gray-700"></i>
                  </button>
                  <button @click="setMode('blur')" class="p-2 rounded-md hover:bg-gray-200" title="Blur">
                    <i class="fas fa-water text-gray-700"></i>
                  </button>
                  <button @click="toggleCrop" class="p-2 rounded-md hover:bg-gray-200" :class="cropActive ? 'bg-indigo-200' : ''" title="Recortar">
                    <i class="fas fa-crop-alt text-gray-700"></i>
                  </button>
                  <button @click="rotateImage" class="p-2 rounded-md hover:bg-gray-200" title="Girar imagem">
                    <i class="fas fa-sync text-gray-700"></i>
                  </button>
                  <button @click="clearEffects" class="p-2 rounded-md hover:bg-gray-200" title="Limpar">
                    <i class="fas fa-eraser text-gray-700"></i>
                  </button>
                </div>

                <ul class="text-sm text-gray-600 mt-2 space-y-2">
                  <li v-for="(r, idx) in rects" :key="idx">
                    Retângulo {{ idx + 1 }} — {{ r.type }}
                  </li>
                  <li v-if="rects.length === 0" class="text-gray-400">Nenhum efeito aplicado</li>
                </ul>

                <div class="mt-2 p-2 border rounded bg-white flex items-center gap-2">
                  <input type="checkbox" v-model="isPrivateLocal" id="priv" class="h-4 w-4" />
                  <label for="priv" class="text-gray-700 text-sm flex items-center gap-1">
                    Privada 🔒
                  </label>
                </div>

                <button
                  @click="saveChanges"
                  :disabled="isSaving"
                  class="w-full py-3 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700 transition duration-150 disabled:opacity-50 mt-auto"
                >
                  <i v-if="isSaving" class="fas fa-spinner fa-spin mr-2"></i>
                  {{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
                </button>
              </div>
            </div>
          </ClientOnly>
        </div>
      </div>

      <Teleport to="body">
        <div
          v-if="saveSuccess"
          class="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg transition-opacity duration-300"
        >
          Alterações salvas com sucesso!
        </div>
      </Teleport>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import Header from '~/components/Header.vue'
import { useAuthStore } from '~/stores/auth'
import { useRoute, useRouter, useRuntimeConfig } from '#app'

definePageMeta({ middleware: ['auth'] })

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const image = ref(null)
const isLoading = ref(true)
const error = ref(null)
const isSaving = ref(false)
const isPrivateLocal = ref(false)
const saveSuccess = ref(false)

const baseImage = ref(null)
const overlayCanvas = ref(null)
let canvasCtx = null
const rects = reactive([])

let naturalW = 0
let naturalH = 0
let rotation = 0
let drawing = false
let moving = false
let startX = 0
let startY = 0
let offsetX = 0
let offsetY = 0
let selected = -1
const cropActive = ref(false)
const mode = ref('blur')

const imageId = route.params.id
const imageType = route.query.type

const fetchImage = async () => {
  const token = authStore.token
  if (!token) {
    error.value = 'Token ausente.'
    isLoading.value = false
    return
  }
  try {
    const resp = await $fetch(`/api/records/image/${imageId}`, {
      baseURL: config.public.apiBaseUrl,
      query: { type: imageType },
      headers: { Authorization: `Bearer ${token}` }
    })
    image.value = resp
    isPrivateLocal.value = resp.isPrivate || false
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar imagem.'
  } finally {
    isLoading.value = false
  }
}

const setMode = (m) => (mode.value = m)
const toggleCrop = () => (cropActive.value = !cropActive.value)
const clearEffects = () => { rects.splice(0, rects.length); redrawAll() }

const rotateImage = async () => {
  rotation = (rotation + 90) % 360
  await nextTick()
  resizeCanvasToImage()
  redrawAll()
}

const resizeCanvasToImage = () => {
  const img = baseImage.value
  const canvas = overlayCanvas.value
  if (!img || !canvas) return
  const rect = img.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  canvasCtx = canvas.getContext('2d')
  redrawAll()
}

const redrawAll = () => {
  if (!canvasCtx) return
  canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height)
  const img = baseImage.value
  if (!img) return
  const sxScale = naturalW / canvasCtx.canvas.width
  const syScale = naturalH / canvasCtx.canvas.height

  rects.forEach((r) => {
    if (r.type === 'stripe') {
      canvasCtx.fillStyle = 'rgba(0,0,0,0.95)'
      canvasCtx.fillRect(r.x, r.y, r.w, r.h)
    } else if (r.type === 'blur') {
      try {
        const sx = r.x * sxScale
        const sy = r.y * syScale
        const sw = r.w * sxScale
        const sh = r.h * syScale
        canvasCtx.save()
        canvasCtx.filter = 'blur(8px)'
        canvasCtx.drawImage(img, sx, sy, sw, sh, r.x, r.y, r.w, r.h)
        canvasCtx.restore()
      } catch {}
    }
  })
}

const onImageLoad = () => {
  naturalW = baseImage.value.naturalWidth
  naturalH = baseImage.value.naturalHeight
  resizeCanvasToImage()
}

const getCoords = (e) => {
  const rect = overlayCanvas.value.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

const onDown = (e) => {
  const pos = getCoords(e)
  if (cropActive.value) {
    drawing = true
    startX = pos.x
    startY = pos.y
    return
  }
  const idx = rects.findIndex(
    (r) => pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h
  )
  if (idx !== -1) {
    moving = true
    selected = idx
    offsetX = pos.x - rects[idx].x
    offsetY = pos.y - rects[idx].y
    return
  }
  drawing = true
  startX = pos.x
  startY = pos.y
}

const onMove = (e) => {
  const pos = getCoords(e)
  if (!drawing) return
  redrawAll()
  canvasCtx.setLineDash([6, 3])
  canvasCtx.strokeStyle = cropActive.value ? '#f87171' : '#38bdf8'
  canvasCtx.strokeRect(startX, startY, pos.x - startX, pos.y - startY)
}

const onUp = (e) => {
  if (!drawing) return
  drawing = false
  const pos = getCoords(e)
  const x = Math.min(startX, pos.x)
  const y = Math.min(startY, pos.y)
  const w = Math.abs(pos.x - startX)
  const h = Math.abs(pos.y - startY)
  if (cropActive.value) {
    applyCrop(x, y, w, h)
    cropActive.value = false
  } else if (w > 5 && h > 5) {
    rects.push({ x, y, w, h, type: mode.value })
  }
  redrawAll()
}

const applyCrop = (x, y, w, h) => {
  if (!baseImage.value) return
  const img = baseImage.value
  const canvas = document.createElement('canvas')
  const scaleX = naturalW / overlayCanvas.value.width
  const scaleY = naturalH / overlayCanvas.value.height
  canvas.width = w * scaleX
  canvas.height = h * scaleY
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, x * scaleX, y * scaleY, w * scaleX, h * scaleY, 0, 0, w * scaleX, h * scaleY)
  img.src = canvas.toDataURL('image/png')
  naturalW = canvas.width
  naturalH = canvas.height
  rects.splice(0, rects.length)
  nextTick(() => resizeCanvasToImage())
}

const saveChanges = async () => {
  try {
    isSaving.value = true
    const token = authStore.token
    if (!token) throw new Error('Token ausente.')
    const img = baseImage.value

    const output = document.createElement('canvas')
    output.width = naturalW
    output.height = naturalH
    const ctx = output.getContext('2d')
    ctx.drawImage(img, 0, 0, output.width, output.height)

    const scaleX = naturalW / overlayCanvas.value.width
    const scaleY = naturalH / overlayCanvas.value.height

    rects.forEach((r) => {
      const nx = r.x * scaleX
      const ny = r.y * scaleY
      const nw = r.w * scaleX
      const nh = r.h * scaleY
      if (r.type === 'stripe') {
        ctx.fillStyle = '#000'
        ctx.fillRect(nx, ny, nw, nh)
      } else if (r.type === 'blur') {
        ctx.save()
        ctx.filter = 'blur(8px)'
        ctx.drawImage(img, nx, ny, nw, nh, nx, ny, nw, nh)
        ctx.restore()
      }
    })

    const blob = await new Promise((res) => output.toBlob(res, 'image/png'))
    const formData = new FormData()
    formData.append('recordId', image.value?.recordId || '')
    formData.append('fileId', image.value?.fileId || '')
    formData.append('originalUrl', image.value?.url || '')
    formData.append('isPrivate', isPrivateLocal.value ? 'true' : 'false')
    formData.append('editedFile', blob, 'edited.png')

    await $fetch('/api/images/edit_upload', {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
      baseURL: config.public.apiBaseUrl
    })

    saveSuccess.value = true
    setTimeout(() => router.push('/dashboard'), 1000)
  } catch (err) {
    error.value = err?.data?.message || err.message || 'Erro ao salvar edição.'
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  await fetchImage()
  await nextTick()
  const canvas = overlayCanvas.value
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  window.addEventListener('resize', resizeCanvasToImage)
})
</script>
