// /pages/professional/treatments/[id].vue - V1.3 - CORREÇÃO: Restaurada a definição de allowedRoles e ajustado o middleware para professional-auth.
<template>
 <NuxtLayout>
  <div>
   <Header :page-title="`Tratamentos - ${data?.targetUser.name || 'Carregando...'}`" />

   <div class="min-h-screen bg-gray-100 p-4 sm:p-8">
    <div class="max-w-7xl mx-auto bg-white shadow-xl rounded-lg p-6">

     <div v-if="error" class="text-red-600 p-4 border border-red-200 rounded bg-red-50 mb-6">
      <i class="fas fa-exclamation-triangle mr-2"></i> {{ error }}
     </div>
     
     <div v-if="isLoading" class="text-center p-10">
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
        <div v-if="activeTab === 'activeTreatments'">
          <h3 class="text-xl font-semibold mb-4 text-gray-700">Gerenciar Tratamentos Ativos</h3>
          <TreatmentAssociationManager 
            :user-id="targetUserId"
            :active-treatments="data.activeTreatments"
            :available-treatments="data.availableTreatments"
            @refreshData="fetchData"
          />
        </div>

        <div v-else-if="activeTab === 'photoGallery'">
          <h3 class="text-xl font-semibold mb-4 text-gray-700">Galeria de Fotos do Tratamento</h3>
          <TreatmentPhotoGallery 
            :user-id="targetUserId"
            :photos="data.treatmentPhotos"
            :available-treatments="data.availableTreatments"
            @refreshData="fetchData"
          />
        </div>

        <div v-else-if="activeTab === 'productsAdministered'">
          <h3 class="text-xl font-semibold mb-4 text-gray-700">Produtos Ministrados e Histórico</h3>
          <ProductsAdministeredPanel
            :user-id="targetUserId"
            :products-history="data.productsHistory"
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
// /pages/professional/treatments/[id].vue - V1.3 - CORREÇÃO: Restaurada a definição de allowedRoles para garantir o acesso via middleware.
import { ref, onMounted } from 'vue'
import { useRoute, useRuntimeConfig } from '#app'
import { useAuthStore } from '~/stores/auth'

// CORREÇÃO: Adicionando allowedRoles de volta e garantindo o middleware correto.
definePageMeta({ 
    middleware: ['professional-auth'],
    allowedRoles: ['admin', 'owner', 'profissional']
})

const authStore = useAuthStore()
const route = useRoute()
const config = useRuntimeConfig()

// Variáveis de Estado
const targetUserId = parseInt(route.params.id as string)
const isLoading = ref(true)
const error = ref<string | null>(null)
const data = ref<any | null>(null)
const activeTab = ref('activeTreatments') // Aba inicial

const tabs = [
{ name: 'activeTreatments', label: 'Tratamentos Ativos' },
{ name: 'photoGallery', label: 'Galeria de Fotos' },
{ name: 'productsAdministered', label: 'Produtos Ministrados' },
]

// Função de Busca de Dados
const fetchData = async () => {
 isLoading.value = true
 error.value = null
 const token = authStore.token

 if (!token) {
  error.value = 'Token de autenticação ausente.'
  isLoading.value = false
  return
 }

 try {
  const resp = await $fetch(`/api/professional/user/${targetUserId}/treatments`, {
   baseURL: config.public.apiBaseUrl,
   headers: { Authorization: `Bearer ${token}` }
  })
  data.value = resp
 } catch (e: any) {
  error.value = e?.data?.statusMessage || e?.message || 'Erro ao carregar os dados de tratamento.'
 } finally {
  isLoading.value = false
 }
}

onMounted(fetchData)
</script>

<style scoped>
/* Estilos específicos se necessário */
</style>