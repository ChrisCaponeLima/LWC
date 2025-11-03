// /components/UserTreatmentGalleryWrapper.vue - V1.1 - CORREÇÃO CRÍTICA: Ajuste do endpoint da API e implementação da lógica de agrupamento das fotos do paciente por tratamento.
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

// 🚨 Interface do retorno do Backend (/api/professional/user/[id]/photos)
interface BackendPhoto {
 id: number;
 url: string;
 createdAt: string;
 description: string | null;
 consideration: string | null;
 associatedTreatment: {
  userTreatmentId: number; 
  name: string;
 } | null;
}

// Interfaces (baseadas na estrutura esperada pela API e pelo TreatmentGallery.vue)
interface TreatmentPhoto {
 id: number;
 url: string;
 date: string;
 description: string | null;
 isPrivate: boolean; // Usado para indicar se é uma foto de 'consideration' (privada)
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
 * Função utilitária para agrupar fotos por tratamento.
 * Garante as chaves 'name' e 'treatmentId' de acordo com o TreatmentGallery.
 * @param {Array<BackendPhoto>} photos - Array de fotos do Backend.
 * @returns {Array<TreatmentGroup>} Array de grupos formatado.
 */
const groupPhotosByTreatment = (photos: BackendPhoto[]): TreatmentGroup[] => {
const groups: { [key: number | string]: TreatmentGroup } = {};
const defaultGroupName = 'Fotos Gerais (Sem Tratamento Associado)';
const defaultGroupId = 'GENERAL';

photos.forEach(photo => {
 // Determina o ID e Nome do Grupo
 const groupId = photo.associatedTreatment?.userTreatmentId ?? defaultGroupId;
 const groupName = photo.associatedTreatment?.name ?? defaultGroupName;
 
 // Cria o grupo se não existir
 if (!groups[groupId]) {
  groups[groupId] = {
   name: groupName,
   treatmentId: photo.associatedTreatment?.userTreatmentId ?? 0, // 0 para o grupo geral
   photos: []
  };
 }

 // Mapeia a foto para a estrutura de Frontend (TreatmentPhoto)
 groups[groupId].photos.push({
   id: photo.id,
   url: photo.url,
   date: photo.createdAt, 
   // Usa a description ou consideration, o campo consideration geralmente indica que é privado
   description: photo.description || photo.consideration, 
   // Assumimos que a presença de 'consideration' indica uma foto privada/interna
   isPrivate: !!photo.consideration, 
 });
});

// Converte o objeto de grupos em um array
return Object.values(groups);
};


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
  // ✅ CORREÇÃO: Utiliza o endpoint correto para a busca de fotos do paciente por profissionais.
  // Estava: /api/treatments/${userId}/galleries
  // Deve ser: /api/professional/user/${userId}/photos (conforme rota do Backend)
  const response = await $fetch(`/api/professional/user/${userId}/photos`, {
   baseURL: config.public.apiBaseUrl,
   method: 'GET',
   headers: { Authorization: `Bearer ${token}` }
  });

  // ✅ Implementa a lógica de agrupamento
  const rawPhotos = response.photos as BackendPhoto[] || [];
  groupedTreatmentPhotos.value = groupPhotosByTreatment(rawPhotos);
  
 } catch (e) {
  console.error('Erro ao buscar fotos do paciente (V1.1):', e);
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