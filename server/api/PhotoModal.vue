// /components/PhotoModal.vue - V1.0 - Componente de Modal para Visualização de Fotos
<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" @click.self="closeModal">
    <div class="relative max-w-4xl max-h-[90vh] p-4">
      <button 
        @click="closeModal" 
        class="absolute top-4 right-4 text-white text-3xl font-bold opacity-70 hover:opacity-100 transition-opacity z-10"
        aria-label="Fechar"
      >
        &times;
      </button>

      <img :src="photoUrl" :alt="altText" class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />

      <div v-if="recordDate" class="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg text-sm font-semibold">
        {{ recordDate }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  photoUrl: {
    type: String,
    required: true,
  },
  recordDate: {
    type: String, // Data formatada
    default: null,
  },
  altText: {
    type: String,
    default: 'Foto de Evolução',
  }
});

const emit = defineEmits(['close']);

const closeModal = () => {
  emit('close');
};

// Fechar com a tecla ESC
onMounted(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && props.isOpen) {
      closeModal();
    }
  };
  document.addEventListener('keydown', handleEscape);
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleEscape);
  });
});
</script>