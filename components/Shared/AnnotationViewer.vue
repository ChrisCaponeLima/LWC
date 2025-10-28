// /components/Shared/SharedAnnotationViewer.vue - V1.0 - Componente de Visualização Somente Leitura
<template>
    <div 
        ref="viewerContainerRef"
        class="relative w-full overflow-hidden" 
        :style="{ 
            width: `${viewerDimensions.width}px`,
            height: `${viewerDimensions.height}px`,
        }"
    >
        <img 
            ref="imageRef"
            :src="imageUrl" 
            alt="Foto de Avaliação" 
            @load="handleImageLoad"
            class="block w-full h-auto object-contain pointer-events-none"
        />

        <svg 
            v-if="imageLoaded"
            :width="viewerDimensions.width" 
            :height="viewerDimensions.height" 
            class="absolute top-0 left-0"
        >
            <g v-for="(drawing, index) in localAnnotations.drawings" :key="`saved-draw-${index}`">
                <polyline 
                    :points="drawing.points.map(p => `${scalePoint(p).x},${scalePoint(p).y}`).join(' ')" 
                    fill="none"
                    :stroke="drawing.color || '#FF0000'" 
                    :stroke-width="(drawing.size || 15) * inverseScaleFactor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </g>
            
            <g v-for="(text, index) in localAnnotations.texts" :key="`saved-text-${index}`">
                <text
                    :x="scalePoint(text).x"
                    :y="scalePoint(text).y"
                    :fill="text.color || '#FFFF00'"
                    :font-size="(text.size || 30) * inverseScaleFactor"
                    font-weight="bold"
                    text-anchor="middle"
                    dominant-baseline="hanging"
                >
                    {{ text.content }}
                </text>
            </g>
        </svg>

    </div>
</template>

<script setup lang="ts">
// /components/Shared/SharedAnnotationViewer.vue - V1.0 - Componente de Visualização Somente Leitura
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
    annotationDataJson: string | null; // Dados JSON COMPLETO para visualização
}>();

// --- Refs de Elementos e Estado ---
const imageRef = ref<HTMLImageElement | null>(null);
const imageLoaded = ref(false);
const localAnnotations = ref<AnnotationData>({ drawings: [], texts: [] });

// --- Dimensões e Escalas ---
const naturalDimensions = ref({ width: 0, height: 0 }); // Dimensões originais (salvas)
const viewerDimensions = ref({ width: 0, height: 0 }); // Dimensões atuais renderizadas

// Fator de escala inverso: (largura_renderizada / largura_original). Usado para calcular o tamanho visual.
const inverseScaleFactor = ref(1); 

// --- Funções de Manipulação de Imagem e Escala ---

const handleImageLoad = () => {
    if (!imageRef.value) return;

    imageLoaded.value = true;
    
    // 1. Coleta as dimensões naturais (coordenadas de salvamento)
    naturalDimensions.value = {
        width: imageRef.value.naturalWidth,
        height: imageRef.value.naturalHeight,
    };
    
    // 2. Coleta as dimensões renderizadas (tamanho do viewer/SVG)
    nextTick(() => {
        if (imageRef.value) {
            viewerDimensions.value = {
                width: imageRef.value.clientWidth,
                height: imageRef.value.clientHeight,
            };

            // Calcula o fator de escala inverso (Renderizado / Natural)
            inverseScaleFactor.value = viewerDimensions.value.width / naturalDimensions.value.width;
        }
    });
};

const updateDimensions = () => {
    if (imageRef.value && imageLoaded.value) {
        viewerDimensions.value = {
            width: imageRef.value.clientWidth,
            height: imageRef.value.clientHeight,
        };
        // Recalcula o fator de escala inverso
        inverseScaleFactor.value = viewerDimensions.value.width / naturalDimensions.value.width;
    }
}

/**
 * Converte um ponto da coordenada NATURAL (salva) para a coordenada RENDERIZADA (visualização).
 * NOTA: Multiplica-se pela escala inversa.
 */
const scalePoint = (p: Point): Point => {
    return {
        x: p.x * inverseScaleFactor.value,
        y: p.y * inverseScaleFactor.value,
    };
}

// --- Funções de Persistência e Inicialização ---

const initializeAnnotations = (data: string | null) => {
    if (data) {
        try {
            const parsed = JSON.parse(data);
            localAnnotations.value = {
                drawings: parsed.drawings || [],
                texts: parsed.texts || [],
            };
        } catch (e) {
            console.error('Erro ao inicializar anotações para visualização:', e);
            localAnnotations.value = { drawings: [], texts: [] };
        }
    } else {
        localAnnotations.value = { drawings: [], texts: [] };
    }
}

// --- Watchers e Lifecycle ---

// Inicializa anotações ao carregar o componente ou ao mudar o dado
watch(() => props.annotationDataJson, initializeAnnotations, { immediate: true });

// Reinicia o estado ao mudar a imagem
watch(() => props.imageUrl, () => {
    imageLoaded.value = false;
    initializeAnnotations(null);
}, { immediate: true });


// Ouve o redimensionamento da janela para atualizar as dimensões de visualização
onMounted(() => {
    window.addEventListener('resize', updateDimensions);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateDimensions);
});
</script>