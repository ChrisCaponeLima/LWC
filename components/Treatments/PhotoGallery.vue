// /components/Treatments/PhotoGallery.vue - V1.1 - Integração do AnnotationViewer
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
            <h4 class="text-lg font-semibold mb-4 text-indigo-700">Comparar Fotos (Antes vs. Depois)</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Foto 1 (Antes):</label>
                    <select v-model="selectedPhotoAId" class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm sm:text-sm">
                        <option :value="null">Selecione a primeira foto</option>
                        <option v-for="photo in photos" :key="`A-${photo.id}`" :value="photo.id" :disabled="selectedPhotoBId === photo.id">
                            [{{ formatDateTime(photo.createdAt) }}] - {{ photo.type }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Foto 2 (Depois):</label>
                    <select v-model="selectedPhotoBId" class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm sm:text-sm">
                        <option :value="null">Selecione a segunda foto</option>
                        <option v-for="photo in photos" :key="`B-${photo.id}`" :value="photo.id" :disabled="selectedPhotoAId === photo.id">
                            [{{ formatDateTime(photo.createdAt) }}] - {{ photo.type }}
                        </option>
                    </select>
                </div>
            </div>

            <div v-if="photoA || photoB" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t pt-4">
                <div class="border rounded-lg shadow-sm overflow-hidden" :class="{'bg-gray-200': !photoA}">
                    <h5 class="text-center py-2 font-medium text-gray-700" :class="{'text-gray-500 italic': !photoA}">
                         {{ photoA ? 'FOTO 1: ' + formatDateTime(photoA.createdAt) : 'Selecione a Foto 1' }}
                    </h5>
                    <SharedAnnotationViewer v-if="photoA" :image-url="photoA.url" :annotation-data="photoA.annotation_data" class="max-h-96 mx-auto"/>
                    <div v-else class="h-64 flex items-center justify-center text-gray-400">
                        <i class="fas fa-image fa-3x"></i>
                    </div>
                </div>

                <div class="border rounded-lg shadow-sm overflow-hidden" :class="{'bg-gray-200': !photoB}">
                    <h5 class="text-center py-2 font-medium text-gray-700" :class="{'text-gray-500 italic': !photoB}">
                        {{ photoB ? 'FOTO 2: ' + formatDateTime(photoB.createdAt) : 'Selecione a Foto 2' }}
                    </h5>
                    <SharedAnnotationViewer v-if="photoB" :image-url="photoB.url" :annotation-data="photoB.annotation_data" class="max-h-96 mx-auto"/>
                    <div v-else class="h-64 flex items-center justify-center text-gray-400">
                        <i class="fas fa-image fa-3x"></i>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="photos.length > 0" class="bg-white p-6 rounded-lg shadow-lg border">
            <h4 class="text-lg font-semibold mb-4 text-gray-700">Todas as Fotos</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div v-for="photo in photos" :key="photo.id" class="border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                     @click="showFullImage(photo)">
                    <img :src="photo.url" :alt="photo.type" class="w-full h-40 object-cover"/>
                    <div class="p-2 text-xs">
                        <p class="font-semibold text-gray-800">{{ photo.type }}</p>
                        <p class="text-gray-600">{{ formatDateTime(photo.createdAt) }}</p>
                        <span v-if="photo.hasAnnotation" class="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
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
                <div class="p-6">
                    <h4 class="text-lg font-bold text-gray-800 mb-2">{{ fullViewPhoto.type }}</h4>
                    <p class="text-sm text-gray-500 mb-4">
                        Data: {{ formatDateTime(fullViewPhoto.createdAt) }}
                        <span v-if="fullViewPhoto.hasAnnotation" class="ml-4 font-semibold text-indigo-600"> (Contém Anotações)</span>
                    </p>
                    
                    <SharedAnnotationViewer 
                        :image-url="fullViewPhoto.url" 
                        :annotation-data="fullViewPhoto.annotation_data"
                        class="w-full max-h-[70vh] mx-auto border border-gray-300 rounded"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// /components/Treatments/PhotoGallery.vue - V1.1 - Integração do AnnotationViewer
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#app'

const props = defineProps({
    userId: { type: Number, required: true },
    refreshTrigger: { type: Number, default: 0 } 
})

const authStore = useAuthStore()
const config = useRuntimeConfig()

const isLoading = ref(true)
const error = ref(null)
const photos = ref([]) // Lista de todas as fotos
const fullViewPhoto = ref(null) // Para o modal de visualização

// Estado da Comparação
const selectedPhotoAId = ref(null)
const selectedPhotoBId = ref(null)

// Computed para achar a foto selecionada A
const photoA = computed(() => {
    return photos.value.find(p => p.id === selectedPhotoAId.value)
})

// Computed para achar a foto selecionada B
const photoB = computed(() => {
    return photos.value.find(p => p.id === selectedPhotoBId.value)
})

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

const showFullImage = (photo) => {
    // 🚨 Certifique-se de que o campo annotation_data está disponível no objeto
    fullViewPhoto.value = photo
}

// --- Busca de Dados ---

const fetchPhotos = async () => {
    if (isNaN(props.userId)) return

    isLoading.value = true
    error.value = null
    const token = authStore.token

    try {
        // Chamada ao novo manipulador GET /api/professional/user/[id]/photos
        // NOTE: O manipulador GET (V1.1) precisa retornar 'annotation_data'
        const response = await $fetch(`/api/professional/user/${props.userId}/photos`, {
            baseURL: config.public.apiBaseUrl,
            headers: { Authorization: `Bearer ${token}` },
            method: 'GET'
        });

        // NOTA: O manipulador GET que criamos não retornava o campo 'annotation_data'.
        // O servidor precisa ser corrigido para garantir que esse campo venha.
        // Assumindo que o back-end está correto (V1.2 do photos.get.ts abaixo), o fluxo continua:
        photos.value = response.photos;
        
        if (photos.value.length >= 2) {
            selectedPhotoAId.value = photos.value[1].id; 
            selectedPhotoBId.value = photos.value[0].id; 
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

// A Galeria agora usa o AnnotationViewer e tem a lógica de anotações implementada!
</script>