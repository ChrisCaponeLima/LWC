// /components/Treatments/PhotoGallery.vue - V2.8 - Remoção do título de comparação e ajuste do botão de toggle.
<template>
<div class="space-y-6">
<h3 class="text-xl font-bold text-gray-800 flex items-center mb-4">
<i class="fas fa-images mr-2 text-indigo-600"></i> Galeria de Avaliações ({{ photos.length }} fotos)
</h3>

<div v-if="isLoading" class="flex justify-center items-center h-48">
<i class="fas fa-spinner fa-spin fa-2x text-indigo-600"></i>
<p class="ml-3 text-lg text-gray-600">Buscando fotos...</p>
</div>

<div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
<strong class="font-bold">Erro:</strong>
<span class="block sm:inline"> {{ error }}</span>
</div>

<div v-else-if="photos.length === 0" class="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4">
<p class="font-medium"><i class="fas fa-info-circle mr-2"></i> Este paciente ainda não possui fotos de avaliação.</p>
</div>

<div v-if="photos.length > 1" class="bg-white p-6 rounded-lg shadow-lg border">
<div class="flex justify-end items-center mb-4"> 
<button 
@click="isCompareVisible = !isCompareVisible"
class="px-4 py-2 text-sm font-medium rounded-md transition"
:class="isCompareVisible ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'"
>
<i :class="isCompareVisible ? 'fas fa-eye-slash' : 'fas fa-eye'" class="mr-2"></i>
{{ isCompareVisible ? 'Fechar Comparação' : 'Abrir Comparação' }}
</button>
</div>

<div v-if="isCompareVisible">
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
<div>
<label class="block text-sm font-medium text-gray-700">Foto 1 (Antes):</label>
<select v-model="selectedPhotoAId" class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm sm:text-sm">
<option :value="null">Selecione a primeira foto</option>
<option v-for="photo in photos" 
:key="`A-${photo.id}`" 
:value="photo.id" 
:disabled="selectedPhotoBId === photo.id">
[{{ formatDateTime(photo.createdAt) }}] - {{ photo.photoType }}
</option>
</select>
</div>

<div>
<label class="block text-sm font-medium text-gray-700">Foto 2 (Depois):</label>
<select v-model="selectedPhotoBId" 
:disabled="!photoA"
class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm sm:text-sm"
:class="{'bg-gray-100 cursor-not-allowed': !photoA}">
<option :value="null">
{{ photoA ? `Selecione a segunda foto (${photoA.photoType})` : 'Selecione a Foto 1 primeiro' }}
</option>
<option v-for="photo in filteredPhotoBOptions" 
:key="`B-${photo.id}`" 
:value="photo.id" 
:disabled="selectedPhotoAId === photo.id">
[{{ formatDateTime(photo.createdAt) }}] - {{ photo.photoType }}
</option>
</select>
</div>
</div>

<div v-if="photoA || photoB" class="flex flex-col md:flex-row gap-4 mt-4 border-t pt-4">
<div class="w-full md:w-1/2 border rounded-lg shadow-sm overflow-hidden" :class="{'bg-gray-200': !photoA}">
<h5 class="text-center py-2 font-medium text-gray-700" :class="{'text-gray-500 italic': !photoA}">
{{ photoA ? 'FOTO 1 (Antes): ' + formatDateTime(photoA.createdAt) : 'Selecione a Foto 1' }}
</h5>
<AnnotationViewer 
v-if="photoA" 
:image-url="photoA.url" 
:annotation-data-json="photoA.annotationData" 
:is-viewer-visible="true" 
class="max-h-96 w-full object-contain block mx-auto"/> 
<div v-else class="h-64 flex items-center justify-center text-gray-400">
<i class="fas fa-image fa-3x"></i>
</div>
</div>

<div class="w-full md:w-1/2 border rounded-lg shadow-sm overflow-hidden" :class="{'bg-gray-200': !photoB}">
<h5 class="text-center py-2 font-medium text-gray-700" :class="{'text-gray-500 italic': !photoB}">
{{ photoB ? 'FOTO 2 (Depois): ' + formatDateTime(photoB.createdAt) : 'Selecione a Foto 2' }}
</h5>
<AnnotationViewer 
v-if="photoB" 
:image-url="photoB.url" 
:annotation-data-json="photoB.annotationData" 
:is-viewer-visible="true" 
class="max-h-96 w-full object-contain block mx-auto"/>
<div v-else class="h-64 flex items-center justify-center text-gray-400">
<i class="fas fa-image fa-3x"></i>
</div>
</div>
</div>
</div>
</div>
<div v-if="photos.length > 0" class="bg-white p-6 rounded-lg shadow-lg border">
<h4 class="text-lg font-semibold mb-4 text-gray-700">Todas as Fotos</h4>
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
<div v-for="photo in photos" :key="photo.id" class="border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
@click="showFullImage(photo)">
<img :src="photo.url" :alt="photo.photoType" class="w-full h-40 object-cover"/>
<div class="p-2 text-xs">
<p class="font-semibold text-gray-800">{{ photo.photoType }}</p>
<p class="text-gray-600">{{ formatDateTime(photo.createdAt) }}</p>
<span v-if="photo.annotationData" class="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
<i class="fas fa-pencil-alt mr-1"></i> Anotada
</span>
<span v-if="photo.associatedTreatment" class="block mt-1 text-gray-500 truncate">
Tratamento: {{ photo.associatedTreatment.name }}
</span>
</div>
</div>

</div>
</div>

