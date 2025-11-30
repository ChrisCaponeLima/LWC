// /components/TreatmentGallery.vue - V1.9 - AJUSTE MINIATURA: Alterado object-cover para object-contain na tag img da miniatura para garantir que a imagem inteira seja exibida, sem cortes.
<template>
<div class="mt-12 space-y-4">
 <button 
 @click="toggleGallery()" 
 :class="[
  'w-full px-4 py-3 text-gray-800 rounded-lg font-bold transition duration-150 flex justify-between items-center',
  // Reutiliza a classe 'btn-with-photos' ou 'btn-no-photos' (definidas em main.css/style.css)
  groupedTreatmentPhotos.length > 0 ? 'btn-with-photos' : 'btn-no-photos'
 ]"
 >
 Tratamentos ({{ groupedTreatmentPhotos.length }} Tipos)
 <i :class="{'fas fa-chevron-up': isActive, 'fas fa-chevron-down': !isActive}"></i>
 </button>

 <div v-if="isActive" class="mt-2 p-4 bg-gray-50 rounded-lg space-y-6">
 <template v-if="groupedTreatmentPhotos.length > 0">
  
  <div 
  v-for="treatmentGroup in groupedTreatmentPhotos" 
  :key="treatmentGroup.treatmentId" 
  class="border rounded-lg shadow-sm overflow-hidden"
  >
  
  <button 
   @click="toggleCollapse(treatmentGroup.name)"
   class="w-full px-4 py-3 cursor-pointer flex justify-between items-center transition duration-150 rounded-t-lg"
   :class="[
   // Controle de cor (Tema Azul) baseado no estado de colapso
   'border-l-4',
   !collapsed[treatmentGroup.name] ? 'bg-blue-100 border-blue-500' : 'bg-blue-50 border-blue-200'
   ]"
  >
   <span class="text-base font-semibold text-blue-800">
   {{ treatmentGroup.name }} 
   <span class="font-normal text-sm text-blue-600">
    ({{ treatmentGroup.photos.length }} Fotos)
   </span>
   </span>
   
   <i 
   :class="[
    'fas', 
    'text-blue-700',
    'transition-transform duration-300',
    // Controle do ícone
    {'fa-chevron-up': !collapsed[treatmentGroup.name], 'fa-chevron-down': collapsed[treatmentGroup.name]}
   ]"
   ></i>
  </button>
  
  <Transition name="slide-fade">
   <div v-if="!collapsed[treatmentGroup.name]" class="p-4 bg-white">
   
   <div v-if="treatmentGroup.photos.length > 0" class="photo-grid-gallery grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
    <div
    v-for="photo in treatmentGroup.photos" 
    :key="photo.url" 
    @click="openViewer(photo.url, treatmentGroup.name, photo.date)"
         class="relative pb-[100%] cursor-zoom-in group block"
    >
    <img 
     :src="photo.url" 
     :alt="`Foto de ${treatmentGroup.name} (${formatDate(photo.date)})`" 
     class="absolute inset-0 w-full h-full object-contain rounded-md shadow-md group-hover:opacity-75 transition-opacity"
     loading="lazy"
    >
    
    <div v-if="photo.isPrivate" class="absolute top-2 right-2 p-1 bg-black/80 rounded-full text-white text-sm z-50 flex items-center justify-center" aria-hidden="true">
     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
     <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
     <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
     </svg>
    </div>

    <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b-md text-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
     <p class="font-bold truncate text-gray-50 mb-1 leading-tight">{{ treatmentGroup.name }}</p> 
     
     <p class="leading-tight">{{ formatDate(photo.date) }}<span v-if="photo.isPrivate"> &nbsp;🔒</span></p>

     <p class="truncate text-gray-400 mt-1" v-if="photo.description">{{ photo.description }}</p>
    </div>
    </div>
   </div>
   <p v-else class="text-gray-500 text-center py-4 bg-white">Nenhuma foto para este tratamento.</p>

   </div>
  </Transition>

  </div>
 </template>
 <p v-else class="text-gray-500 col-span-full text-center py-4">Nenhuma galeria de tratamento registrada.</p>
 </div>
</div>
 
 <GlobalPhotoViewer
  :image-url="viewerUrl"
  :alt-text="viewerAlt"
  @close="closeViewer"
 />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import GlobalPhotoViewer from '~/components/Global/PhotoViewer.vue'; // Importa o novo componente

// Definição das interfaces (mantida)
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

// --- Estado do PhotoViewer ---
const viewerUrl = ref<string | null>(null);
const viewerAlt = ref<string>('');

// --- Funções do PhotoViewer ---

/**
* Abre o visualizador em tela cheia.
* @param url A URL da imagem.
* @param treatmentName O nome do tratamento.
* @param date A data da foto.
*/
const openViewer = (url: string, treatmentName: string, date: string) => {
 viewerUrl.value = url;
 viewerAlt.value = `${treatmentName} - ${formatDate(date)}`;
};

/**
* Fecha o visualizador em tela cheia.
*/
const closeViewer = () => {
 viewerUrl.value = null;
 viewerAlt.value = '';
};


// Estado de expansão local da galeria principal (mantido)
const isActive = ref(false);

// Estado de expansão para cada sub-galeria
const collapsed = ref<Record<string, boolean>>({});

const toggleGallery = () => {
isActive.value = !isActive.value;
};

/**
* Inicializa o estado de collapse para cada tratamento ao carregar os dados.
* É usado o 'name' como chave para consistência com o agrupamento feito no dashboard.vue
*/
watch(() => props.groupedTreatmentPhotos, (newGroups) => {
 if (newGroups) {
  newGroups.forEach(group => {
      // Inicializa como FECHADO (true) se o estado não existir.
   if (collapsed.value[group.name] === undefined) {
    collapsed.value[group.name] = true; 
   }
  });
 }
}, { immediate: true });


/**
* Alterna o estado de collapse de um grupo de tratamento.
* @param {string} treatmentName - O nome do tratamento.
*/
const toggleCollapse = (treatmentName: string) => {
// Garante que o estado exista antes de tentar alternar.
if (collapsed.value[treatmentName] === undefined) {
 collapsed.value[treatmentName] = true; 
}
collapsed.value[treatmentName] = !collapsed.value[treatmentName];
};

// Função de formatação de data (mantida)
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

<style scoped>
/* Estilo para a transição (slide/fade) para um efeito visual suave ao abrir/fechar */
.slide-fade-enter-active,
.slide-fade-leave-active {
transition: all 0.3s ease-out;
overflow: hidden;
}

/* Estado inicial (colapsado/escondido) */
.slide-fade-enter-from,
.slide-fade-leave-to {
opacity: 0;
max-height: 0; /* Essencial para o efeito de "slide" */
padding-top: 0;
padding-bottom: 0;
}

/* Estado final (aberto) */
.slide-fade-enter-active {
 max-height: 1000px; /* Valor grande o suficiente para o conteúdo da galeria */
}

/* Nota: As classes 'btn-with-photos' e 'btn-no-photos' estão definidas em main.css/style.css. */
</style>