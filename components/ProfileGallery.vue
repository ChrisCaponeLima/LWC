// /components/ProfileGallery.vue - V2.0 - Garante que from=profile seja passado e usa fileId correto.
<template>
    <div class="mt-8 space-y-4">
        <button 
            @click="toggleGallery('photo')" 
            :class="[
                'w-full px-4 py-3 rounded-lg font-bold transition duration-150 flex justify-between items-center',
                activeGallery === 'photo' ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
            ]"
        >
            Fotos de Evolução (Registros - {{ photoUrls.length }})
            <i :class="{'fas fa-chevron-up': activeGallery === 'photo', 'fas fa-chevron-down': activeGallery !== 'photo'}"></i>
        </button>

        <div v-if="activeGallery === 'photo'" id="photo-grid" class="mt-2 photo-grid-gallery grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <template v-if="photoUrls.length > 0">
                <NuxtLink 
                    v-for="photo in photoUrls" 
                    :key="photo.url + '-' + photo.fileId" 
                    :to="`/editor/${photo.fileId}?type=photo&recordId=${photo.recordId}&from=profile`" 
                    class="relative pb-[100%] cursor-pointer group block"
                >
                    <img 
                        :src="photo.url" 
                        :alt="`Foto de Evolução (${formatDate(photo.date)})`" 
                        class="absolute inset-0 w-full h-full object-contain rounded-md shadow-md group-hover:opacity-75 transition-opacity"
                    >

                    <div v-if="photo.isPrivate" class="absolute top-2 right-2 p-1 bg-black/80 rounded-full text-white text-sm z-50 flex items-center justify-center" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>

                    <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-md text-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        {{ formatDate(photo.date) }}<span v-if="photo.isPrivate"> &nbsp;🔒</span>
                    </div>
                </NuxtLink>
            </template>
            <p v-else class="text-gray-500 col-span-full text-center py-4">Nenhuma foto de evolução registrada.</p>
        </div>

        <button 
            @click="toggleGallery('forma')" 
            :class="[
                'w-full px-4 py-3 rounded-lg font-bold transition duration-150 flex justify-between items-center',
                activeGallery === 'forma' ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            ]"
        >
            Fotos de Forma (Forma - {{ formaUrls.length }})
            <i :class="{'fas fa-chevron-up': activeGallery === 'forma', 'fas fa-chevron-down': activeGallery !== 'forma'}"></i>
        </button>

        <div v-if="activeGallery === 'forma'" id="forma-grid" class="mt-2 photo-grid-gallery grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <template v-if="formaUrls.length > 0">
                <NuxtLink 
                    v-for="forma in formaUrls" 
                    :key="forma.url + '-' + forma.fileId" 
                    :to="`/editor/${forma.fileId}?type=forma&recordId=${forma.recordId}&from=profile`" 
                    class="relative pb-[100%] cursor-pointer group block"
                >
                    <img 
                        :src="forma.url" 
                        :alt="`Foto de Forma (${formatDate(forma.date)})`" 
                        class="absolute inset-0 w-full h-full object-contain rounded-md shadow-md group-hover:opacity-75 transition-opacity"
                    >

                    <div v-if="forma.isPrivate" class="absolute top-2 right-2 p-1 bg-black/80 rounded-full text-white text-sm z-50 flex items-center justify-center" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>

                    <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-md text-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        {{ formatDate(forma.date) }}<span v-if="forma.isPrivate"> &nbsp;🔒</span>
                    </div>
                </NuxtLink>
            </template>
            <p v-else class="text-gray-500 col-span-full text-center py-4">Nenhuma foto de forma registrada.</p>
        </div>
    </div> 
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface GalleryPhoto {
    url: string;
    date: string;
    recordId: number;
    isPrivate: 0 | 1; 
    type: 1 | 2; 
    fileId?: number; 
}

interface MappedGalleryPhoto extends Omit<GalleryPhoto, 'fileId'> {
    fileId: number; 
}

const props = defineProps({
    photoGallery: {
        type: Array as () => GalleryPhoto[],
        required: true,
        default: () => []
    },
    formaGallery: {
        type: Array as () => GalleryPhoto[],
        required: true,
        default: () => []
    },
});

const activeGallery = ref<'photo' | 'forma' | null>(null); 

const toggleGallery = (name: 'photo' | 'forma') => {
    activeGallery.value = activeGallery.value === name ? null : name;
};

// Mapeia os dados da API para o formato de uso
const mapGalleryData = (gallery: GalleryPhoto[]): MappedGalleryPhoto[] => {
    return gallery.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => ({
        ...item,
        isPrivate: item.isPrivate === 1 ? 1 : 0,
        // 🛑 CORREÇÃO: Remove o fallback problemático. Assume que a API envia 'fileId' correto, senão usa 0.
        fileId: (typeof item.fileId === 'number' && item.fileId > 0) ? item.fileId : 0,
    } as MappedGalleryPhoto)); 
};

const photoUrls = computed(() => mapGalleryData(props.photoGallery));
const formaUrls = computed(() => mapGalleryData(props.formaGallery));

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