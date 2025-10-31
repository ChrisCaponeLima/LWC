// /components/UserTreatmentGalleryWrapper.vue - V1.0 - Criação do wrapper para buscar e exibir galerias de tratamento do paciente, utilizando TreatmentGallery para visualização.
<template>
  <div class="mt-6">
    <h5 class="text-md font-semibold mb-2 pt-4 border-t text-gray-700">Galerias de Tratamentos do Paciente</h5>

    <div v-if="isLoading" class="text-center p-4">
      <i class="fas fa-spinner fa-spin text-xl text-indigo-500"></i>
      <p class="text-indigo-500 mt-2 text-sm">Carregando galerias...</p>
    </div>

    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
      <strong class="font-bold">Erro:</strong>
      <span class="block sm:inline"> Falha ao carregar galerias: {{ error }}</span>
    </div>

    <TreatmentGallery 
      v-else-if="groupedTreatmentPhotos.length > 0"
      :grouped-treatment-photos="groupedTreatmentPhotos" 
    />
    
    <p v-else class="text-gray-500 text-sm p-2 text-center border rounded-md">
      Este paciente não possui tratamentos ou galerias de fotos de tratamento cadastradas.
    </p>

  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRuntimeConfig } from '#app';
// Importa o componente TreatmentGallery (V1.8) do usuário para a renderização
import TreatmentGallery from '~/components/TreatmentGallery.vue'; 

// Interfaces (baseadas na estrutura esperada pela API e pelo TreatmentGallery.vue)
interface TreatmentPhoto {
  id: number;
  url: string;
  date: string;
  description: string | null;
  isPrivate: boolean;
}

interface TreatmentGroup {
  name: string;
  treatmentId: number;
  photos: TreatmentPhoto[];
}

const props = defineProps<{
  userId: number;
}>();

const authStore = useAuthStore();
const config = useRuntimeConfig();
const groupedTreatmentPhotos = ref<TreatmentGroup[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

/**
 * Busca os dados das galerias de tratamento do paciente.
 * @param {number} userId - O ID do paciente.
 */
const fetchTreatmentGalleries = async (userId: number) => {
  isLoading.value = true;
  error.value = null;
  groupedTreatmentPhotos.value = [];

  const token = authStore.token;
  if (!token) {
    error.value = "Token de autenticação ausente.";
    isLoading.value = false;
    return;
  }

  try {
    // 🚨 Endpoint presumido: Busca galerias de tratamento agrupadas
    const response = await $fetch(`/api/treatments/${userId}/galleries`, {
      baseURL: config.public.apiBaseUrl,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });

    groupedTreatmentPhotos.value = response as TreatmentGroup[];
  } catch (e) {
    console.error('Erro ao buscar galerias de tratamento:', e);
    // Captura e formata a mensagem de erro da API
    error.value = (e as any)?.data?.statusMessage || (e as any)?.message || 'Falha desconhecida ao carregar galerias.';
  } finally {
    isLoading.value = false;
  }
};

// Monitora a mudança do userId (quando um novo paciente é selecionado)
watch(() => props.userId, (newId) => {
  if (newId) {
    fetchTreatmentGalleries(newId);
  }
}, { immediate: true });
</script>