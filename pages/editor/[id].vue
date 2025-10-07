// /pages/editor/[id].vue - V1.6 - Editor de imagens: blur / tarja / reset / download + usa authStore.token
<template>
  <div>
    <!-- Header agora aceita "title" prop -->
    <Header :title="'Editor de imagens'" />

    <div class="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div class="max-w-7xl mx-auto bg-white shadow-xl rounded-lg p-6">
        <NuxtLink to="/dashboard" class="text-indigo-600 hover:text-indigo-800 mb-6 inline-block font-semibold">
          ← Voltar para o Dashboard
        </NuxtLink>

        <div v-if="error" class="text-red-600 p-4 border border-red-200 rounded bg-red-50">
          <i class="fas fa-exclamation-triangle mr-2"></i> {{ error }}
        </div>

        <div v-else-if="isLoading" class="text-center p-6">
          <i class="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
          <p class="mt-2 text-gray-600">Carregando imagem e ferramentas...</p>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <!-- AREA DA IMAGEM (ocupa 2/3 em desktop) -->
          <div class="lg:col-span-2">
            <div class="relative w-full aspect-square lg:max-h-[75vh] rounded-lg overflow-hidden border-l-3 border-r-3"
                 :style="{ borderLeftWidth: '3px', borderRightWidth: '3px', borderStyle: 'solid' }">
              <!-- imagem de fundo (invisível ) para leitura de dimensão -->
              <img ref="imgRef" :src="image?.url" alt="Imagem" class="w-full h-full object-contain" @load="onImageLoad" />

              <!-- overlay que mantém proporção square e exibe retângulos -->
              <div ref="overlayRef" class="absolute inset-0 pointer-events-auto">
                <!-- retângulos desenhados (visuais) -->
                <div v-for="(r, idx) in rects" :key="idx"
                     class="absolute"
                     :style="rectStyle(r)"
                     @mousedown.stop.prevent="startRectDrag($event, idx)"
                     @touchstart.stop.prevent="startRectDrag($event, idx)">
                  <div v-if="r.type === 'black'" class="w-full h-full bg-black/90"></div>
                  <div v-else class="w-full h-full" :style="{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }"></div>
                </div>

                <!-- desenho quando ativo -->
                <div v-if="drawingRect" class="absolute border-2 border-dashed border-indigo-400" :style="rectStyle(drawingRect)"></div>
              </div>

              <!-- badge tipo / data -->
              <div class="absolute top-0 left-0 bg-indigo-600 text-white text-sm px-3 py-1 rounded-br-lg font-medium">
                {{ image?.type === 'registro' ? 'Evolução' : 'Forma' }} - {{ formatDate(image?.date) }}
              </div>
            </div>
          </div>

          <!-- PAINEL LATERAL -->
          <div class="lg:col-span-1 p-4 border rounded-lg bg-gray-50 flex flex-col gap-4">
            <h3 class="text-xl font-semibold text-gray-700">Ajustes e Metadados</h3>

            <!-- Controls: tipo retângulo -->
            <div class="p-3 border rounded-md bg-white">
              <p class="font-medium mb-2">Ferramenta de Retângulo</p>
              <div class="flex gap-2">
                <button :class="['px-3 py-2 rounded', tool === 'blur' ? 'bg-indigo-600 text-white' : 'bg-gray-200']" @click="tool = 'blur'">Blur</button>
                <button :class="['px-3 py-2 rounded', tool === 'black' ? 'bg-indigo-600 text-white' : 'bg-gray-200']" @click="tool = 'black'">Tarja preta</button>
                <button class="px-3 py-2 rounded bg-red-100 text-red-700 ml-auto" @click="clearRects">Limpar</button>
              </div>
              <p class="text-xs text-gray-500 mt-2">Desenhe retângulos sobre a imagem clicando e arrastando. Cada retângulo pode ser movido após criado.</p>
            </div>

            <!-- Lista de rects com controle -->
            <div class="p-3 border rounded-md bg-white max-h-48 overflow-auto">
              <p class="font-medium mb-2">Retângulos aplicados</p>
              <template v-if="rects.length">
                <div v-for="(r, i) in rects" :key="i" class="flex items-center justify-between text-sm py-1">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" :class="r.type === 'black' ? 'bg-black' : 'bg-indigo-400'"></span>
                    <span>{{ r.type }} — {{ Math.round(r.w) }}×{{ Math.round(r.h) }}</span>
                  </div>
                  <div class="flex gap-2">
                    <button class="text-xs text-gray-600 hover:text-gray-900" @click="removeRect(i)">Remover</button>
                    <button class="text-xs text-indigo-600 hover:text-indigo-900" @click="toggleRectLock(i)">{{ r.locked ? '🔒' : '🔓' }}</button>
                  </div>
                </div>
              </template>
              <p v-else class="text-sm text-gray-500">Nenhum retângulo aplicado.</p>
            </div>

            <!-- Visibilidade -->
            <div class="p-3 border rounded-md bg-white">
              <p class="font-medium mb-2">Visibilidade</p>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" v-model="isPrivateLocal" class="form-checkbox h-5 w-5 text-indigo-600 rounded" />
                <span class="text-gray-700">Tornar esta foto privada 🔒</span>
              </label>
            </div>

            <div class="flex flex-col gap-2 mt-auto">
              <div class="flex gap-2">
                <button @click="saveChanges" :disabled="isSaving" class="flex-1 py-3 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700 disabled:opacity-50">
                  <i v-if="isSaving" class="fas fa-spinner fa-spin mr-2"></i> {{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
                </button>
                <button @click="resetImage" class="py-3 px-3 bg-gray-200 rounded-md text-gray-700">Reset</button>
              </div>
              <div class="flex gap-2">
                <button @click="downloadWithEffects" class="flex-1 py-3 bg-green-600 text-white rounded-md font-bold hover:bg-green-700">Download (com efeitos)</button>
                <button @click="downloadOriginal" class="py-3 px-3 bg-gray-200 rounded-md text-gray-700">Download Original</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="saveMessage" :class="['p-3 rounded-md text-sm mb-4', saveSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
          {{ saveMessage }}
        </div>

        <div v-else-if="!image && !isLoading" class="text-center p-10 text-gray-500">
          Nenhuma imagem encontrada. Verifique a URL.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import Header from '~/components/Header.vue'
import { useAuthStore } from '~/stores/auth'
import { useRoute } from '#imports'
import { useRuntimeConfig } from '#app'

/**
 * Editor de imagens:
 * - desenhar retângulos (blur / black)
 * - reset
 * - download (com efeitos)
 * - envia Authorization: Bearer <token> usando authStore.token ou fallback localStorage
 */

const authStore = useAuthStore()
const config = useRuntimeConfig()

const route = useRoute()
const imageId = route.params.id
const imageType = route.query.type

const image = ref(null)
const isLoading = ref(true)
const error = ref(null)
const isSaving = ref(false)
const saveMessage = ref('')
const saveSuccess = ref(false)

const isPrivateLocal = ref(false)

// refs para imagem e overlay
const imgRef = ref(null)
const overlayRef = ref(null)

// dimension info
const natural = reactive({ w: 0, h: 0 })

// retângulos
const rects = ref([]) // each: { x,y,w,h, type: 'blur'|'black', locked: boolean }
const drawingRect = ref(null)
const tool = ref('blur') // default 'blur'

// mouse state
let isDrawing = false
let startX = 0
let startY = 0

// token fallback
const getAuthToken = () => {
  // prefer authStore.token (pinia), fallback to localStorage key used in project
  return authStore.token || (process.client ? localStorage.getItem('authToken') : null)
}

const formatDate = (dateString) => {
  if (!dateString) return 'S/D'
  try {
    return new Date(dateString).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return dateString
  }
}

const onImageLoad = (ev) => {
  const img = ev.target
  natural.w = img.naturalWidth
  natural.h = img.naturalHeight
}

// Fetch image (GET)
const fetchImage = async () => {
  isLoading.value = true
  error.value = null
  try {
    if (!imageId || !imageType) {
      error.value = 'Parâmetros de imagem (ID ou tipo) ausentes.'
      return
    }
    const token = getAuthToken()
    if (!token) {
      error.value = 'Erro: Token de autenticação não encontrado. Faça login novamente.'
      return
    }

    const resp = await $fetch(`/api/records/image/${imageId}`, {
      baseURL: config.public.apiBaseUrl,
      query: { type: imageType },
      headers: { Authorization: `Bearer ${token}` }
    })
    image.value = resp
    isPrivateLocal.value = !!resp.isPrivate
    rects.value = [] // inicia sem rects salvos (não persistimos retângulos no backend por agora)
  } catch (e) {
    console.error('Erro ao buscar imagem:', e)
    error.value = e?.data?.message || e?.message || String(e)
  } finally {
    isLoading.value = false
  }
}

// START drawing (mouse/touch) - create new rect
const clientPos = (ev) => {
  if (ev.touches && ev.touches[0]) {
    return { x: ev.touches[0].clientX, y: ev.touches[0].clientY }
  }
  return { x: ev.clientX, y: ev.clientY }
}

const localPosOnOverlay = (clientX, clientY) => {
  const el = overlayRef.value
  if (!el) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  const x = Math.max(0, clientX - rect.left)
  const y = Math.max(0, clientY - rect.top)
  // normalize relative to element size -> but we'll store in px based on overlay size; will map to natural when exporting
  return { x, y, w: rect.width, h: rect.height }
}

const startRect = (clientX, clientY) => {
  const p = localPosOnOverlay(clientX, clientY)
  isDrawing = true
  startX = p.x
  startY = p.y
  drawingRect.value = { x: startX, y: startY, w: 0, h: 0, type: tool.value }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', endRect)
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', endRect)
}

const onMouseDown = (ev) => {
  // only start if clicking inside overlay
  startRect(ev.clientX, ev.clientY)
}
const onTouchStart = (ev) => {
  const p = clientPos(ev)
  startRect(p.x, p.y)
}

const onMouseMove = (ev) => {
  if (!isDrawing) return
  const p = localPosOnOverlay(ev.clientX, ev.clientY)
  drawingRect.value.w = Math.max(1, p.x - startX)
  drawingRect.value.h = Math.max(1, p.y - startY)
}

const onTouchMove = (ev) => {
  ev.preventDefault()
  if (!isDrawing) return
  const p = clientPos(ev)
  const lp = localPosOnOverlay(p.x, p.y)
  drawingRect.value.w = Math.max(1, lp.x - startX)
  drawingRect.value.h = Math.max(1, lp.y - startY)
}

const endRect = () => {
  if (!isDrawing) return
  isDrawing = false
  if (drawingRect.value && drawingRect.value.w > 2 && drawingRect.value.h > 2) {
    rects.value.push({ ...drawingRect.value, locked: false })
  }
  drawingRect.value = null
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', endRect)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', endRect)
}

// allow moving rectangles (simple implementation: on mousedown on rect we start dragging)
let dragState = null
const startRectDrag = (ev, idx) => {
  const p = clientPos(ev)
  const lp = localPosOnOverlay(p.x, p.y)
  const r = rects.value[idx]
  if (r.locked) return
  dragState = { idx, offsetX: lp.x - r.x, offsetY: lp.y - r.y }
  window.addEventListener('mousemove', dragging)
  window.addEventListener('mouseup', endDragging)
  window.addEventListener('touchmove', touchDragging, { passive: false })
  window.addEventListener('touchend', endDragging)
}

const dragging = (ev) => {
  if (!dragState) return
  const p = localPosOnOverlay(ev.clientX, ev.clientY)
  const r = rects.value[dragState.idx]
  if (!r) return
  r.x = Math.max(0, p.x - dragState.offsetX)
  r.y = Math.max(0, p.y - dragState.offsetY)
}

const touchDragging = (ev) => {
  ev.preventDefault()
  if (!dragState) return
  const p = clientPos(ev)
  const lp = localPosOnOverlay(p.x, p.y)
  const r = rects.value[dragState.idx]
  if (!r) return
  r.x = Math.max(0, lp.x - dragState.offsetX)
  r.y = Math.max(0, lp.y - dragState.offsetY)
}

const endDragging = () => {
  dragState = null
  window.removeEventListener('mousemove', dragging)
  window.removeEventListener('mouseup', endDragging)
  window.removeEventListener('touchmove', touchDragging)
  window.removeEventListener('touchend', endDragging)
}

const rectStyle = (r) => {
  return {
    left: `${r.x}px`,
    top: `${r.y}px`,
    width: `${r.w}px`,
    height: `${r.h}px`,
    cursor: r.locked ? 'default' : 'move',
    zIndex: 30
  }
}

const clearRects = () => { rects.value = [] }

// remove single rect
const removeRect = (i) => { rects.value.splice(i, 1) }
const toggleRectLock = (i) => { rects.value[i].locked = !rects.value[i].locked }

// RESET (aplica local reset)
const resetImage = () => {
  rects.value = []
  saveMessage.value = ''
  saveSuccess.value = false
  // reset visibility to backend state
  isPrivateLocal.value = !!image.value?.isPrivate
}

// SAVE changes (PATCH metadata isPrivate)
const saveChanges = async () => {
  isSaving.value = true
  saveMessage.value = ''
  saveSuccess.value = false
  try {
    const token = getAuthToken()
    if (!token) throw new Error('Token ausente')
    const resp = await $fetch(`/api/records/image/${imageId}`, {
      baseURL: config.public.apiBaseUrl,
      method: 'PATCH',
      query: { type: imageType },
      headers: { Authorization: `Bearer ${token}` },
      body: { isPrivate: !!isPrivateLocal.value }
    })
    saveSuccess.value = true
    saveMessage.value = resp.message || 'Alterações salvas com sucesso!'
    // atualiza estado local
    if (image.value) image.value.isPrivate = !!isPrivateLocal.value
  } catch (e) {
    console.error('Erro ao salvar alterações:', e)
    saveSuccess.value = false
    saveMessage.value = e?.data?.message || e?.message || 'Falha ao salvar as alterações.'
  } finally {
    isSaving.value = false
  }
}

// DOWNLOAD com efeitos: cria canvas com tamanho natural e aplica efeitos
const downloadWithEffects = async () => {
  if (!image.value) return
  try {
    // cria canvas com dimensões naturais da imagem
    const imgEl = imgRef.value
    if (!imgEl || !imgEl.naturalWidth) {
      alert('Imagem não disponível para download.')
      return
    }
    const natW = imgEl.naturalWidth
    const natH = imgEl.naturalHeight
    const overlayEl = overlayRef.value
    const overlayRect = overlayEl.getBoundingClientRect()
    const scaleX = natW / overlayRect.width
    const scaleY = natH / overlayRect.height

    const canvas = document.createElement('canvas')
    canvas.width = natW
    canvas.height = natH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D não suportado.')

    // desenha imagem base
    await new Promise((res) => {
      const tmp = new Image()
      tmp.crossOrigin = 'anonymous'
      tmp.onload = () => {
        ctx.drawImage(tmp, 0, 0, natW, natH)
        res(true)
      }
      tmp.onerror = () => res(true)
      tmp.src = image.value.url
    })

    // aplica rects (em ordem)
    for (const r of rects.value) {
      const sx = Math.round(r.x * scaleX)
      const sy = Math.round(r.y * scaleY)
      const sw = Math.round(r.w * scaleX)
      const sh = Math.round(r.h * scaleY)
      if (sw <= 0 || sh <= 0) continue

      if (r.type === 'black') {
        ctx.fillStyle = 'black'
        ctx.fillRect(sx, sy, sw, sh)
      } else {
        // blur: desenha a porção desenhada com filtro blur
        // cria temporário
        const tmpCanvas = document.createElement('canvas')
        tmpCanvas.width = sw
        tmpCanvas.height = sh
        const tctx = tmpCanvas.getContext('2d')
        if (!tctx) continue
        tctx.filter = 'blur(8px)'
        tctx.drawImage(imgRef.value, sx, sy, sw, sh, 0, 0, sw, sh)
        // então desenha de volta
        ctx.drawImage(tmpCanvas, 0, 0, sw, sh, sx, sy, sw, sh)
      }
    }

    // converte para blob e download
    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Falha ao gerar imagem.')
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `image-${imageId}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }, 'image/png')
  } catch (err) {
    console.error('Erro ao exportar imagem:', err)
    alert('Falha ao gerar o download da imagem.')
  }
}

// download original
const downloadOriginal = () => {
  if (!image.value) return
  const a = document.createElement('a')
  a.href = image.value.url
  a.download = `original-${imageId}`
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// lifecycle
onMounted(async () => {
  // garante visual do authStore
  if (!authStore.initialized && authStore.init) {
    try { authStore.init() } catch (e) { console.error('auth.init', e) }
  }
  await nextTick()
  await fetchImage()

  // attach listeners para desenho na overlay
  const overlay = overlayRef.value
  if (overlay) {
    overlay.addEventListener('mousedown', (ev) => onMouseDown(ev))
    overlay.addEventListener('touchstart', (ev) => startRect(ev.touches ? ev.touches[0] : ev))
  }
})
</script>

<style scoped>
/* 3px border visual nas laterais conforme solicitado */
.border-l-3 { border-left-width: 3px; border-left-style: solid; border-left-color: rgba(0,0,0,0.06); }
.border-r-3 { border-right-width: 3px; border-right-style: solid; border-right-color: rgba(0,0,0,0.06); }
</style>
