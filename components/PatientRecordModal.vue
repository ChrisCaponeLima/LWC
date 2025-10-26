// /components/PatientRecordModal.vue - V1.1 - CORREÇÃO: Adicionando a prop patientName e repassando para DataFormV2.

<template>
<div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closeModal">
  <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
    
    <div class="sticky top-0 bg-white p-6 border-b flex justify-between items-center z-10">
      <h3 class="text-2xl font-bold text-green-700">
        <i class="fas fa-chart-line mr-2"></i> Novo Registro de Acompanhamento
      </h3>
      <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition">
        <i class="fas fa-times text-2xl"></i>
      </button>
    </div>

    <div class="p-6"> 
      <DataFormV2 
        v-if="userId"
        :user-id="userId"
                :patient-name="patientName"         @record-saved="handleRecordSaved"
        @cancel="closeModal"
        @open-image-editor="openImageEditor"
      />
      <div v-else class="text-center p-8 text-red-500">
        <p>Erro: ID do paciente não fornecido para o novo registro.</p>
      </div>
    </div>

  </div>
  
  <div v-if="isImageEditorOpen">
    </div>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DataFormV2 from './DataFormV2.vue'; 

// --- PROPS ---
const props = defineProps<{
  isOpen: boolean;
  userId: number | null | undefined; // O ID do paciente selecionado
    patientName: string; // CORRIGIDO: Propriedade adicionada para receber o nome do paciente
}>();

// --- EMITS ---
const emit = defineEmits(['close', 'recordSaved']);

// --- ESTADO ---
const isImageEditorOpen = ref(false);

// --- MÉTODOS ---
const closeModal = () => {
  // Certifica-se de que o ImageEditor está fechado ao fechar o modal principal
  isImageEditorOpen.value = false;
  emit('close');
};

const handleRecordSaved = () => {
  // Propaga o evento de sucesso para o componente pai (user_search.vue)
  emit('recordSaved'); 
};

const openImageEditor = () => {
  // Método que abre o modal/interface de edição de imagens
  // NOTA: A lógica real do editor de imagens (ImageEditor Component) não está aqui.
  // Estamos apenas simulando a abertura.
  isImageEditorOpen.value = true;
  console.log('Aberto editor de imagem para arquivos temporários.');
};
</script>