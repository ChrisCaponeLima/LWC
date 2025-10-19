// /components/TreatmentGallery.vue - V1.0 - Componente dedicado à Galeria de Tratamentos (botão expansível e sub-galerias).
<template>
 <div class="mt-12 space-y-4">
  <button 
   @click="toggleGallery()" 
   :class="[
    'w-full px-4 py-3 text-gray-800 rounded-lg font-bold transition duration-150 flex justify-between items-center',
    // Reutiliza a classe 'btn-with-photos' para o estilo do botão quando há conteúdo
    groupedTreatmentPhotos.length > 0 ? 'btn-with-photos' : 'btn-no-photos'
   ]"
  >
   Tratamentos ({{ groupedTreatmentPhotos.length }} Tipos)
   <i :class="{'fas fa-chevron-up': isActive, 'fas fa-chevron-down': !isActive}"></i>
  </button>

    <div v-if="isActive" class="mt-2 p-4 bg-gray-50 rounded-lg space-y-6">
   <template v-if="groupedTreatmentPhotos.length > 0">
        <div v-for="treatmentGroup in groupedTreatmentPhotos" :key="treatmentGroup.treatmentId" class="border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white">
     <h4 class="px-4 py-3 bg-gray-100 border-b text-lg font-semibold text-gray-700">
      {{ treatmentGroup.name }} ({{ treatmentGroup.photos.length }} Fotos)
     </h4>
     
     <div v-if="treatmentGroup.photos.length > 0" class="photo-grid-gallery grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            <NuxtLink 
       v-for="photo in treatmentGroup.photos" 
       :key="photo.url" 
       :to="`/editor/treatment/${treatmentGroup.treatmentId}/${photo.id}`" 
       class="relative pb-[100%] cursor-pointer group block"
      >
       <img 
        :src="photo.url" 
        :alt="`Foto de ${treatmentGroup.name} (${formatDate(photo.date)})`" 
        class="absolute inset-0 w-full h-full object-cover rounded-md shadow-md group-hover:opacity-75 transition-opacity"
        loading="lazy"
       >
       
              <div v-if="photo.isPrivate" class="absolute top-2 right-2 p-1 bg-black/80 rounded-full text-white text-sm z-50 flex items-center justify-center" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
         <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
         <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
       </div>

              <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-md text-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {{ formatDate(photo.date) }}<span v-if="photo.isPrivate"> &nbsp;🔒</span>
        <p class="truncate text-gray-200" v-if="photo.description">{{ photo.description }}</p>
       </div>
      </NuxtLink>
     </div>
     <p v-else class="text-gray-500 text-center py-4 bg-white">Nenhuma foto para este tratamento.</p>
    </div>
   </template>
   <p v-else class="text-gray-500 col-span-full text-center py-4">Nenhuma galeria de tratamento registrada.</p>
  </div>
 </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Definição das interfaces (garantindo tipagem)
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

const props = defineProps({
 groupedTreatmentPhotos: {
  type: Array as () => TreatmentGroup[],
  default: () => [],
 },
});

// Estado de expansão local
const isActive = ref(false);

const toggleGallery = () => {
 isActive.value = !isActive.value;
};

// Função de formatação de data (copiada para manter a padronização visual)
const formatDate = (dateString: string) => {
 if (!dateString) return 'S/D';
 try {
  const dateObject = new Date(dateString);
  if (isNaN(dateObject.getTime())) return dateString;
  return dateObject.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
 } catch {
  return dateString;
 }
};
</script>