// /pages/professional/treatments/[id].vue - V3.4 - API RESTAURADA: Chamada à API /treatments.get.ts ativada.
<template>
<NuxtLayout>
<div>
<Header :page-title="`Tratamentos - ${data?.targetUser.name || 'Carregando...'}`" />

<div class="min-h-screen bg-gray-100 p-4 sm:p-8">
<div class="max-w-7xl mx-auto bg-white shadow-xl rounded-lg p-6">

 <div v-if="error" class="text-red-600 p-4 border border-red-200 rounded bg-red-50 mb-6">
<i class="fas fa-exclamation-triangle mr-2"></i> 
{{ error }}
</div>

 <div v-else-if="isLoading" class="text-center p-10">
<i class="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
<p class="mt-2 text-gray-600">Carregando dados do paciente...</p>
</div>

 <div v-else-if="data">
<div class="flex items-center space-x-4 mb-8 border-b pb-4">
<img 
:src="data.targetUser.profilePhoto || '/img/default_profile.png'" 
alt="Foto de Perfil" 
class="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
>
<div>
<h2 class="text-2xl font-bold text-gray-800">{{ data.targetUser.name }}</h2>
<p class="text-sm text-gray-500">ID: {{ data.targetUser.id }}</p>
</div>
</div>

<div class="border-b border-gray-200 mb-6">
<nav class="-mb-px flex space-x-8" aria-label="Tabs">
<button
 v-for="tab in tabs"
 :key="tab.name"
 @click="activeTab = tab.name"
 :class="[
 activeTab === tab.name
 ? 'border-indigo-500 text-indigo-600'
 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
 'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors'
 ]"
>
 {{ tab.label }}
</button>
</nav>
</div>

<div class="p-4 bg-gray-50 rounded-lg">

<div v-if="activeTab === 'assessment'">
 <AssessmentImageEditor 
 :user-id="targetUserId"
  :user-treatments="data.activeTreatments" :available-treatments="data.availableTreatments"  @evaluation-saved="handleAssessmentUploadSuccess"
/>
</div>

<div v-if="activeTab === 'images'">
<h3 class="text-xl font-semibold mb-4 text-gray-700">Galeria de Fotos e Comparação</h3>
<PhotoGallery 
 :user-id="targetUserId"
 :refresh-trigger="galleryRefreshTrigger"
/>
</div>

<div v-if="activeTab === 'activeTreatments'">
<h3 class="text-xl font-semibold mb-4 text-gray-700">Gerenciar Tratamentos Ativos</h3>
<TreatmentAssociationManager 
 :user-id="targetUserId"
 :active-treatments="data.activeTreatments"
 :available-treatments="data.availableTreatments"
 @refreshData="fetchData" 
/>
</div>
</div>
</div>
</div>
</div>
</div>
</NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue' 
import { useRoute, navigateTo } from '#app' 
import { useAuthStore } from '~/stores/auth'

// === IMPORTAÇÕES DE COMPONENTES ===
import TreatmentAssociationManager from '~/components/Treatments/TreatmentAssociationManager.vue'
import AssessmentImageEditor from '~/components/Treatments/AssessmentImageEditor.vue' 
import PhotoGallery from '~/components/Treatments/PhotoGallery.vue' 
// =================================

// Definições de Meta 
definePageMeta({ 
middleware: ['professional-auth'],
allowedRoles: ['admin', 'owner', 'profissional']
})

// Hooks e Stores 
const authStore = useAuthStore()
const route = useRoute()

// Variáveis de Estado 
const targetUserId = parseInt(route.params.id as string)

const isLoading = ref(true) 
const error = ref<string | null>(null) 
const data = ref<any | null>(null) 

// Inicializa a aba de Avaliação como padrão, pois é a principal adição recente
const activeTab = ref('assessment') 
const galleryRefreshTrigger = ref(0);

const tabs = [
{ name: 'assessment', label: 'Avaliação' },
{ name: 'activeTreatments', label: 'Tratamentos Ativos' },
{ name: 'images', label: 'Galeria de Imagens' }, 
]

// -----------------------------------------------------------
// FUNÇÃO DE BUSCA DE DADOS (Restaurando a chamada à API)
// -----------------------------------------------------------
const fetchData = async () => {
isLoading.value = true
error.value = null

try {
 // 1. Inicializa o store de autenticação se necessário
 if (!authStore.initialized) {
  await authStore.init() 
 }

 // 2. Verificação do Token
 const token = authStore.token
 if (!token) {
  error.value = "Sessão expirada. Redirecionando para login..."
  console.warn('Erro de autenticação (Token Ausente). Realizando logout e redirecionando.');
  authStore.logout(); 
  await navigateTo('/login', { external: true }); 
  return // Interrompe a função
 }

 // 3. Buscar dados (CHAMADA À API RESTAURADA)
 const resp = await $fetch(`/api/professional/user/${targetUserId}/treatments`, {
  headers: { Authorization: `Bearer ${token}` }
 });
 data.value = resp; // Armazena o retorno na ref
 
} catch (e: any) {
 console.error('Erro ao carregar dados do tratamento:', e)
 const statusCode = e?.response?.status;
 
 // Tratamento de erro de API
 if (statusCode === 401) {
  error.value = 'Sessão expirada. Redirecionando para login...'
  authStore.logout(); 
  await navigateTo('/login', { external: true }); 
 } else if (statusCode === 403) {
  error.value = 'Acesso negado para este paciente. (Código 403)'
 } else {
  // Exibe a mensagem de erro da API ou um fallback.
  error.value = e?.data?.statusMessage || e?.message || 'Erro ao carregar dados. Verifique sua permissão.'
 }
} finally {
 isLoading.value = false
}
}

/**
* Lida com o sucesso do upload na aba de avaliação, 
* forçando o recarregamento da Galeria E dos dados da página.
*/
const handleAssessmentUploadSuccess = () => {
// Recarrega os dados da página
fetchData(); 
// Força o recarregamento da galeria
galleryRefreshTrigger.value++; 
console.log(`[Page] Avaliação enviada. Galeria trigger: ${galleryRefreshTrigger.value}`);
}

// -----------------------------------------------------------
// CHAMADA INICIAL
// -----------------------------------------------------------
onMounted(() => {
    // Chamada inicial para buscar os dados quando o componente for montado
    fetchData(); 
})
</script>

<style scoped>
/* Estilos específicos se necessário */
</style>