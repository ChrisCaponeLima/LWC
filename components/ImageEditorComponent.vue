// /components/ImageEditorComponent.vue - V1.3 - Correção do salto de posição dos controles após rotação.
<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <div class="relative w-full border-x border-gray-200 bg-gray-100 flex justify-center items-center max-h-[80vh] min-h-[400px]">
        
        <div 
          ref="imageContainer" 
          class="relative mx-auto w-full h-full"
          :style="rotationWrapperStyle" 
        >
          <img
            ref="baseImage"
            :src="initialImageUrl"
            crossorigin="anonymous"
            @load="onImageLoad"
            class="w-full h-full object-contain block transition-transform duration-300"
            :style="{ transform: `rotate(${rotation}deg)` }"
          />
          <canvas ref="overlayCanvas" class="absolute top-0 left-0"></canvas>
        </div>
        
      </div>
    </div>

    <div class="lg:col-span-1 p-4 border rounded-lg bg-gray-50 flex flex-col gap-4">
      
      <slot name="type-selector"></slot>
      
      <div class="flex items-center gap-3 flex-wrap border-b pb-4">
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
        <button @click="clearEffects" class="p-2 rounded-md hover:bg-gray-200" title="Limpar efeitos">
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
        @click="processImageAndSave"
        :disabled="isSaving"
        class="w-full py-3 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700 transition duration-150 disabled:opacity-50 mt-auto"
      >
        <i v-if="isSaving" class="fas fa-spinner fa-spin mr-2"></i>
        {{ isSaving ? 'Processando...' : 'Continuar' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch, computed, onUnmounted } from 'vue'

const props = defineProps({
  initialImageUrl: { type: String, required: true },
  imageType: { type: String, required: true }, // 'photo' ou 'forma'
  initialIsPrivate: { type: Boolean, default: false },
})

const emit = defineEmits(['saveEditedImage', 'error', 'rotate']) 

const isSaving = ref(false)
const isPrivateLocal = ref(props.initialIsPrivate)

watch(() => props.initialIsPrivate, (newVal) => {
    isPrivateLocal.value = newVal
})

const baseImage = ref(null)
const overlayCanvas = ref(null)
let canvasCtx = null
const rects = reactive([])

let naturalW = 0
let naturalH = 0
const rotation = ref(0)
let drawing = false
let moving = false
let startX = 0
let startY = 0
let selected = -1
const cropActive = ref(false)
const mode = ref('blur')

// 🚨 MODIFICADO: Estilo computado ajustado para usar aspect-ratio, contido pelo pai com altura fixa
const rotationWrapperStyle = computed(() => {
    const isRotated90or270 = rotation.value % 180 !== 0;
    
    let currentW = naturalW;
    let currentH = naturalH;

    if (isRotated90or270) {
        currentW = naturalH;
        currentH = naturalW;
    }

    // Retorna o estilo para o wrapper interno (imageContainer)
    return {
        // Usa `aspectRatio` para que o wrapper sempre tenha a proporção visual correta (rotacionada ou não)
        aspectRatio: `${currentW} / ${currentH}`, 
        maxWidth: '100%', 
        maxHeight: '100%',
        margin: 'auto',
    };
});

const setMode = (m) => (mode.value = m)
const toggleCrop = () => (cropActive.value = !cropActive.value)

const clearEffects = () => { 
    rects.splice(0, rects.length); 
    redrawAll() 
}

const rotateImage = async () => {
    rotation.value = (rotation.value + 90) % 360
    
    // Limpa todos os efeitos após a rotação
    clearEffects() 
    
    await nextTick()
    resizeCanvasToImage()
    
    emit('rotate', rotation.value)
}

const resizeCanvasToImage = () => {
    const img = baseImage.value
    const canvas = overlayCanvas.value
    const container = img.parentElement // imageContainer div

    if (!img || !canvas || !container) return
    
    // Obtém as dimensões VISÍVEIS do container (que é o tamanho da imagem encaixada)
    const containerRect = container.getBoundingClientRect()
    
    // O canvas deve ter o mesmo tamanho VISUAL do container
    canvas.width = containerRect.width
    canvas.height = containerRect.height
    
    canvasCtx = canvas.getContext('2d')
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
    
    redrawAll()
}

const redrawAll = () => {
    if (!canvasCtx) return
    canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height)
    const img = baseImage.value
    if (!img) return
    
    const sxScale = naturalW / canvasCtx.canvas.width
    const syScale = naturalH / canvasCtx.canvas.height
    
    // Como os efeitos são limpos na rotação, o desenho aqui só ocorre
    // quando a rotação é 0, então as coordenadas são válidas.
    rects.forEach((r) => {
        const nx = r.x 
        const ny = r.y
        const nw = r.w
        const nh = r.h
        
        if (r.type === 'stripe') {
            canvasCtx.fillStyle = 'rgba(0,0,0,0.95)'
            canvasCtx.fillRect(nx, ny, nw, nh)
        } else if (r.type === 'blur') {
            try {
                const sx = nx * sxScale
                const sy = ny * syScale
                const sw = nw * sxScale
                const sh = nh * syScale
                
                canvasCtx.save()
                canvasCtx.filter = 'blur(8px)'
                canvasCtx.drawImage(img, sx, sy, sw, sh, nx, ny, nw, nh)
                canvasCtx.restore()
            } catch {}
        }
    })
}

const onImageLoad = () => {
  naturalW = baseImage.value.naturalWidth
  naturalH = baseImage.value.naturalHeight
  rotation.value = 0 
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
  } else if (rotation.value === 0 && w > 5 && h > 5) {
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
  
  rotation.value = 0 
  
  nextTick(() => resizeCanvasToImage())
}

const processImageAndSave = async () => {
    try {
        isSaving.value = true
        const img = baseImage.value

        const output = document.createElement('canvas')
        
        const finalW = rotation.value % 180 !== 0 ? naturalH : naturalW;
        const finalH = rotation.value % 180 !== 0 ? naturalW : naturalH;

        output.width = finalW
        output.height = finalH
        const ctx = output.getContext('2d')
        
        // 1. Aplica a rotação no canvas de saída
        ctx.save()
        ctx.translate(finalW / 2, finalH / 2);
        ctx.rotate((rotation.value * Math.PI) / 180);
        
        if (rotation.value % 180 !== 0) {
            ctx.drawImage(img, -finalH / 2, -finalW / 2, finalH, finalW)
        } else {
            ctx.drawImage(img, -finalW / 2, -finalH / 2, finalW, finalH)
        }
        ctx.restore()
        
        // 2. Aplica os efeitos (se houver, o que só ocorre se rotation.value === 0)
        
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
        
        emit('saveEditedImage', {
            blob: blob,
            isPrivate: isPrivateLocal.value,
            type: props.imageType,
        })

    } catch (err) {
        console.error('Erro ao processar imagem:', err)
        emit('error', err?.message || 'Erro desconhecido ao processar a imagem.')
    } finally {
        isSaving.value = false
    }
}

onMounted(() => {
  const canvas = overlayCanvas.value
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  window.addEventListener('resize', resizeCanvasToImage)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvasToImage)
  if (overlayCanvas.value) {
    overlayCanvas.value.removeEventListener('pointerdown', onDown)
    overlayCanvas.value.removeEventListener('pointermove', onMove)
    overlayCanvas.value.removeEventListener('pointerup', onUp)
  }
})
</script>