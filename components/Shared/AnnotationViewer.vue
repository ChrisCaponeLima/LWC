// /components/Shared/AnnotationViewer.vue - V1.0 - Componente de visualização de foto e anotações JSON
<template>
  <div class="relative w-full overflow-hidden inline-block" ref="containerRef">
    <img 
      :src="imageUrl" 
      alt="Foto com Anotações" 
      class="w-full h-auto object-contain block"
      @load="calculateScale"
      ref="imageRef"
    />

    <svg 
      v-if="parsedData && parsedData.lines"
      :viewBox="`0 0 ${imageDimensions.naturalWidth} ${imageDimensions.naturalHeight}`"
      :style="svgStyle"
      class="absolute top-0 left-0 w-full h-full pointer-events-none"
    >
      <template v-for="(line, index) in parsedData.lines" :key="`line-${index}`">
        <line
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          :stroke="line.color || '#FF0000'"
          :stroke-width="line.width || 5"
          stroke-linecap="round"
        />
      </template>
      
      <template v-for="(text, index) in parsedData.texts" :key="`text-${index}`">
        <text
          :x="text.position.x"
          :y="text.position.y"
          :fill="text.color || '#FFFF00'"
          :font-size="text.size || 30"
          :font-weight="'bold'"
          text-anchor="middle"
        >
          {{ text.content }}
        </text>
      </template>
      
      </svg>
    
    <div v-else-if="imageUrl && hasAnnotation" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 text-white text-lg font-bold">
        <i class="fas fa-pencil-alt mr-2"></i> Anotações presentes, mas não renderizadas.
    </div>
  </div>
</template>

<script setup>
// /components/Shared/AnnotationViewer.vue - V1.0 - Componente de visualização de foto e anotações JSON

import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  imageUrl: { type: String, required: true },
  annotationData: { type: String, default: null } // String JSON com os dados do desenho
})

const imageRef = ref(null)
const containerRef = ref(null)
const parsedData = ref(null)
const imageDimensions = ref({
    naturalWidth: 0,
    naturalHeight: 0,
    clientWidth: 0,
    clientHeight: 0,
})

// Estilo do SVG para garantir que ele se sobreponha e cubra exatamente a área da imagem.
const svgStyle = computed(() => {
    // Definimos explicitamente o tamanho do SVG com base na imagem de fundo, mas o viewBox 
    // garante que as coordenadas do desenho (baseadas no tamanho natural) sejam escaladas corretamente.
    return {
        width: `${imageDimensions.clientWidth}px`,
        height: `${imageDimensions.clientHeight}px`,
    };
});

const hasAnnotation = computed(() => {
    return !!props.annotationData && props.annotationData.trim() !== '';
});

// --- Funções de Lógica ---

const parseAnnotationData = (data) => {
    if (!data) {
        parsedData.value = null
        return
    }
    try {
        // Tentativa de parsear o JSON
        const json = JSON.parse(data)
        // Normaliza a estrutura para garantir que as propriedades esperadas existam
        parsedData.value = {
            version: json.version || '1.0',
            lines: Array.isArray(json.lines) ? json.lines : [],
            texts: Array.isArray(json.texts) ? json.texts : [],
            // Adicione outras coleções aqui (circles, boxes, etc.)
        }
    } catch (e) {
        console.error('Falha ao analisar JSON de anotação:', e)
        parsedData.value = null
    }
}

const calculateScale = () => {
    if (imageRef.value) {
        // Armazena as dimensões da imagem para configurar o SVG viewBox
        imageDimensions.value.naturalWidth = imageRef.value.naturalWidth
        imageDimensions.value.naturalHeight = imageRef.value.naturalHeight
        
        // Armazena as dimensões renderizadas (clientWidth/Height)
        imageDimensions.value.clientWidth = imageRef.value.clientWidth
        imageDimensions.value.clientHeight = imageRef.value.clientHeight
    }
}

// Recalcular em caso de redimensionamento da janela (debounce é recomendado em produção)
onMounted(() => {
    window.addEventListener('resize', calculateScale)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', calculateScale)
})


// Observar a mudança nos dados da anotação
watch(() => props.annotationData, (newVal) => {
    parseAnnotationData(newVal)
}, { immediate: true })

// Observar a URL da imagem para garantir que o cálculo da escala seja feito após o carregamento da imagem
watch(() => props.imageUrl, () => {
    // Força o recálculo após o DOM ser atualizado (nextTick) e a imagem carregar (evento @load no template)
    nextTick(() => {
        if (imageRef.value && imageRef.value.complete) {
            calculateScale();
        }
    });
});
</script>