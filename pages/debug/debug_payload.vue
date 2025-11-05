// /pages/debug/debug.vue - V4.1 - LEITURA FOCADA NO PAYLOAD: Chamada direta à API /api/treatments/areas para exibir o payload recebido e o estado do array de dados (Nuxt-first com useFetch).

<template>
 <div class="p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
  <h1 class="text-3xl font-bold text-indigo-700 mb-6 border-b pb-2">
   🐛 Debug: Áreas de Tratamento
  </h1>

  <div class="space-y-4">
   
      <div class="p-4 bg-white shadow rounded-lg">
    <h2 class="text-xl font-semibold mb-2 text-gray-800">Status da Requisição</h2>
    <p class="text-sm">
     **Endpoint:** <code class="bg-gray-200 p-1 rounded text-red-600">{{ apiUrl }}</code>
    </p>
    <p :class="['font-medium', pending ? 'text-blue-500' : (fetchError ? 'text-red-500' : 'text-green-500')]">
     **Estado:** {{ pending ? 'Carregando...' : (fetchError ? 'FALHA' : 'SUCESSO') }}
    </p>
   </div>

      <div v-if="fetchError" class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
    <h2 class="text-xl font-semibold mb-2">Detalhes do Erro (HTTP/API)</h2>
    <pre class="whitespace-pre-wrap text-sm">{{ fetchError }}</pre>
   </div>

      <div class="p-4 bg-white shadow rounded-lg">
    <h2 class="text-xl font-semibold mb-2 text-gray-800">Payload Bruto da API</h2>
    <div v-if="pending" class="text-gray-500 italic">Aguardando resposta...</div>
    <pre v-else class="bg-gray-800 text-white p-3 rounded-md overflow-x-auto text-sm">{{ JSON.stringify(data, null, 2) }}</pre>
   </div>

      <div class="p-4 bg-white shadow rounded-lg">
    <h2 class="text-xl font-semibold mb-2 text-gray-800">Áreas Mapeadas (`availableAreas`)</h2>
    <p class="mb-2 font-medium">
     **Total de Itens:**      <span :class="[availableAreas.length > 0 ? 'text-green-600' : 'text-red-600']">
      {{ availableAreas.length }}
     </span>
    </p>
    <ul v-if="availableAreas.length > 0" class="list-disc list-inside space-y-1 ml-4 text-sm">
     <li v-for="area in availableAreas" :key="area.id" class="text-gray-700">
      {{ area.id }}: {{ area.name }}
     </li>
    </ul>
    <p v-else class="text-red-500 italic">O array de áreas está vazio.</p>
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

<script setup>
// /pages/debug/debug.vue - V4.1 - Leitura Focada no Payload de Áreas de Tratamento

import { computed } from 'vue';
import { useFetch, useRuntimeConfig } from '#app';
import { useAuthStore } from '~/stores/auth'; // Presume-se que o AuthStore é necessário para obter o token

// Definição do Título
useHead({
 title: 'Debug - Áreas de Tratamento'
});

const authStore = useAuthStore();
const config = useRuntimeConfig();

// 1. Configuração do Fetch
const apiUrl = '/api/treatments/areas';
const token = authStore.token;

console.log('[DEBUG] Token de autenticação presente:', !!token);

// 2. Uso do useFetch para carregar os dados no início (Nuxt-first)
const { data, pending, error: fetchError, refresh } = useFetch(apiUrl, {
 baseURL: config.public.apiBaseUrl,
 method: 'GET',
 headers: { 
  // Inclui o token para passar na verificação de autorização da API
  Authorization: `Bearer ${token}` 
 },
 // Transformador opcional para logar o resultado antes de armazenar
 transform: (response) => {
  console.log('[DEBUG] Payload recebido (RAW):', response);
  return response;
 }
});

// 3. Variável Computada para mapear os dados (simulando a lógica de uso no management.vue)
const availableAreas = computed(() => {
 // V4.1: Garante que o array é extraído corretamente da chave 'availableAreas' do payload, 
 // e se o payload for nulo/indefinido ou a chave for nula, retorna um array vazio.
 const areas = data.value?.availableAreas;

 if (Array.isArray(areas)) {
  return areas;
 }
 
 console.warn('[DEBUG] Chave availableAreas não é um array ou payload vazio. Retornando [].');
 return [];
});

</script>