// /components/Shared/AnnotationViewer.vue - V1.35 - CORREÇÃO CRÍTICA: Adicionado suporte para o formato de anotação Polyline (traços/pontos) que é o formato real vindo do DB.

<template>
  <div ref="viewerRef" class="relative overflow-hidden cursor-crosshair fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
  
    <div ref="imageCanvasWrapperRef" class="relative max-w-full max-h-full">
  
      <img 
    ref="imageRef"
    :src="imageUrl"
    @load="handleImageLoad"
    @mousedown="startDrawing"
    @mousemove="draw"
    @mouseup="stopDrawing"
    class="object-contain max-w-full max-h-full block" 
    :class="{'opacity-0': !isLoaded}"
    style="pointer-events: none;"
    alt="Imagem de Avaliação"
   />

      <canvas
    ref="canvasRef"
    class="absolute top-0 left-0"
    :width="canvasWidth" 
    :height="canvasHeight" 
    :style="canvasStyle" 
   ></canvas>
  </div>

    <div v-if="!isLoaded" class="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
   <i class="fas fa-spinner fa-spin mr-2"></i> Carregando Imagem...
  </div>
 </div>
</template>

<script setup>
// /components/Shared/AnnotationViewer.vue - V1.35
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
 imageUrl: { type: String, required: true },
 annotationDataJson: { type: [String, Object, null], default: null },
 isViewerVisible: { type: Boolean, default: true },
})

// Refs
const imageRef = ref(null)
const canvasRef = ref(null)
const viewerRef = ref(null)
const imageCanvasWrapperRef = ref(null) 
const isLoaded = ref(false)

// Dimensões do canvas (atributos) -> Dimensões naturais
const canvasWidth = ref(0)
const canvasHeight = ref(0)

// Dimensões naturais da imagem
let naturalWidth = 0
let naturalHeight = 0

// Desenho
const drawing = ref(false)
const annotations = ref([])
const currentAnnotation = ref(null)

let resizeObserver = null

// ----------------------------
// Estilo CSS: Canvas dimensionado via CSS para coincidir com a Imagem renderizada
// ----------------------------
const canvasStyle = computed(() => {
 if (!imageRef.value || !imageCanvasWrapperRef.value) return {};
 
 const img = imageRef.value;
 const w = img.clientWidth;
 const h = img.clientHeight;
 
 const wrapperW = imageCanvasWrapperRef.value.clientWidth;
 const wrapperH = imageCanvasWrapperRef.value.clientHeight;
 const leftOffset = (wrapperW - w) / 2;
 const topOffset = (wrapperH - h) / 2;
 
 return {
  width: `${w}px`,
  height: `${h}px`,
  // Reposicionamento para centralizar sobre a imagem renderizada
  transform: `translate(${leftOffset}px, ${topOffset}px)`
 };
});


// ----------------------------
// Desenha as anotações no canvas
// ----------------------------
const drawAnnotations = () => {
 const canvas = canvasRef.value
 if (!canvas || !naturalWidth || canvasWidth.value === 0) return

 const ctx = canvas.getContext('2d')
 ctx.clearRect(0, 0, canvas.width, canvas.height)

 // Escala: Coordenada natural (armazenada) para a dimensão do CANVAS (atributos)
 const scaleX = canvas.width / naturalWidth
 const scaleY = canvas.height / naturalHeight
 
 
 if (annotations.value.length > 0) {
  console.log(`DEBUG (V1.35) - Tentando desenhar ${annotations.value.length} anotações.`)
 }

 annotations.value.forEach((ann, index) => {
  // 🛑 NOVO: Desenho de Traços/Linhas (Formato do DB)
  if (Array.isArray(ann.points) && ann.points.length > 1) {
   
   ctx.beginPath()
   ctx.strokeStyle = ann.color || 'yellow' // Usa a cor do DB ou fallback
   ctx.lineWidth = ann.size || 4 // Usa o tamanho do DB ou fallback (para visibilidade)
   
   // Move para o primeiro ponto
   let startPoint = ann.points[0]
   ctx.moveTo(startPoint.x * scaleX, startPoint.y * scaleY)
   
   // Desenha a linha para cada ponto subsequente
   for (let i = 1; i < ann.points.length; i++) {
    let nextPoint = ann.points[i]
    ctx.lineTo(nextPoint.x * scaleX, nextPoint.y * scaleY)
   }
   
   ctx.stroke()
   
   console.log(`DEBUG (V1.35) - Anotação ${index} desenhada (Polyline com ${ann.points.length} pontos).`)

  } else if (ann.type === 'rect' && ann.endX != null) {
   // 🟢 V1.33: Desenho de Retângulo (Mantido para compatibilidade futura)
   ctx.strokeStyle = 'yellow' 
   ctx.lineWidth = 4 
   
   const x = ann.startX * scaleX
   const y = ann.startY * scaleY
   const w = (ann.endX - ann.startX) * scaleX
   const h = (ann.endY - ann.startY) * scaleY
   
   console.log(`DEBUG (V1.35) - Anotação ${index} - Drawn Rect Coords: X:${x.toFixed(2)}, Y:${y.toFixed(2)}, W:${w.toFixed(2)}, H:${h.toFixed(2)}`)

   if (Math.abs(w) > 0 && Math.abs(h) > 0) {
    ctx.strokeRect(x, y, w, h)
   } else {
    console.log(`DEBUG (V1.35) - Anotação ${index} ignorada (dimensão zero).`);
   }
  }
 })

 // Desenho temporário (Cor diferente)
 if (currentAnnotation.value && currentAnnotation.value.endX != null) {
  ctx.strokeStyle = 'blue'
  ctx.lineWidth = 2
  const ann = currentAnnotation.value
  const x = ann.startX * scaleX
  const y = ann.startY * scaleY
  const w = (ann.endX - ann.startX) * scaleX
  const h = (ann.endY - ann.startY) * scaleY
  ctx.strokeRect(x, y, w, h)
 }
}

