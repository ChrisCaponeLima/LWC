// /components/Shared/AnnotationEditor.vue - V2.4 - CORREÇÃO DE LAYOUT: Adicionada div wrapper para centralizar o conteúdo e ajustadas classes da tag <img> para priorizar a largura total no modal.
<template>
<div 
ref="editorContainerRef"
class="relative w-full h-full overflow-hidden" 
:style="{ 
// REMOVIDO: width e height fixos. Agora usa w-full h-full do container pai (o Modal).
'max-width': '100%',
}"
@mousedown="startAction"
@mousemove="performAction"
@mouseup="endAction"
@mouseleave="endAction"
@click="handleTextPlacement" 
>
<div 
 class="w-full h-full flex items-center justify-center relative"
 :style="{
  'max-width': editorDimensions.width > 0 ? `${editorDimensions.width}px` : '100%',
  'max-height': editorDimensions.height > 0 ? `${editorDimensions.height}px` : '100%',
  'margin': '0 auto' 
 }"
>
 <img 
 ref="imageRef"
 :src="imageUrl" 
 alt="Imagem para Anotação" 
 @load="handleImageLoad"
 
  class="block w-full h-auto max-h-full object-contain pointer-events-none" 
  /> <svg 
 v-if="imageLoaded && editorDimensions.width > 0"
 :width="editorDimensions.width" 
 :height="editorDimensions.height" 
 class="absolute top-0 left-0"
 >
 <g v-for="(drawing, index) in localAnnotations.drawings" :key="`saved-draw-${index}`">
  <polyline 
  :points="drawing.points.map(p => `${scalePoint(p).x},${scalePoint(p).y}`).join(' ')" 
  fill="none"
  :stroke="drawing.color || '#FF0000'" 
  :stroke-width="drawing.size * scaleFactor"
  stroke-linecap="round"
  stroke-linejoin="round"
  />
 </g>

 <polyline 
  v-if="isDrawing && currentDrawing.points.length > 1"
  :points="currentDrawing.points.map(p => `${scalePoint(p).x},${scalePoint(p).y}`).join(' ')" 
  fill="none"
  :stroke="currentDrawing.color || '#FF0000'" 
  :stroke-width="currentDrawing.size * scaleFactor"
  stroke-linecap="round"
  stroke-linejoin="round"
 />
 
 <g v-for="(text, index) in localAnnotations.texts" :key="`saved-text-${index}`">
  <text
  :x="scalePoint(text).x"
  :y="scalePoint(text).y"
  :fill="text.color || '#FFFF00'"
  :font-size="text.size * scaleFactor"
  font-weight="bold"
  text-anchor="middle"
  dominant-baseline="hanging"
  >
  {{ text.content }}
  </text>
 </g>
 </svg>
</div>
 <div 
v-if="textInputState.active" 
class="absolute p-1 bg-white border border-indigo-500 shadow-xl rounded z-10" 
:style="{ left: `${textInputState.x}px`, top: `${textInputState.y}px` }"
>
<input
 ref="textInputRef"
 v-model="textInputState.content"
 type="text"
 :style="{ color: textInputState.color, fontSize: `${textInputState.size}px` }"
 class="bg-transparent border-none focus:ring-0 focus:outline-none p-0 m-0"
 @keyup.enter="saveText"
 @blur="saveText"
 placeholder="Digite o texto..."
/>
</div>
</div>
</template>

<script setup lang="ts">
// /components/Shared/AnnotationEditor.vue - V2.4 - CORREÇÃO DE LAYOUT: Ajustado `template` para garantir que a imagem ocupe a largura máxima do contêiner e seja corretamente centralizada no modal.
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

// === Tipagem ===
interface Point { x: number; y: number; }
interface DrawingAnnotation { 
points: Point[]; 
color: string; 
size: number; 
}
interface TextAnnotation extends Point {
content: string;
color: string;
size: number;
}
interface AnnotationData {
drawings: DrawingAnnotation[];
texts: TextAnnotation[];
}
// === /Tipagem ===

const props = defineProps<{
imageUrl: string;
tool: 'pen' | 'text' | 'select'; 
penColor: string; 
penSize: number; 
textColor: string; 
textSize: number; 
initialAnnotationData: string | null;
}>();

const emit = defineEmits<{
(e: 'update:annotationData', data: string): void;
(e: 'imageLoaded', dimensions: { width: number, height: number }): void;
}>();

// --- Refs de Elementos e Estado ---
const imageRef = ref<HTMLImageElement | null>(null);
const editorContainerRef = ref<HTMLDivElement | null>(null);
const textInputRef = ref<HTMLInputElement | null>(null); 
const imageLoaded = ref(false);
const isDrawing = ref(false);
const localAnnotations = ref<AnnotationData>({ drawings: [], texts: [] });

