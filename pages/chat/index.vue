// /pages/chat/index.vue - V3.2 - Redirecionamento para a rota de chat final.

<script setup> 
import { ref, onMounted } from 'vue';
import Header from '~/components/Header.vue'; 
import ModalSearchPartner from '~/components/chat/ModalSearchPartner.vue'; 
import { navigateTo } from '#app';
// CORREÇÃO CRÍTICA: Usando Named Import 'jwtDecode'
import { jwtDecode } from 'jwt-decode';

definePageMeta({
 middleware: ['auth']
});

const rooms = ref([]);
const isLoading = ref(true);
const error = ref(null);
const authToken = useCookie('authToken');
const isModalOpen = ref(false); 
const currentUserId = ref(null); 

// Função auxiliar para obter o token de forma robusta
const getAuthToken = () => {
  let token = authToken.value;
  
  if (!token && typeof localStorage !== 'undefined') {
    token = localStorage.getItem('authToken');
  }
  return token;
}

// Função auxiliar para decodificar o token e obter o ID do usuário
const getUserIdFromToken = (token) => {
  if (!token || typeof token !== 'string') {
    console.warn("getUserIdFromToken: Token ausente ou inválido.");
    return null;
  }

  try {
    // MUDANÇA: Usando a função importada diretamente
    const decoded = jwtDecode(token);
    
    console.log("JWT Decodificado:", decoded);
    
    // Prioriza 'userId', depois 'id' como fallback
    return decoded?.userId || decoded?.id || null;

  } catch (e) {
    console.error("Falha ao decodificar token. O token pode estar expirado ou malformado:", e);
    return null;
  }
}

const formatLastActivity = (dateString) => {
 if (!dateString) return '';
 try {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + 
    date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
 } catch {
  return dateString;
 }
};

const fetchRooms = async () => {
 isLoading.value = true;
 error.value = null;
 const token = getAuthToken();

 if (!token) {
  error.value = 'Erro de autenticação. Faça login para ver suas conversas.';
  isLoading.value = false;
  return;
 }

 try {
  const response = await $fetch('/api/chat/rooms', { 
   headers: { Authorization: `Bearer ${token}` }
  });
  
  rooms.value = response;
  
 } catch (e) {
  error.value = e.data?.message || 'Falha ao carregar a lista de conversas.';
  console.error("Erro fetchRooms:", e);
 } finally {
  isLoading.value = false;
 }
};

// MUDANÇA: Redireciona diretamente para a sala de chat com o ID do parceiro
const handlePartnerFound = (response) => {
  const { partnerId, partnerName, phoneNumber } = response;

  isModalOpen.value = false;
  
  if (partnerId) {
    // Redirecionamento final de PRODUÇÃO
    navigateTo(`/chat/${partnerId}`);
  } else {
    // Caso NOT_FOUND: Informa o usuário e permanece na tela atual.
    alert(`Usuário com o telefone ${phoneNumber} não foi encontrado. Tente outro número.`);
  }
};

onMounted(() => {
  const token = getAuthToken();
  if (token) {
    currentUserId.value = getUserIdFromToken(token);
  } else {
    console.warn("onMounted: Token de autenticação ausente ou nulo.");
  }
  
 fetchRooms();
});
</script>

<template>
 <Header pageTitle="Conversas 💬"/>
 <div class="min-h-screen bg-gray-100 py-8">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
         <div class="flex justify-between items-center mb-8 border-b pb-2">
    <button 
     @click="isModalOpen = true"
     class="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 font-semibold text-sm"
    >
     <i class="fas fa-plus mr-2"></i>Nova Conversa💬
    </button>
   </div>

   <div v-if="isLoading" class="text-center p-10 text-gray-500">
    <i class="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
    <p class="mt-2">Carregando conversas...</p>
   </div>
   
   <div v-else-if="error" class="text-red-600 p-4 border border-red-200 rounded bg-red-50 text-center shadow-lg">
    <i class="fas fa-exclamation-triangle mr-2"></i> {{ error }}
   </div>

   <div v-else-if="rooms.length > 0" class="space-y-4">
    <NuxtLink 
     v-for="room in rooms" 
     :key="room.roomId"
     :to="`/chat/${room.partnerId}`"
     class="block bg-white shadow-lg rounded-xl p-4 hover:bg-gray-50 transition duration-150 border border-gray-200"
    >
     <div class="flex items-center justify-between">
      <div class="flex items-center">
       <div class="h-12 w-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
        {{ room.partnerName ? room.partnerName.charAt(0) : '?' }}
       </div>
       
       <div>
        <p class="font-semibold text-gray-800 text-lg">
         {{ room.partnerName }}
        </p>
        <p class="text-sm text-gray-600 truncate max-w-xs sm:max-w-sm mt-1">
         {{ room.lastMessage || 'Nenhuma mensagem.' }}
        </p>
       </div>
      </div>

      <div class="text-right text-xs text-gray-500 flex-shrink-0 ml-4">
       {{ formatLastActivity(room.lastMessageTime) }}
      </div>
     </div>
    </NuxtLink>
   </div>

   <div v-else class="text-center p-10 text-gray-500 bg-white rounded-xl shadow-lg">
    <i class="fas fa-comments text-4xl mb-3 text-indigo-400"></i>
    <p class="text-lg">Você não tem conversas ativas. Inicie uma nova!</p>
    <button 
     @click="isModalOpen = true"
     class="mt-4 bg-indigo-500 text-white px-6 py-2 rounded-full shadow-md hover:bg-indigo-600 transition duration-150 font-semibold"
    >
     Buscar Usuário
    </button>
   </div>
  </div>

 <ModalSearchPartner 
  :isOpen="isModalOpen" 
  @close="isModalOpen = false" 
  @partner-found-data="handlePartnerFound" 
 />
 </div>
</template>