// ----------------------------
// Atualiza dimensões do canvas (para dimensões naturais)
// ----------------------------
const updateCanvasDimensions = () => {
if (!imageRef.value || !naturalWidth) return

// Canvas Attributes = Dimensões Naturais (1:1 com os dados)
canvasWidth.value = naturalWidth 
canvasHeight.value = naturalHeight

drawAnnotations()
}

// ----------------------------
// ResizeObserver (Observa o wrapper para reposicionamento do Canvas)
// ----------------------------
const setupResizeObserver = () => {
if (process.client && imageCanvasWrapperRef.value && !resizeObserver) {
 resizeObserver = new ResizeObserver(() => {
 drawAnnotations() 
 })
 resizeObserver.observe(imageCanvasWrapperRef.value)
 console.log("DEBUG (V1.35) - ResizeObserver iniciado.")
}
}

const cleanupResizeObserver = () => {
if (resizeObserver) {
 resizeObserver.disconnect()
 resizeObserver = null
}
}

// ----------------------------
// Handle image load
// ----------------------------
const handleImageLoad = async () => {
if (!imageRef.value) return
isLoaded.value = true
naturalWidth = imageRef.value.naturalWidth || 0
naturalHeight = imageRef.value.naturalHeight || 0
console.log(`DEBUG (V1.35) - Image Loaded. Natural W: ${naturalWidth}, Natural H: ${naturalHeight}`)

await nextTick()
updateCanvasDimensions() 
setupResizeObserver()
// Força um redesenho após a inicialização do Canvas e do estilo.
await nextTick()
drawAnnotations()
}

// ----------------------------
// Coordenadas relativas no canvas
// ----------------------------
const getCoords = (event) => {
const canvas = canvasRef.value
if (!canvas) return { x: 0, y: 0 }

const imgRect = imageRef.value.getBoundingClientRect()
const clientX = event.clientX ?? event.touches?.[0]?.clientX
const clientY = event.clientY ?? event.touches?.[0]?.clientY

const scaleX = naturalWidth / imgRect.width
const scaleY = naturalHeight / imgRect.height

const x = (clientX - imgRect.left) * scaleX
const y = (clientY - imgRect.top) * scaleY

return { x, y }
}

// ----------------------------
// Lógica de Desenho (Mantida, mas não é o foco do DB)
// ----------------------------
const startDrawing = (event) => {
if (event.button !== undefined && event.button !== 0 && !event.touches) return
drawing.value = true
const { x, y } = getCoords(event)
// 💡 Nota: o formato do DB (polyline) não se alinha ao formato de desenho de retângulo (startX/endX)
// Se você for implementar o desenho de linha livre, este formato precisa mudar.
currentAnnotation.value = { type: 'rect', startX: x, startY: y, endX: x, endY: y }
}

const draw = (event) => {
if (!drawing.value) return
const { x, y } = getCoords(event)
if (!currentAnnotation.value) return
currentAnnotation.value.endX = x
currentAnnotation.value.endY = y
drawAnnotations()
}

const stopDrawing = () => {
if (!drawing.value || !currentAnnotation.value) return
const ann = currentAnnotation.value
if (Math.abs(ann.startX - ann.endX) > 5 && Math.abs(ann.startY - ann.endY) > 5) {
 // Atualmente, ele salva no formato rect, mas o DB guarda polyline. Isso é um potencial bug futuro.
 annotations.value.push(ann)
}
currentAnnotation.value = null
drawing.value = false
drawAnnotations()
}

watch(() => props.isViewerVisible, async (isVisible) => {
if (isVisible) {
 await nextTick()
 await nextTick()
 setupResizeObserver()
 if (naturalWidth > 0) updateCanvasDimensions() 
} else {
 canvasWidth.value = 0
 canvasHeight.value = 0
 const ctx = canvasRef.value?.getContext('2d')
 if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
 cleanupResizeObserver()
}
}, { immediate: true })

// ----------------------------
// Montagem do componente (Utiliza lógica V1.32)
// ----------------------------
onMounted(() => {
let parsed = null;

if (props.annotationDataJson) {
 try {
 parsed = typeof props.annotationDataJson === 'string' && props.annotationDataJson.trim() !== ''
  ? JSON.parse(props.annotationDataJson)
  : props.annotationDataJson
 } catch (e) {
 console.error('ERRO (V1.35) - Falha ao fazer parse do annotationDataJson:', e);
 parsed = null; 
 }
 
 // CORREÇÃO V1.32/1.35: Se for um objeto com a propriedade 'drawings' que é um array, use-o.
 if (parsed && typeof parsed === 'object' && Array.isArray(parsed.drawings) && parsed.drawings.length > 0) {
 annotations.value = parsed.drawings
 console.log(`DEBUG (V1.35) - Anotações carregadas (via drawings): ${annotations.value.length} itens.`)
 } 
 // Estrutura fallback: se for array diretamente
 else if (Array.isArray(parsed) && parsed.length > 0) {
 annotations.value = parsed
 console.log(`DEBUG (V1.35) - Anotações carregadas (array direto): ${annotations.value.length} itens.`)
 } 
 else {
 console.log(`DEBUG (V1.35) - annotationDataJson recebido, mas vazio ou estrutura inválida:`, parsed);
 }
} else {
 console.log('DEBUG (V1.35) - annotationDataJson é nulo/vazio.')
}

if (isLoaded.value) drawAnnotations();
})

onUnmounted(cleanupResizeObserver)
</script>