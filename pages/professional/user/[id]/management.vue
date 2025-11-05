// /pages/professional/user/[id]/management.vue - V2.3.0 - REMOÇÃO DOS PLACEHOLDERS DE ABAS
<template>
<div class="p-6 max-w-7xl mx-auto">
  
  <div v-if="!isLoading && user" class="bg-red-50 border border-red-400 p-3 rounded-lg mb-6 text-sm">
        <h4 class="font-bold text-red-800 mb-1">DADOS CRÍTICOS (DEBUG)</h4>
        <p class="text-red-700">Total de Áreas Carregadas: <strong>{{ availableAreas.length }}</strong></p>
        <p class="text-red-700">Primeira Área (Se existir): 
            <strong>
                {{ availableAreas.length > 0 ? availableAreas[0].name + ' (ID: ' + availableAreas[0].id + ')' : 'NENHUMA' }}
            </strong>
        </p>
        <p class="text-red-700" v-if="areasError">Erro de Áreas: <strong>{{ areasError }}</strong></p>
    </div>

<div v-if="isLoading || areasLoading" class="flex justify-center items-center h-64">
<i class="fas fa-spinner fa-spin fa-2x text-indigo-600"></i>
<p class="ml-3 text-lg text-gray-600">Carregando dados do paciente e configurações...</p>
</div>

<div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
<strong class="font-bold">Erro:</strong>
<span class="block sm-inline"> {{ error }}</span>
</div>

 <div v-else-if="areasError" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6" role="alert">
<strong class="font-bold">Atenção:</strong>
<span class="block sm-inline"> {{ areasError }}. O campo de Área de Tratamento estará vazio.</span>
</div>

 <div v-else class="space-y-6"> 

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
 
    <div class="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <h3 class="text-lg font-semibold text-indigo-800 mb-2">Seletor de Áreas (Teste de Carregamento da API)</h3>
        <select 
            class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
            <option disabled value="">
                {{ availableAreas.length > 0 ? 'Selecione uma área...' : 'Carregando ou nenhuma área disponível...' }}
            </option>
            <option 
                v-for="area in availableAreas" 
                :key="area.id" 
                :value="area.id"
            >
                {{ area.name }} (ID: {{ area.id }})
            </option>
        </select>
        <p class="text-xs text-indigo-600 mt-2">Total de itens no select: {{ availableAreas.length }}</p>
    </div>
    
    <div v-if="activeTab === 'Measurements'">
       <h3 class="text-xl font-semibold mb-4 text-gray-700">Acompanhamento de Medidas</h3>
       <p class="text-gray-500">Funcionalidade para registrar e visualizar medidas corporais ou de lesões (em desenvolvimento).</p>
   </div>
    
    <div v-else class="text-center p-8 bg-white rounded-lg shadow-sm">
        <p class="text-gray-500">Selecione uma aba de gerenciamento, ou o componente está temporariamente desativado.</p>
    </div>

</div>

</div>
</div>
</template>

<script setup>
// /pages/professional/user/[id]/management.vue - V2.3.0 - SCRIPT SETUP (INALTERADO)

import { ref, onMounted, computed } from 'vue' 
import { useRoute, navigateTo } from '#app' 
import { useAuthStore } from '~/stores/auth'

// Definição do Título da Página (Nuxt 3)
definePageMeta({
middleware: ['auth'] 
})
useHead({
title: 'Gerenciamento de Paciente'
})

const route = useRoute()
const authStore = useAuthStore()

// Variáveis de Estado
const userId = computed(() => parseInt(route.params.id));
const user = ref(null);
const isLoading = ref(true); 
const activeTab = ref('TreatmentAssociationManager'); // Mantemos este como default, mas ele irá para o V-ELSE
const dataRefreshKey = ref(0); 
const error = ref(null);

const treatmentsData = ref({
active: [], 
available: [] 
});

// Variáveis de Estado para Áreas 
const availableAreas = ref([]); 
const areasError = ref(null);
const areasLoading = ref(false); 

// Configuração das Abas
const tabs = [
{ name: 'Tratamentos Ativos', component: 'TreatmentAssociationManager', icon: 'fas fa-heartbeat' },
{ name: 'Upload de Avaliação', component: 'AssessmentPhotoUploader', icon: 'fas fa-upload' },
{ name: 'Galeria de Fotos', component: 'PhotoGallery', icon: 'fas fa-images' },
{ name: 'Medidas', component: 'Measurements', icon: 'fas fa-ruler-combined' },
];

// --- Funções de Busca de Dados ---

const fetchAvailableAreas = async () => {
    areasError.value = null; 
    areasLoading.value = true;
    const token = authStore.token;

    try {
        const response = await $fetch('/api/treatments/areas', { 
            headers: { Authorization: `Bearer ${token}` },
            method: 'GET'
        });

        areasLoading.value = false;

        const receivedAreas = (response && Array.isArray(response.availableAreas)) ? response.availableAreas : [];
        availableAreas.value = receivedAreas;
        
        if (availableAreas.value.length === 0) {
            areasError.value = 'A lista de áreas retornou vazia ou incompleta. Verifique a API.';
        }

        return true;

    } catch (e) {
        areasLoading.value = false;
        areasError.value = e?.data?.statusMessage || e?.message || 'Erro de rede ou API ao carregar áreas.';
        availableAreas.value = []; 
        return false; 
    }
}


const fetchPatientData = async () => {
if (isNaN(userId.value)) {
error.value = 'ID do paciente inválido.';
return false; 
}

error.value = null;
const token = authStore.token;

try {
const response = await $fetch(`/api/professional/user/${userId.value}/data`, {
 headers: { Authorization: `Bearer ${token}` },
 method: 'GET'
});

user.value = response.user;
treatmentsData.value.active = response.activeTreatments;
treatmentsData.value.available = response.availableTreatments;
return true; 
} catch (e) {
error.value = e?.data?.statusMessage || 'Não foi possível carregar os dados do paciente ou tratamentos.';
return false; 
}
}

// Handler para recarregar dados
const handleDataRefresh = async () => {
await fetchPatientData(); 
await fetchAvailableAreas(); // Recarrega áreas também
dataRefreshKey.value++;
}


onMounted(async () => {
isLoading.value = true;

// 1. Carrega os dados do paciente
const patientSuccess = await fetchPatientData();

// 2. Carrega as áreas APENAS SE o paciente tiver sido carregado
if (patientSuccess) {
    await fetchAvailableAreas();
}

if (!patientSuccess) {
error.value = error.value || 'Falha ao carregar dados essenciais do paciente.';
}

isLoading.value = false; 
})
</script>