<div v-if="fullViewPhoto" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
<div class="bg-white rounded-lg shadow-2xl w-full max-w-4xl relative">
<button @click="fullViewPhoto = null" class="absolute top-0 right-0 m-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 z-50">
<i class="fas fa-times fa-lg"></i>
</button>
<div class="p-6 max-h-[90vh] overflow-auto flex flex-col"> 
<h4 class="text-lg font-bold text-gray-800 mb-2">{{ fullViewPhoto.photoType }}</h4>
<p class="text-sm text-gray-500 mb-4">
Data: {{ formatDateTime(fullViewPhoto.createdAt) }}
<span v-if="fullViewPhoto.annotationData" class="ml-4 font-semibold text-indigo-600"> (Contém Anotações)</span>
</p>

<div class="w-full max-h-[70vh] flex-grow">
<AnnotationViewer 
:image-url="fullViewPhoto.url" 
:annotation-data-json="fullViewPhoto.annotationData"
:is-viewer-visible="!!fullViewPhoto" 
class="w-full h-full border border-gray-300 rounded block mx-auto" />
</div>
</div>
</div>
</div>
</div>
</template>

<script setup>
// /components/Treatments/PhotoGallery.vue - V2.8 - Remoção do título de comparação e ajuste do botão de toggle.
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '~/stores/auth'
import AnnotationViewer from '~/components/Shared/AnnotationViewer.vue' 

const props = defineProps({
 userId: { type: Number, required: true },
 refreshTrigger: { type: Number, default: 0 } 
})

const authStore = useAuthStore()

const isLoading = ref(true)
const error = ref(null)
const photos = ref([]) 
const fullViewPhoto = ref(null) 

// Estado da Comparação
const selectedPhotoAId = ref(null)
const selectedPhotoBId = ref(null)
// NOVO: Estado para controlar a visibilidade da seção de comparação
const isCompareVisible = ref(false)

const photoA = computed(() => {
 return photos.value.find(p => p.id === selectedPhotoAId.value)
})

const photoB = computed(() => {
 return photos.value.find(p => p.id === selectedPhotoBId.value)
})

// NOVO: Filtra as opções da Foto B para corresponderem ao photoType da Foto A
const filteredPhotoBOptions = computed(() => {
 // Se a Foto A não foi selecionada, ou se photos.value está vazio, retorna o array completo/vazio.
 if (!photoA.value || photos.value.length === 0) return photos.value;
 
 const typeA = photoA.value.photoType;
 
 // Filtra fotos que tenham o mesmo photoType e que não sejam a própria Foto A.
 return photos.value.filter(photo => 
  photo.photoType === typeA && photo.id !== selectedPhotoAId.value
 );
});


// CORREÇÃO V2.6 aplicada: Garante que a Foto B seja limpa e evita TypeError.
watch(photoA, (newPhotoA) => {
 // Se a nova Foto A for nula/indefinida OU não tiver a propriedade photoType, limpamos a B e paramos.
 if (!newPhotoA || !newPhotoA.photoType) {
  selectedPhotoBId.value = null;
  return;
 }
 
 // Se a Foto B estiver selecionada, verifica o tipo.
 if (photoB.value && photoB.value.photoType && photoB.value.photoType !== newPhotoA.photoType) {
  selectedPhotoBId.value = null;
  console.log(`DEBUG (V2.8) - Foto B limpa: O tipo (${photoB.value.photoType}) não corresponde mais ao tipo da Foto A (${newPhotoA.photoType}).`);
 }
});


// --- Funções de Data ---
const formatDateTime = (isoString) => {
 if (!isoString) return 'S/D';
 try {
  const date = new Date(isoString);
  return date.toLocaleDateString('pt-BR', {
   year: 'numeric',
   month: 'short',
   day: 'numeric',
   hour: '2-digit',
   minute: '2-digit'
  });
 } catch {
  return 'Data Inválida';
 }
}

// --- Funções de Visualização ---
const showFullImage = async (photo) => {
 // Força o valor para null e usa nextTick para garantir que o v-if feche e reabra o modal
 fullViewPhoto.value = null;
 await nextTick();
 fullViewPhoto.value = photo;
}

// --- Busca de Dados ---
const fetchPhotos = async () => {
 if (isNaN(props.userId)) return

 isLoading.value = true
 error.value = null

 if (!authStore.initialized) {
  await authStore.init() 
 }
 const token = authStore.token

 try {
  const response = await $fetch(`/api/professional/user/${props.userId}/photos`, {
   headers: { Authorization: `Bearer ${token}` },
   method: 'GET'
  });

  // O frontend espera 'photoType' e 'annotationData' (camelCase)
  photos.value = response.photos || []; 

  if (photos.value.length >= 2) {
   // Inicializa com as duas fotos mais recentes (índice 0 e 1)
   photos.value.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
   // Apenas inicializa as IDs se as duas mais recentes tiverem o mesmo tipo de foto
   if (photos.value[0].photoType === photos.value[1].photoType) {
    selectedPhotoAId.value = photos.value[1].id; 
    selectedPhotoBId.value = photos.value[0].id; 
   } else {
    selectedPhotoAId.value = null;
    selectedPhotoBId.value = null;
   }
  } else {
   selectedPhotoAId.value = null;
   selectedPhotoBId.value = null;
  }

 } catch (e) {
  console.error('Erro ao buscar fotos de avaliação:', e);
  error.value = e?.data?.statusMessage || 'Não foi possível carregar as fotos.';
 } finally {
  isLoading.value = false;
 }
}

onMounted(fetchPhotos)
watch(() => props.refreshTrigger, fetchPhotos)
</script>