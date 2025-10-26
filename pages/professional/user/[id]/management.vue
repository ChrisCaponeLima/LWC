// /pages/professional/user/[id]/management.vue - V1.1 - Adicionado Controle de Recarga de Dados
<template>
    <div class="p-6 max-w-7xl mx-auto">
        
        <div v-if="isLoading" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin fa-2x text-indigo-600"></i>
            <p class="ml-3 text-lg text-gray-600">Carregando dados do paciente...</p>
        </div>

        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Erro:</strong>
            <span class="block sm:inline"> {{ error }}</span>
        </div>

        <div v-else-if="user" class="space-y-6">
            
            <div class="flex items-center justify-between bg-white p-6 rounded-lg shadow-md border-b-4 border-indigo-500">
                <div class="flex items-center space-x-4">
                    <i class="fas fa-user-circle fa-3x text-indigo-600"></i>
                    <div>
                        <h1 class="text-3xl font-extrabold text-gray-900">{{ user.username }}</h1>
                        <p class="text-sm text-gray-500">ID do Paciente: {{ user.id }}</p>
                    </div>
                </div>
                <button @click="navigateTo('/professional/user_search')" class="text-sm text-indigo-600 hover:text-indigo-800 transition">
                    <i class="fas fa-arrow-left mr-1"></i> Voltar à Busca
                </button>
            </div>

            <div class="border-b border-gray-200">
                <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                    <a v-for="tab in tabs" :key="tab.name"
                       @click="activeTab = tab.component"
                       :class="[
                           tab.component === activeTab
                               ? 'border-indigo-500 text-indigo-600 font-semibold'
                               : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                           'cursor-pointer whitespace-nowrap py-3 px-1 border-b-2 text-sm transition duration-150'
                       ]"
                    >
                        <i :class="[tab.icon, 'mr-2']"></i> {{ tab.name }}
                    </a>
                </nav>
            </div>

            <div class="py-4">
                
                <TreatmentsTreatmentAssociationManager
                    v-if="activeTab === 'TreatmentAssociationManager'"
                    :user-id="userId"
                    :active-treatments="treatmentsData.active"
                    :available-treatments="treatmentsData.available"
                    @refresh-data="handleDataRefresh"
                />

                <TreatmentsAssessmentPhotoUploader
                    v-else-if="activeTab === 'AssessmentPhotoUploader'"
                    :user-id="userId"
                    :active-treatments="treatmentsData.active"
                    @upload-success="handleDataRefresh"
                />
                
                <TreatmentsPhotoGallery
                    v-else-if="activeTab === 'PhotoGallery'"
                    :user-id="userId"
                    :refresh-trigger="dataRefreshKey"
                />
                
                <div v-else-if="activeTab === 'Measurements'">
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">Acompanhamento de Medidas</h3>
                    <p class="text-gray-500">Funcionalidade para registrar e visualizar medidas corporais ou de lesões (em desenvolvimento).</p>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
// /pages/professional/user/[id]/management.vue - V1.1 - Adicionado Controle de Recarga de Dados

import { ref, onMounted, computed } from 'vue'
import { useRoute, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#app'

// Definição do Título da Página (Nuxt 3)
definePageMeta({
    middleware: ['auth'] 
})
useHead({
    title: 'Gerenciamento de Paciente'
})

const route = useRoute()
const authStore = useAuthStore()
const config = useRuntimeConfig()

// Variáveis de Estado
const userId = computed(() => parseInt(route.params.id));
const user = ref(null);
const isLoading = ref(true);
const error = ref(null);
const activeTab = ref('TreatmentAssociationManager');

// 🚨 Chave de recarga para forçar a atualização dos componentes filhos (como a Galeria)
const dataRefreshKey = ref(0); 

const treatmentsData = ref({
    active: [],    
    available: [] 
});

// Configuração das Abas
const tabs = [
    { name: 'Tratamentos Ativos', component: 'TreatmentAssociationManager', icon: 'fas fa-heartbeat' },
    { name: 'Upload de Avaliação', component: 'AssessmentPhotoUploader', icon: 'fas fa-upload' },
    { name: 'Galeria de Fotos', component: 'PhotoGallery', icon: 'fas fa-images' },
    { name: 'Medidas', component: 'Measurements', icon: 'fas fa-ruler-combined' },
];

// --- Funções de Busca de Dados ---

const fetchPatientData = async () => {
    if (isNaN(userId.value)) {
        error.value = 'ID do paciente inválido.';
        isLoading.value = false;
        return;
    }
    
    isLoading.value = true;
    error.value = null;
    const token = authStore.token;

    try {
        const response = await $fetch(`/api/professional/user/${userId.value}/data`, {
            baseURL: config.public.apiBaseUrl,
            headers: { Authorization: `Bearer ${token}` },
            method: 'GET'
        });

        user.value = response.user;
        treatmentsData.value.active = response.activeTreatments;
        treatmentsData.value.available = response.availableTreatments;

    } catch (e) {
        console.error('Erro ao buscar dados do paciente:', e);
        error.value = e?.data?.statusMessage || 'Não foi possível carregar os dados do paciente ou tratamentos.';
    } finally {
        isLoading.value = false;
    }
}

// 🚨 Handler para recarregar dados
const handleDataRefresh = () => {
    // 1. Recarrega os dados do usuário (tratamentos ativos)
    fetchPatientData();
    // 2. Incrementa a chave para forçar a atualização de componentes filhos (Galeria)
    dataRefreshKey.value++;
}


onMounted(() => {
    handleDataRefresh(); // Chama o handler na montagem
})
</script>