const currentDrawing = ref<DrawingAnnotation>({ 
points: [], 
color: props.penColor, 
size: props.penSize 
});

const textInputState = ref({
active: false,
x: 0, 
y: 0,
content: '',
color: props.textColor,
size: props.textSize
});

// --- Dimensões e Escalas ---
const naturalDimensions = ref({ width: 0, height: 0 }); 
const editorDimensions = ref({ width: 0, height: 0 }); // Dimensões RENDERIZADAS
const scaleFactor = ref(1); 

// --- Funções de Persistência e Inicialização ---

const emitAnnotationData = () => {
const dataString = JSON.stringify(localAnnotations.value);
emit('update:annotationData', dataString);
}

const initializeAnnotations = (data: string | null) => {
if (data) {
try {
const parsed = JSON.parse(data);
localAnnotations.value = {
 drawings: parsed.drawings || [],
 texts: parsed.texts || [],
};
} catch (e) {
console.error('Erro ao inicializar anotações:', e);
localAnnotations.value = { drawings: [], texts: [] };
}
} else {
localAnnotations.value = { drawings: [], texts: [] };
}
}

const clearAnnotations = () => {
initializeAnnotations(null);
emitAnnotationData();
}

// --- Funções de Manipulação de Imagem e Escala ---

/**
* Tenta obter as dimensões renderizadas do elemento de imagem com polling.
*/
const waitForDimensions = (maxAttempts = 5, delay = 50) => {
return new Promise<void>((resolve) => {
 let attempts = 0;
 
 const check = () => {
 if (!imageRef.value) {
  return resolve();
 }

 // Usa o elemento de IMAGEM para obter suas dimensões RENDERIZADAS
 const renderedWidth = imageRef.value.clientWidth;
 const renderedHeight = imageRef.value.clientHeight;

 if (renderedWidth > 0 && renderedHeight > 0) {
  // Dimensões válidas encontradas!
  editorDimensions.value = { width: renderedWidth, height: renderedHeight };
  scaleFactor.value = naturalDimensions.value.width / editorDimensions.value.width;
  imageLoaded.value = true;
  emit('imageLoaded', editorDimensions.value);
  return resolve();
 }

 attempts++;
 if (attempts < maxAttempts) {
  setTimeout(check, delay);
 } else {
  console.warn('[AnnotationEditor] Falha ao obter dimensões após tentativas. Renderizando com fallback.');
  resolve();
 }
 };

 check();
});
}

const handleImageLoad = () => {
if (!imageRef.value || !imageRef.value.complete) return; 

// 1. Coleta as dimensões naturais (coordenadas de salvamento)
naturalDimensions.value = {
width: imageRef.value.naturalWidth,
height: imageRef.value.naturalHeight,
};

// 2. Tenta obter as dimensões renderizadas
nextTick(async () => {
 await waitForDimensions();
});
};

const updateDimensions = () => {
// Garante que as dimensões do editor e o scaleFactor são recalculados quando a tela muda de tamanho
if (imageRef.value && imageLoaded.value && naturalDimensions.value.width > 0) {
const newRenderedWidth = imageRef.value.clientWidth;
const newRenderedHeight = imageRef.value.clientHeight;

if (newRenderedWidth !== editorDimensions.value.width || newRenderedHeight !== editorDimensions.value.height) {
 editorDimensions.value = { width: newRenderedWidth, height: newRenderedHeight };
 scaleFactor.value = naturalDimensions.value.width / newRenderedWidth;
}
}
}

/**
* Converte um ponto da coordenada NATURAL (salva) para a coordenada RENDERIZADA (visualização).
*/
const scalePoint = (p: Point): Point => {
const inverseScale = 1 / scaleFactor.value;
return {
x: p.x * inverseScale,
y: p.y * inverseScale,
};
}

/**
* Converte um ponto da coordenada RENDERIZADA (mouse) para a coordenada NATURAL (salvamento).
*/
const normalizePoint = (p: Point): Point => {
return {
x: Math.round(p.x * scaleFactor.value),
y: Math.round(p.y * scaleFactor.value),
};
}

// --- Funções de Desenho e Coordenadas ---

const getCoordinates = (e: MouseEvent): Point | null => {
if (!editorContainerRef.value) return null;

// Obtem as coordenadas do mouse em relação ao wrapper da imagem/svg (não ao container total)
// Como o editorContainerRef agora contém o wrapper que centraliza, o rect deve ser do imageRef ou do seu parent para precisão.
// **USAR `editorContainerRef` É O CORRETO, POIS É ELE QUEM RECEBE OS EVENTOS DE MOUSE**

const rect = imageRef.value?.getBoundingClientRect();

if (!rect) return null;

// Corrige o cálculo para levar em conta a posição da imagem DENTRO do container
const x = e.clientX - rect.left;
const y = e.clientY - rect.top;

// Garante que o clique está DENTRO dos limites da imagem renderizada
if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
return null;
}

