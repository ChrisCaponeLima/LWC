// /pages/debug/debug.vue - V5.0 - LEITURA FOCADA NO PAYLOAD: Chamada direta à API /api/profile para exibir o payload recebido (Nuxt-first com useFetch).

<template>
<div class="p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
 <h1 class="text-3xl font-bold text-indigo-700 mb-6 border-b pb-2">
 🐛 Debug: Dados do Perfil (API /api/profile)
 </h1>

 <div class="space-y-4">
 
   <div class="p-4 bg-white shadow rounded-lg">
  <h2 class="text-xl font-semibold mb-2 text-gray-800">Status da Requisição</h2>
  <p class="text-sm">
  **Endpoint:** <code class="bg-gray-200 p-1 rounded text-red-600">{{ apiUrl }}</code>
  </p>
  <p :class="['font-medium', pending ? 'text-blue-500' : (fetchError ? 'text-red-500' : 'text-green-500')]">
  **Estado:** {{ pending ? 'Carregando...' : (fetchError ? 'FALHA (Status: 500?)' : 'SUCESSO') }}
  </p>
 </div>

   <div v-if="fetchError" class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
  <h2 class="text-xl font-semibold mb-2">Detalhes do Erro (HTTP/API)</h2>
  <pre class="whitespace-pre-wrap text-sm">{{ fetchError }}</pre>
 </div>

   <div class="p-4 bg-white shadow rounded-lg">
  <h2 class="text-xl font-semibold mb-2 text-gray-800">
  Payload Bruto da API 
  <span v-if="!pending" :class="[profileId ? 'text-green-600' : 'text-red-600']">
   (ID: {{ profileId || 'N/A' }})
  </span>
  </h2>
  <div v-if="pending" class="text-gray-500 italic">Aguardando resposta...</div>
  <pre v-else class="bg-gray-800 text-white p-3 rounded-md overflow-x-auto text-sm">{{ JSON.stringify(data, null, 2) }}</pre>
 </div>

   <div class="p-4 bg-white shadow rounded-lg">
  <h2 class="text-xl font-semibold mb-2 text-gray-800">Valores Chave Mapeados</h2>
  <p class="mb-2 font-medium">
  **Apelido:** <span class="text-indigo-600">{{ profileData.apelido || 'N/A' }}</span>
  </p>
  <p class="mb-2 font-medium">
  **Peso Atual:**   <span :class="[profileData.currentWeight ? 'text-green-600' : 'text-red-600']">
   {{ profileData.currentWeight || 'N/A' }} kg
  </span>
  </p>
  <p class="mb-2 font-medium">
  **Medidas (Total):**   <span :class="[profileData.latestMeasurements?.length > 0 ? 'text-green-600' : 'text-red-600']">
   {{ profileData.latestMeasurements?.length || 0 }}
  </span>
  </p>
 </div>

 <button 
  @click="refresh()" 
  :disabled="pending"
  class="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 disabled:opacity-50"
 >
  {{ pending ? 'Recarregando...' : 'Forçar Recarregamento (Refresh)' }}
 </button>

 </div>
</div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useFetch, useRuntimeConfig } from '#app';
import { useAuthStore } from '~/stores/auth';

// Definição do Título
useHead({
title: 'Debug - Dados do Perfil'
});

const authStore = useAuthStore();
const config = useRuntimeConfig();

// 1. Configuração do Fetch
const apiUrl = '/api/profile';
const token = authStore.token;

console.log('[DEBUG] Token de autenticação presente:', !!token);
if (!token) {
console.error('[DEBUG] Token ausente. A requisição à API provavelmente falhará com 401.');
}

// 2. Uso do useFetch
const { data, pending, error: fetchError, refresh } = useFetch(apiUrl, {
baseURL: config.public.apiBaseUrl,
method: 'GET',
headers: { 
 // Inclui o token para passar na verificação de autorização da API
 Authorization: `Bearer ${token}` 
},
// Transformador opcional para logar o resultado antes de armazenar
transform: (response: any) => {
 console.log('[DEBUG] Payload recebido (RAW):', response);
 return response;
}
});

// 3. Variáveis Computadas/Reativas para exibir informações-chave
const profileData = computed(() => {
// Garante um objeto vazio como fallback para evitar erros de leitura de propriedade em null
return data.value || reactive({}); 
});

const profileId = computed(() => {
return profileData.value?.id;
});

</script>