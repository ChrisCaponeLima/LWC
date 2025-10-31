// /components/Global/PhotoViewer.vue - V1.0 - Componente de visualização de imagem em tela cheia (lightbox).
<template>
  <Transition name="fade">
    <div 
      v-if="isVisible" 
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-95 p-4 cursor-zoom-out"
      @click="closeViewer"
    >
      <div 
        class="max-w-full max-h-full transition-all duration-300 transform"
        @click.stop
      >
        <img 
          :src="imageUrl" 
          :alt="altText" 
          class="block max-w-full max-h-screen object-contain shadow-2xl rounded-lg"
          @click="closeViewer"
        >
      </div>

      <button 
        @click="closeViewer" 
        class="absolute top-4 right-4 text-white hover:text-red-400 p-2 rounded-full transition duration-150"
        aria-label="Fechar visualizador de fotos"
      >
        <i class="fas fa-times text-2xl"></i>
      </button>

      <div v-if="altText" class="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm md:text-base px-10">
        {{ altText }}
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

interface Props {
  imageUrl: string | null;
  altText?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

const isVisible = ref(false);

watch(() => props.imageUrl, (newUrl) => {
  if (newUrl) {
    isVisible.value = true;
    // Bloqueia o scroll do body quando o modal está aberto
    if (process.client) {
      document.body.classList.add('overflow-hidden');
    }
  } else {
    isVisible.value = false;
    if (process.client) {
      document.body.classList.remove('overflow-hidden');
    }
  }
}, { immediate: true });

const closeViewer = () => {
  emit('close');
};

// Fechar com a tecla ESC
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isVisible.value) {
    closeViewer();
  }
};

onMounted(() => {
  if (process.client) {
    window.addEventListener('keydown', handleKeydown);
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('keydown', handleKeydown);
    // Garante que o scroll seja liberado, caso o componente seja destruído
    document.body.classList.remove('overflow-hidden');
  }
});
</script>

<style scoped>
/* Transição simples de opacidade (fade) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>