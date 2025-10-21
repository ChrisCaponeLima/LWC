// /components/ImageEditorComponent.vue - V1.11 - Correção Definitiva do Fluxo de Download
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
imageType: { type: String, required: true }, 
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
// rects armazena as coordenadas *relativas à imagem original não rotacionada (naturalW x naturalH)*
const rects = reactive([]) 

let naturalW = 0
let naturalH = 0
const rotation = ref(0)
let drawing = false
let startX = 0
let startY = 0
const cropActive = ref(false)
const mode = ref('blur')

const rotationWrapperStyle = computed(() => {
 const isRotated90or270 = rotation.value % 180 !== 0;
 
 let currentW = naturalW;
 let currentH = naturalH;

 if (isRotated90or270) {
  currentW = naturalH;
  currentH = naturalW;
 }

 return {
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
 
 clearEffects() 
 
 await nextTick()
 resizeCanvasToImage()
 
 emit('rotate', rotation.value)
}

const resizeCanvasToImage = () => {
 const img = baseImage.value
 const canvas = overlayCanvas.value
 const container = img.parentElement 

 if (!img || !canvas || !container) return
 
 const containerRect = container.getBoundingClientRect()
 
 canvas.width = containerRect.width
 canvas.height = containerRect.height
 
 canvasCtx = canvas.getContext('2d')
 canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
 
 redrawAll()
}

/**
* 🚨 REVISADO: Calcula as métricas de escala e offset do 'object-contain' no DOM.
*/
const getImageRenderMetrics = () => {
  const canvas = overlayCanvas.value
  if (!canvas || naturalW === 0 || naturalH === 0) return null

  const cw = canvas.width
  const ch = canvas.height
  
  // Dimensões VISUAIS (o que o usuário vê na tela - rotacionado)
  const visualW = rotation.value % 180 !== 0 ? naturalH : naturalW;
  const visualH = rotation.value % 180 !== 0 ? naturalW : naturalH;

  // Escala que o object-contain está usando
  const ratioContainer = cw / ch;
  const ratioImage = visualW / visualH;

  let renderedW, renderedH;

  if (ratioContainer > ratioImage) {
    // Altura do contêiner limita a imagem (fit height)
    renderedH = ch;
    renderedW = ch * ratioImage;
  } else {
    // Largura do contêiner limita a imagem (fit width)
    renderedW = cw;
    renderedH = cw / ratioImage;
  }

  const offsetX = (cw - renderedW) / 2;
  const offsetY = (ch - renderedH) / 2;
  
  // Escala de conversão da Renderização (Canvas) para o Original (mapa de bits)
  // 1 pixel na tela Renderizada corresponde a 'scale' pixels na Imagem Original.
  const scale = naturalW / visualW; 

  return {
    renderedW, 
    renderedH, 
    offsetX, 
    offsetY, 
    scale,
    visualW,
    visualH
  }
}

/**
* 🚨 CORRIGIDO: Mapeia as coordenadas do mouse no Canvas (rotacionado visualmente) 
* de volta para o sistema de coordenadas da imagem ORIGINAL (naturalW x naturalH).
*/
const transformCoordsToOriginal = (x, y, w, h) => {
  const metrics = getImageRenderMetrics()
  if (!metrics) return { x: 0, y: 0, w: 0, h: 0 }
  
  const { renderedW, renderedH, offsetX, offsetY, scale } = metrics
  
  // 1. Mapear coordenadas do Canvas (clique) para a imagem RENDERIZADA (visual), 
  // compensando o offset (a "borda" cinza do object-contain).
  let vx = (x - offsetX);
  let vy = (y - offsetY);
  let vw = w;
  let vh = h;

  // Se o clique estiver fora da imagem renderizada, retorna vazio.
  if (vx < -5 || vy < -5 || vx > renderedW + 5 || vy > renderedH + 5) {
    return { x: 0, y: 0, w: 0, h: 0 }; 
  }

  // Garante que o retângulo não ultrapasse a área renderizada
  vx = Math.max(0, vx);
  vy = Math.max(0, vy);
  vw = Math.min(vw, renderedW - vx);
  vh = Math.min(vh, renderedH - vy);

  let finalX, finalY, finalW, finalH;

  // 2. Aplicar Rotação Inversa e Escala para coordenadas Originais (naturalW x naturalH)
  switch (rotation.value) {
    case 0:
      finalX = vx * scale;
      finalY = vy * scale;
      finalW = vw * scale;
      finalH = vh * scale;
      break;
    case 90:
      // X (original) = Y visual, Y (original) = X visual invertido
      // As dimensões do plano visual (renderizado) são as dimensões visuaisW/visualH
      finalX = vy * scale;
      finalY = (renderedW - vx - vw) * scale;
      // As dimensões finais são invertidas (w renderizado -> h original, h renderizado -> w original)
      finalW = vh * scale; 
      finalH = vw * scale;
      break;
    case 180:
      // X (original) = X visual invertido, Y (original) = Y visual invertido
      finalX = (renderedW - vx - vw) * scale;
      finalY = (renderedH - vy - vh) * scale;
      finalW = vw * scale;
      finalH = vh * scale;
      break;
    case 270:
      // X (original) = Y visual invertido, Y (original) = X visual
      finalX = (renderedH - vy - vh) * scale;
      finalY = vx * scale;
      // As dimensões finais são invertidas
      finalW = vh * scale; 
      finalH = vw * scale;
      break;
    default:
      return { x: 0, y: 0, w: 0, h: 0 };
  }

  // Coordenadas devem ser arredondadas para evitar imprecisão de pixel
  return { 
    x: Math.max(0, Math.round(finalX)), 
    y: Math.max(0, Math.round(finalY)), 
    w: Math.round(finalW), 
    h: Math.round(finalH) 
  };
}


const redrawAll = () => {
 if (!canvasCtx) return
 canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height)
 const img = baseImage.value
 const metrics = getImageRenderMetrics()
  if (!img || !metrics) return

  const { renderedW, renderedH, offsetX, offsetY, scale } = metrics;
  
  // Escala de conversão: Original (px) para Renderizado (px)
  const invScale = 1 / scale; 

  // === Aplica os efeitos no Overlay (Visualização) ===
  rects.forEach((r) => {
    // Coordenadas 'r' estão no sistema da imagem ORIGINAL (naturalW x naturalH)
    let tx, ty, tw, th; // Coordenadas no Canvas de overlay (renderizado)

    // 1. Mapear do Original (r) para o Renderizado (tx, ty, tw, th) no Canvas
    switch (rotation.value) {
      case 0:
        tx = r.x * invScale + offsetX;
        ty = r.y * invScale + offsetY;
        tw = r.w * invScale;
        th = r.h * invScale;
        break;
      case 90:
        // X Renderizado = (VisualH - Y Original - H Original) * invScale + Offset X
        // Y Renderizado = X Original * invScale + Offset Y
        tx = (naturalH - r.y - r.h) * invScale + offsetX;
        ty = r.x * invScale + offsetY;
        // Largura Renderizada = Altura Original * invScale
        // Altura Renderizada = Largura Original * invScale
        tw = r.h * invScale;
        th = r.w * invScale;
        break;
      case 180:
        tx = (naturalW - r.x - r.w) * invScale + offsetX;
        ty = (naturalH - r.y - r.h) * invScale + offsetY;
        tw = r.w * invScale;
        th = r.h * invScale;
        break;
      case 270:
        // X Renderizado = Y Original * invScale + Offset X
        // Y Renderizado = (VisualW - X Original - W Original) * invScale + Offset Y
        tx = r.y * invScale + offsetX;
        ty = (naturalW - r.x - r.w) * invScale + offsetY;
        // Largura Renderizada = Altura Original * invScale
        // Altura Renderizada = Largura Original * invScale
        tw = r.h * invScale;
        th = r.w * invScale;
        break;
      default:
        return;
    }

    if (r.type === 'stripe') {
      canvasCtx.fillStyle = 'rgba(0,0,0,0.95)'
      canvasCtx.fillRect(tx, ty, tw, th)
    } else if (r.type === 'blur') {
      try {
        canvasCtx.save()
        canvasCtx.filter = 'blur(8px)'
        
        // drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
        canvasCtx.drawImage(
          img, 
          r.x, r.y, r.w, r.h, // Source: Da imagem original
          tx, ty, tw, th // Destination: No canvas de overlay
        )
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

if (w < 5 || h < 5) {
 redrawAll(); 
 return;
}
  
  // Transforma as coordenadas do Canvas (seleção) para o sistema da imagem ORIGINAL (source)
  const { 
    x: finalX, 
    y: finalY, 
    w: finalW, 
    h: finalH 
  } = transformCoordsToOriginal(x, y, w, h);

  if (finalW <= 0 || finalH <= 0) {
    redrawAll(); 
    return;
  }

if (cropActive.value) {
 applyCrop(finalX, finalY, finalW, finalH)
 cropActive.value = false
} else {
  // Efeitos: adiciona o retângulo mapeado ao sistema da imagem original
  rects.push({ 
    x: finalX, 
    y: finalY, 
    w: finalW, 
    h: finalH, 
    type: mode.value 
  })
}
redrawAll()
}

const applyCrop = (x, y, w, h) => {
if (!baseImage.value) return
const img = baseImage.value
const canvas = document.createElement('canvas')

canvas.width = w 
canvas.height = h 
const ctx = canvas.getContext('2d')

ctx.drawImage(img, x, y, w, h, 0, 0, w, h)

img.src = canvas.toDataURL('image/png')
naturalW = canvas.width
naturalH = canvas.height
rects.splice(0, rects.length)

rotation.value = 0 

nextTick(() => resizeCanvasToImage())
}

/**
* @returns {HTMLCanvasElement} O canvas final com todos os efeitos aplicados.
*/
const createFinalCanvas = () => {
 const img = baseImage.value
 if (!img) throw new Error('Imagem base não carregada.')

 const output = document.createElement('canvas')
 
 // Calcula as dimensões finais (invertidas se 90/270 graus)
 const finalW = rotation.value % 180 !== 0 ? naturalH : naturalW;
 const finalH = rotation.value % 180 !== 0 ? naturalW : naturalH;

 output.width = finalW
 output.height = finalH
 const ctx = output.getContext('2d')
 
 // === 1. Aplica Rotação e desenha a imagem base ===
 ctx.save()
 ctx.translate(finalW / 2, finalH / 2);
 ctx.rotate((rotation.value * Math.PI) / 180);
 
 // Desenha a imagem base (dimensões originais naturalW/naturalH)
 ctx.drawImage(img, -naturalW / 2, -naturalH / 2, naturalW, naturalH)
 
 ctx.restore() 

  // === 2. Aplica Efeitos (Tarjas/Blur) nas coordenadas transformadas ===
 rects.forEach((r) => {
  ctx.save()
    // Translação e rotação para o ponto central da imagem final (finalW/finalH)
    ctx.translate(finalW / 2, finalH / 2);
  ctx.rotate((rotation.value * Math.PI) / 180);
    
    // Coordenadas de destino do efeito: ajustadas para o novo centro de rotação
    const dx = r.x - (naturalW / 2);
    const dy = r.y - (naturalH / 2);
    
  if (r.type === 'stripe') {
   ctx.fillStyle = '#000'
   ctx.fillRect(dx, dy, r.w, r.h)
  } else if (r.type === 'blur') {
   ctx.filter = 'blur(8px)'
   
   // drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
   ctx.drawImage(
        img, 
        r.x, r.y, r.w, r.h, // Source: na imagem original
        dx, dy, r.w, r.h // Destino: no canvas rotacionado
      )
  }
  ctx.restore()
 })
 return output;
}


const processImageAndSave = async () => {
 try {
  isSaving.value = true
  
  const output = createFinalCanvas()
  
  const blob = await new Promise((res, rej) => {
      output.toBlob(res, 'image/png');
    });
    
    if (!blob) throw new Error('Falha ao gerar o Blob da imagem.');
  
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


const downloadEditedImage = async () => {
 if (!process.client) return; 

    let dataURL = null; // ESSENCIAL: Declarar fora do try para ser acessível no finally

 try {
  const finalCanvas = createFinalCanvas(); 
  
  const blob = await new Promise((res, rej) => {
      finalCanvas.toBlob(res, 'image/png', 1.0); 
    });
    
    if (!blob) {
      console.error('[DOWNLOAD] toBlob retornou null. A imagem pode não ter o crossorigin configurado corretamente (CORS).');
      emit('error', 'Falha ao gerar o arquivo de download. (Verifique o CORS da imagem)');
      return;
    }

    // Cria a URL temporária e inicia o download
  dataURL = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = dataURL;
  const baseName = props.imageType === 'photo' ? 'evolucao' : 'forma';
  link.download = `${baseName}-${Date.now()}.png`; 
  
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  // A revogação será feita no bloco finally
  
 } catch (e) {
  console.error('[DOWNLOAD] Falha ao iniciar o download da imagem:', e);
  emit('error', e?.message || 'Erro desconhecido ao gerar o arquivo de download.');
 } finally {
    // ESSENCIAL: Garante que a URL temporária é revogada em qualquer cenário (sucesso ou falha)
    if (dataURL) {
        URL.revokeObjectURL(dataURL);
    }
 }
};


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

defineExpose({
  downloadEditedImage
})
</script>