// /components/Treatments/PhotoGallery.vue - V3.2 - Implementação do padrão Accordion (colapsável) nos grupos de tratamento e alteração do título principal para 'Imagens'.
<template>
<div class="space-y-6">
<h3 class="text-xl font-bold text-gray-800 flex items-center mb-4">
<i class="fas fa-images mr-2 text-indigo-600"></i> Imagens ({{ photos.length }} fotos)
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
<div class="flex justify-between items-center mb-4">
<h4 class="text-lg font-semibold text-gray-700">Ferramenta de Comparação</h4>
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
<div v-if="photos.length > 0" class="space-y-4">
<div v-for="(group, name) in groupedPhotosByTreatment" :key="name" class="border rounded-lg shadow-sm overflow-hidden">
    
    <button 
        @click="toggleCollapse(name)" 
        class="w-full px-4 py-3 cursor-pointer flex justify-between items-center transition duration-150"
        :class="[
            'border-l-4',
            // Aplica classes para o efeito visual de aberto/fechado
            !collapsed[name] ? 'bg-indigo-100 border-indigo-500 rounded-b-none' : 'bg-indigo-50 border-indigo-200 rounded-lg'
        ]"
    >
        <span class="text-base font-bold text-indigo-700">
            <i class="fas fa-notes-medical mr-2"></i> 
            Tratamento: {{ name }} 
            <span class="font-normal text-sm text-indigo-600">
                ({{ group.length }} fotos)
            </span>
        </span>
        <i 
            :class="[
                'fas', 
                'text-indigo-700',
                'transition-transform duration-300',
                // Controla a seta para cima (aberto) ou para baixo (fechado)
                {'fa-chevron-up': !collapsed[name], 'fa-chevron-down': collapsed[name]}
            ]"
        ></i>
    </button>

    <Transition name="slide-fade">
        <div v-if="!collapsed[name]" class="p-4 bg-white border-t border-indigo-200">
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div v-for="photo in group" :key="photo.id" class="border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                    @click="showFullImage(photo)">
                    <img :src="photo.url" :alt="photo.photoType" class="w-full h-40 object-cover"/>
                    <div class="p-2 text-xs">
                        <p class="font-semibold text-gray-800">{{ photo.photoType }}</p>
                        <p class="text-gray-600">{{ formatDateTime(photo.createdAt) }}</p>
                        <span v-if="photo.annotationData" class="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                            <i class="fas fa-pencil-alt mr-1"></i> Anotada
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
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
// /components/Treatments/PhotoGallery.vue - V3.2 - Implementação do padrão Accordion (colapsável) nos grupos de tratamento e alteração do título principal.
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

// Estado da Comparação (Mantido)
const selectedPhotoAId = ref(null)
const selectedPhotoBId = ref(null)
const isCompareVisible = ref(false)

// ---------------------------------------------------------------------
// NOVO: Estado e Lógica de Colapsabilidade (Accordion)
// Implementação baseada no componente TreatmentGallery para padronização.
// ---------------------------------------------------------------------

/**
 * @property {Record<string, boolean>} collapsed - Objeto que armazena o estado de colapso para cada grupo de tratamento.
 * A chave é o nome do tratamento. `true` significa FECHADO (colapsado).
 */
const collapsed = ref({});

/**
 * Alterna o estado de collapse de um grupo de tratamento.
 * @param {string} treatmentName - O nome do tratamento usado como chave.
 */
const toggleCollapse = (treatmentName) => {
    // Garante que o estado exista antes de tentar alternar.
    if (collapsed.value[treatmentName] === undefined) {
        // Se o estado não existe, inicializa como expandido (false) no primeiro clique.
        collapsed.value[treatmentName] = false; 
    }
    // Inverte o estado atual.
    collapsed.value[treatmentName] = !collapsed.value[treatmentName];
};


// ---------------------------------------------------------------------
// Agrupamento de Fotos por Tratamento (Mantido)
// ---------------------------------------------------------------------

/**
 * Agrupa as fotos pelo nome do tratamento associado.
 * @returns {object} Um objeto onde a chave é o nome do tratamento e o valor é um array de fotos.
 */
const groupedPhotosByTreatment = computed(() => {
    return photos.value.reduce((groups, photo) => {
        // O nome do tratamento é usado como chave. 'Sem Tratamento Associado' é o fallback.
        const treatmentName = photo.associatedTreatment 
        ? photo.associatedTreatment.name 
        : 'Sem Tratamento Associado'; 

        if (!groups[treatmentName]) {
            groups[treatmentName] = [];
        }
        groups[treatmentName].push(photo);
        return groups;
    }, {});
});

/**
 * Watcher para inicializar o estado de colapsabilidade (fechado por padrão) quando os dados chegarem.
 */
watch(groupedPhotosByTreatment, (newGroups) => {
    // Itera sobre as chaves (nomes dos tratamentos)
    Object.keys(newGroups).forEach(name => {
        // Inicializa como FECHADO (true) se o estado não existir.
        if (collapsed.value[name] === undefined) {
            collapsed.value[name] = true; 
        }
    });
}, { immediate: true });


// ---------------------------------------------------------------------
// Lógica de Comparação (Mantida)
// ---------------------------------------------------------------------

const photoA = computed(() => {
return photos.value.find(p => p.id === selectedPhotoAId.value)
})

const photoB = computed(() => {
return photos.value.find(p => p.id === selectedPhotoBId.value)
})

const filteredPhotoBOptions = computed(() => {
if (!photoA.value || photos.value.length === 0) return photos.value;

const typeA = photoA.value.photoType;

return photos.value.filter(photo => 
photo.photoType === typeA && photo.id !== selectedPhotoAId.value
);
});

watch(photoA, (newPhotoA) => {
if (!newPhotoA || !newPhotoA.photoType) {
selectedPhotoBId.value = null;
return;
}

if (photoB.value && photoB.value.photoType && photoB.value.photoType !== newPhotoA.photoType) {
selectedPhotoBId.value = null;
console.log(`DEBUG (V3.2) - Foto B limpa: O tipo (${photoB.value.photoType}) não corresponde mais ao tipo da Foto A (${newPhotoA.photoType}).`);
}
});


// --- Funções de Data (Mantidas) ---
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

// --- Funções de Visualização (Mantidas) ---
const showFullImage = async (photo) => {
fullViewPhoto.value = null;
await nextTick();
fullViewPhoto.value = photo;
}

// --- Busca de Dados (Mantida) ---
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

// O frontend espera 'photoType', 'annotationData' e 'associatedTreatment' (camelCase)
photos.value = response.photos || []; 

// Lógica de inicialização de comparação (mantida)
if (photos.value.length >= 2) {
photos.value.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
console.error('Erro ao buscar fotos de avaliação (V3.2):', e);
error.value = e?.data?.statusMessage || 'Não foi possível carregar as fotos.';
} finally {
isLoading.value = false;
}
}

onMounted(fetchPhotos)
watch(() => props.refreshTrigger, fetchPhotos)
</script>

<style scoped>
/* /components/Treatments/PhotoGallery.vue - Estilo para a transição do Accordion */

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
 max-height: 2000px; /* Valor grande o suficiente para o conteúdo da galeria */
}
</style>