return { x, y };
}

const startAction = (e: MouseEvent) => {
if (!imageLoaded.value || props.tool !== 'pen') return;

// Salva texto se estiver ativo
if (textInputState.value.active) {
saveText();
return; 
}

const point = getCoordinates(e);
if (!point) return;

isDrawing.value = true;
currentDrawing.value = {
points: [normalizePoint(point)], // Salva coordenada normalizada
color: props.penColor,
size: props.penSize,
};
}

const performAction = (e: MouseEvent) => {
if (!isDrawing.value || props.tool !== 'pen') return;

const point = getCoordinates(e);
if (!point) return;

// Adiciona o ponto normalizado ao desenho atual
currentDrawing.value.points.push(normalizePoint(point)); 
}

const endAction = () => {
if (isDrawing.value && currentDrawing.value.points.length > 1) {
// Salva o desenho na coleção principal
localAnnotations.value.drawings.push(currentDrawing.value);

// Emite o JSON atualizado
emitAnnotationData();
}

isDrawing.value = false;
currentDrawing.value = { points: [], color: props.penColor, size: props.penSize }; // Reset
}

// --- Funções de Texto ---

const handleTextPlacement = (e: MouseEvent) => {
if (!imageLoaded.value || props.tool !== 'text') return;

// 1. Se o input já estiver ativo, verifica se o clique é para salvar
if (textInputState.value.active) {
 if (textInputRef.value && !textInputRef.value.contains(e.target as Node)) {
 saveText();
 } else {
 return; // Permite continuar a edição no input existente
 }
}

const clickPoint = getCoordinates(e);
if (!clickPoint) return; // Se o clique estiver fora da imagem, não faz nada

// 2. Ativa o input de texto na posição do clique
textInputState.value = {
 active: true,
 x: clickPoint.x, 
 y: clickPoint.y,
 content: '',
 color: props.textColor,
 size: props.textSize
};

// 3. Foca no input após a DOM ser atualizada
nextTick(() => {
 textInputRef.value?.focus();
});
}

const saveText = () => {
if (!textInputState.value.active) return;

const content = textInputState.value.content.trim();

// 1. Só salva se houver conteúdo
if (content) {
 // Normaliza a posição (converte para coordenada de salvamento)
 const normalizedPoint = normalizePoint({ 
 x: textInputState.value.x, 
 y: textInputState.value.y 
 });
 
 const newTextAnnotation: TextAnnotation = {
 x: normalizedPoint.x,
 y: normalizedPoint.y,
 content: content,
 color: textInputState.value.color,
 size: textInputState.value.size,
 };
 
 localAnnotations.value.texts.push(newTextAnnotation);
 emitAnnotationData();
}

// 2. Desativa e reseta o estado do input de texto
textInputState.value = { 
 active: false, 
 x: 0, 
 y: 0, 
 content: '',
 color: props.textColor,
 size: props.textSize
};
}


// Expõe a função de limpeza para que o componente pai possa chamá-la
defineExpose({
clearAnnotations
});

// --- Watchers e Lifecycle ---

// Inicializa anotações ao carregar o componente ou ao mudar o dado inicial
watch(() => props.initialAnnotationData, initializeAnnotations, { immediate: true });

// Reinicia o estado ao mudar a imagem
watch(() => props.imageUrl, (newUrl) => {
imageLoaded.value = false;
initializeAnnotations(null); 

// Tenta obter as dimensões imediatamente se o URL for válido
if (newUrl) {
 nextTick(() => {
 if (imageRef.value) {
    imageRef.value.src = newUrl; 
  if (imageRef.value.complete) {
  handleImageLoad(); 
  }
 }
 });
}

}, { immediate: true });

// Atualiza a cor e tamanho do pincel/texto se as props mudarem
watch([() => props.penColor, () => props.penSize, () => props.textColor, () => props.textSize], () => {
currentDrawing.value.color = props.penColor;
currentDrawing.value.size = props.penSize;
textInputState.value.color = props.textColor;
textInputState.value.size = props.textSize;
});

// Ouve o redimensionamento da janela para atualizar as dimensões de visualização
onMounted(() => {
window.addEventListener('resize', updateDimensions);
});

onBeforeUnmount(() => {
window.removeEventListener('resize', updateDimensions);
});
</script>