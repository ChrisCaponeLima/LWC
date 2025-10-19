// /pages/chat/debug-redirect.vue - V1.10 - Correção de erro de digitação (partnerPhone) e validação final de variáveis reativas.
<script setup>
import { useRoute, useCookie } from '#app';
import { navigateTo } from '#app';
import Header from '~/components/Header.vue';
import { computed, ref, onMounted } from 'vue';

const route = useRoute();
const partnerId = route.query.partnerId || 'N/A';
const partnerName = route.query.partnerName || 'N/A';
// 🚨 CORREÇÃO DE ERRO DE DIGITAÇÃO: Removido o '.query' extra.
const partnerPhone = route.query.partnerPhone || 'N/A';
const currentUserId = route.query.currentUserId || 'N/A';
const status = route.query.status || 'N/A';

const measurementDebugData = ref(null);
const isLoadingMeasurements = ref(true);
const measurementError = ref(null);

const AUTH_COOKIE_NAME = 'auth_token';
const authTokenCookie = useCookie(AUTH_COOKIE_NAME); 

// Inicialização segura
const manualTokenInput = ref(authTokenCookie.value || ''); 

// Mapeamento para exibição de classes e textos - Retorna um objeto
const statusDisplay = computed(() => {
    // Note que 'status' é uma variável simples, mas a função *computed* garante
    // que o objeto retornado seja reativo. Ela já possui um fallback.
  if (status === 'FOUND') {
    return {
      text: '✅ Usuário Encontrado!',
      containerClass: 'bg-green-100 border-l-4 border-green-500',
      textClass: 'text-green-700'
    };
  } else if (status === 'NOT_FOUND') {
    return {
      text: '❌ Usuário Não Encontrado.',
      containerClass: 'bg-yellow-100 border-l-4 border-yellow-500',
      textClass: 'text-yellow-700'
    };
  }
  
  // Fallback seguro (corresponde a '⚠️ Status Indefinido.')
  return {
    text: '⚠️ Status Indefinido.',
    containerClass: 'bg-red-100 border-l-4 border-red-500',
    textClass: 'text-red-700'
  };
});


// Função para buscar os dados de debug do cálculo de tendência
const fetchMeasurementDebugData = async (tokenOverride) => {
 isLoadingMeasurements.value = true;
 measurementError.value = null;

 const token = tokenOverride || authTokenCookie.value;

 if (!token) {
  isLoadingMeasurements.value = false;
  measurementError.value = `Token de autenticação (cookie "${AUTH_COOKIE_NAME}") não encontrado. Faça login ou insira manualmente.`;
  measurementDebugData.value = null;
  return;
 }

 try {
  const data = await $fetch('/api/debug/latest-measurements', {
   headers: {
    'Authorization': `Bearer ${token}`
   }
  });
  measurementDebugData.value = data;
 } catch (e) {
  console.error('Erro ao buscar dados de debug de medidas:', e);
  const errorStatus = e.response?.status;
  if (errorStatus === 401) {
   measurementError.value = '401: Não autorizado. Token inválido ou expirado. Verifique o token inserido.';
  } else if (errorStatus === 403) {
   measurementError.value = '403: Acesso Proibido. Seu usuário não tem permissão para este endpoint.';
  } else {
   measurementError.value = `Erro ${errorStatus || 'interno'}: Falha ao carregar dados. Verifique o log do servidor.`;
  }
  measurementDebugData.value = null;
 } finally {
  isLoadingMeasurements.value = false;
 }
};

const handleManualTokenSubmit = () => {
 authTokenCookie.value = manualTokenInput.value;
 fetchMeasurementDebugData(manualTokenInput.value);
};


onMounted(() => {
 fetchMeasurementDebugData();
});

const redirectToChat = () => {
  if (partnerId && partnerId !== 'N/A') {
    navigateTo(`/chat/${partnerId}`);
  } else {
    alert('Não é possível redirecionar: ID do parceiro não disponível.');
    navigateTo('/chat');
  }
};

const redirectBack = () => {
  navigateTo('/chat');
};
</script>

