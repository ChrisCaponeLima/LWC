// /pages/chat/debug-redirect.vue - V1.3 - Corrigindo erro de renderização do computed no template.

<script setup>
import { useRoute } from '#app';
import { navigateTo } from '#app';
import Header from '~/components/Header.vue';
import { computed } from 'vue';

const route = useRoute();
const partnerId = route.query.partnerId || 'N/A';
const partnerName = route.query.partnerName || 'N/A';
const partnerPhone = route.query.partnerPhone || 'N/A';
const currentUserId = route.query.currentUserId || 'N/A';
const status = route.query.status || 'N/A';

// Mapeamento para exibição de classes e textos - Retorna um objeto
const statusDisplay = computed(() => {
    // Usamos o 'status' da query string que vem do index.vue, que é 'FOUND' ou 'NOT_FOUND'
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
    
    // Default/Error
    return {
        text: '⚠️ Status Indefinido.',
        containerClass: 'bg-red-100 border-l-4 border-red-500',
        textClass: 'text-red-700'
    };
});

// Ações a serem tomadas após o debug
const redirectToChat = () => {
    // Apenas redireciona se um ID de parceiro foi encontrado
    if (partnerId && partnerId !== 'N/A') {
        // Redirecionamento para a tela de chat real
        navigateTo(`/chat/${partnerId}`);
    } else {
        alert('Não é possível redirecionar: ID do parceiro não disponível.');
        // Opcional: Voltar para a tela de busca ou index do chat
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
                  <div class="bg-white shadow-xl rounded-xl p-6 space-y-4">
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