<template>
 <Header pageTitle="Debug de Chat 🐞"/>
 <div class="min-h-screen bg-gray-100 py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

   <h1 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">
    🚧 Debug: Fluxo de Busca de Contato
   </h1>
   
      <div :class="['p-6 rounded-xl shadow-lg mb-6', statusDisplay.containerClass]">
    <p class="text-xl font-semibold mb-2">Status da Busca:</p>
    <p class="text-2xl font-extrabold" :class="statusDisplay.textClass">
     {{ statusDisplay.text }}
    </p>
   </div>
   
   <div class="bg-white shadow-xl rounded-xl p-6 space-y-4 mb-8">
    <h2 class="text-xl font-bold mb-4 border-b pb-2 text-gray-700">Detalhes da Transação</h2>
    
    <div class="flex items-center space-x-4 border-b pb-3">
     <span class="font-medium text-gray-500 w-48 flex-shrink-0">ID do Usuário Logado (Current):</span>
     <code :class="{'text-red-500 font-bold': currentUserId === 'N/A' || currentUserId === 'UNAVAILABLE', 'text-indigo-600': currentUserId !== 'N/A' && currentUserId !== 'UNAVAILABLE'}">{{ currentUserId }}</code>
     <span v-if="currentUserId === 'UNAVAILABLE'" class="text-sm text-red-500">(Token não decodificado!)</span>
    </div>

    <div class="flex items-center space-x-4 border-b pb-3">
     <span class="font-medium text-gray-500 w-48 flex-shrink-0">ID do Parceiro (PartnerId):</span>
     <code :class="{'text-red-500 font-bold': partnerId === 'N/A', 'text-green-600': partnerId !== 'N/A'}">{{ partnerId }}</code>
    </div>

    <div class="flex items-center space-x-4 border-b pb-3">
     <span class="font-medium text-gray-500 w-48 flex-shrink-0">Nome do Parceiro:</span>
     <code class="text-gray-800">{{ partnerName }}</code>
    </div>

    <div class="flex items-center space-x-4 border-b pb-3">
     <span class="font-medium text-gray-500 w-48 flex-shrink-0">Telefone Buscado:</span>
     <code class="text-gray-800">{{ partnerPhone }}</code>
    </div>
    
    <div class="flex items-center space-x-4">
     <span class="font-medium text-gray-500 w-48 flex-shrink-0">Status Retornado (Query):</span>
     <code class="text-purple-600 font-semibold">{{ status }}</code>
    </div>
   </div>

      <div class="bg-white shadow-xl rounded-xl p-6 space-y-4 mb-8 border border-indigo-200">
    <h2 class="text-xl font-bold mb-4 border-b pb-2 text-indigo-700 flex items-center">
     🔑 Inserção Manual de Token (Para Debug de Backend)
    </h2>
    <div class="flex space-x-4">
     <input
      v-model="manualTokenInput"
      type="text"
      placeholder="Cole o JWT válido aqui (Admin/Owner)"
      class="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
     >
     <button 
      @click="handleManualTokenSubmit"
      :disabled="!manualTokenInput || isLoadingMeasurements"
      class="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
     >
      Tentar Carregar Dados
     </button>
    </div>
    <p v-if="authTokenCookie && authTokenCookie.value" class="text-sm text-green-600">
     ✅ Token lido do cookie **{{ AUTH_COOKIE_NAME }}**. Clique em "Tentar Carregar" se inseriu um novo token.
    </p>
   </div>
         <div class="bg-white shadow-xl rounded-xl p-6 space-y-4">
    <h2 class="text-xl font-bold mb-4 border-b pb-2 text-gray-700 flex items-center">
     📦 Debug: Payload Raw do Cálculo de Tendência
    </h2>
    
    <div v-if="isLoadingMeasurements" class="text-center py-4 text-indigo-500">
     <i class="fas fa-spinner fa-spin mr-2"></i> Carregando dados do servidor...
    </div>

    <div v-else-if="measurementError" class="p-4 bg-red-100 border border-red-400 text-red-700 rounded whitespace-pre-wrap">
     {{ measurementError }}
    </div>

    <pre v-else class="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
{{ JSON.stringify(measurementDebugData, null, 2) }}
    </pre>

   </div>
   
   <div class="flex space-x-4 mt-8">
    <button 
     @click="redirectToChat" 
     :disabled="partnerId === 'N/A'"
     :class="{'opacity-50 cursor-not-allowed': partnerId === 'N/A'}"
     class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 flex items-center"
    >
     <i class="fas fa-comment-dots mr-2"></i> Ir para o Chat (PRODUÇÃO)
    </button>
    
    <button 
     @click="redirectBack" 
     class="px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 transition duration-150 flex items-center"
    >
     <i class="fas fa-undo mr-2"></i> Voltar para Busca
    </button>
   </div>
  </div>
 </div>
</template>