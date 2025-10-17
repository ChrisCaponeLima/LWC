// /pages/chat/[partnerId].vue - V5.8 - Reforço no Long Polling: Garante que o polling antigo é abortado no início e no fim do envio, simplificando o fluxo de lastId.

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, navigateTo } from '#app';
import { useStorage } from '@vueuse/core';
import { jwtDecode } from 'jwt-decode'; 

// --- Variáveis de Estado (Reativas) ---
// ... (Variáveis de estado permanecem as mesmas) ...
const route = useRoute();
const partnerId = parseInt(route.params.partnerId);
const authToken = useStorage('authToken', ''); 
const currentUserId = ref(null);

const roomId = ref(null);
const partnerName = ref('Carregando Contato...');
const messages = ref([]);
const messagesContainer = ref(null); 

const messageContent = ref('');
const sendingMessage = ref(false);

const isLoading = ref(true); 
const error = ref(null); 

// Estados de Arquivo
const fileInput = ref(null);
const selectedFile = ref(null);
const isUploading = ref(false); 
const pollingController = ref(null); 

// --- Funções de Utilitário (Manter) ---
const scrollToBottom = (smooth = true) => {
nextTick(() => {
 if (messagesContainer.value) {
 setTimeout(() => {
  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
 }, 50); 
 }
});
};

const formatTime = (isoString) => {
if (!isoString) return '';
return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const getProxyUrl = (url) => {
return url;
};
const viewImage = (url) => {
window.open(url, '_blank');
};
const formatBytes = (bytes, decimals = 2) => {
if (bytes === 0) return '0 Bytes';
const k = 1024;
const dm = decimals < 0 ? 0 : decimals;
const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
const i = Math.floor(Math.log(bytes) / Math.log(k));
return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
const handleFileSelect = (event) => {
selectedFile.value = event.target.files[0];
};

const removeFile = () => {
selectedFile.value = null;
if (fileInput.value) {
 fileInput.value.value = ''; // Limpa o input file
}
};


// --- Funções de Carregamento e Autenticação (Manter) ---
const loadUserData = async () => {
const token = authToken.value;

if (!token) {
 error.value = 'Você precisa estar logado para acessar o chat.';
 isLoading.value = false;
 return navigateTo('/chat', { replace: true });
}

try {
 const decoded = jwtDecode(token);
 currentUserId.value = decoded.userId; 

 if (isNaN(partnerId) || partnerId === currentUserId.value) {
 error.value = 'ID de parceiro de chat inválido.';
 isLoading.value = false;
 return navigateTo('/chat', { replace: true });
 }
 return true; 
 
} catch (e) {
 error.value = 'Token de autenticação inválido. Por favor, faça login novamente.';
 isLoading.value = false;
 console.error('Erro ao decodificar token:', e);
 return navigateTo('/chat', { replace: true });
}
};

const fetchRoomAndMessages = async () => {
if (!currentUserId.value) return; 

isLoading.value = true;
error.value = null;

try {
 const response = await $fetch(`/api/chat/rooms/${partnerId}`, { 
 method: 'GET',
 headers: { Authorization: `Bearer ${authToken.value}` }
 });
 
 roomId.value = response.roomId;
 partnerName.value = response.partnerName;
 messages.value = response.messages;
 
 error.value = null; 

} catch (e) {
 error.value = e.data?.message || e.message || 'Falha desconhecida ao comunicar com a API de chat.';
 console.error('Erro ao carregar sala de chat:', e);
 
} finally {
 isLoading.value = false;
 
 if (error.value) {
 partnerName.value = 'Erro de Carga'; 
 }
 
 if (!error.value) {
 scrollToBottom(false);
 startLongPolling(); 
 }
}
};

// --- Funções de Long Polling (Com Correção do Fluxo) ---
const startLongPolling = async () => {
// 🟢 REFORÇO: Sempre abortar qualquer poll anterior antes de iniciar um novo
if (pollingController.value) {
 pollingController.value.abort();
}
pollingController.value = new AbortController();
const signal = pollingController.value.signal;

if (!roomId.value) return;

while (!signal.aborted) {
 try {
  // Pega o último ID real (não temporário)
  const lastMessage = messages.value
   .filter(m => !m.is_temp) 
   .slice(-1)[0];
  
  const lastId = lastMessage?.id || 0;
  
  const newMessages = await $fetch(`/api/chat/rooms/${partnerId}/messages?lastId=${lastId}`, { 
   headers: { Authorization: `Bearer ${authToken.value}` },
   signal 
  });

  if (Array.isArray(newMessages) && newMessages.length > 0) {
   console.log(`[Polling] Recebeu ${newMessages.length} novas mensagens.`);
   
   // Adiciona apenas as mensagens que AINDA NÃO EXISTEM na lista
   // 🟢 V5.8: Garante que as novas mensagens (com IDs reais) não substituam IDs temporários
   const existingRealIds = new Set(messages.value.filter(m => !m.is_temp).map(m => m.id));

   newMessages.forEach(newMessage => {
    if (!existingRealIds.has(newMessage.id)) {
     // Tenta encontrar uma mensagem temporária para substituir (se houver)
     const tempIndex = messages.value.findIndex(m => m.is_temp && m.sender_id === newMessage.sender_id && m.content === newMessage.content);
     
     if (tempIndex !== -1) {
      messages.value[tempIndex] = newMessage;
     } else {
      messages.value.push(newMessage);
     }
    }
   });

   scrollToBottom();
  }

 } catch (e) {
  if (e.name === 'AbortError') {
   break; 
  }
  console.error('[Long Polling] Erro ou Timeout. Tentando novamente...', e);
  await new Promise(resolve => setTimeout(resolve, 5000));
 }
}
};


// --- Função Enviar Mensagem (Revisada para Inserção Temporária e Polling) ---
const sendMessage = async () => {
if ((!messageContent.value.trim() && !selectedFile.value) || sendingMessage.value || isUploading.value) {
 return;
}

// 🟢 CRÍTICO: Aborta o polling imediatamente antes do envio
if (pollingController.value) {
 pollingController.value.abort();
}

sendingMessage.value = true;
error.value = null;

const originalContent = messageContent.value; 
const tempId = Date.now(); 

const tempMessage = {
 id: tempId,
 room_id: roomId.value,
 sender_id: currentUserId.value,
 content: originalContent, 
 created_at: new Date().toISOString(),
 is_read: false,
 is_temp: true, // Marca como temporária
 message_files: selectedFile.value ? [{ file_url: URL.createObjectURL(selectedFile.value) }] : [] 
};

// 1. Adiciona Mensagem Temporária
messages.value.push(tempMessage);
scrollToBottom();

try {
 const payload = {
 roomId: roomId.value,
 content: originalContent, 
 };

 // 2. Envia para o servidor (retorno NÃO é mais necessário)
 await $fetch('/api/chat/send', {
 method: 'POST',
 headers: { Authorization: `Bearer ${authToken.value}` },
 body: payload,
 });

 // 3. Sucesso: A mensagem temporária permanece. O Long Polling a substituirá (ou a removerá e a trará de volta).
 // ⚠️ IMPORTANTE: Manter o tempMessage aqui. O Polling fará o trabalho de limpeza/substituição.
 
 messageContent.value = ''; 
 removeFile();

} catch (e) {
 // 4. Falha: Restaura Input e Remove a Temp Message
 console.error('Erro ao enviar mensagem:', e);
 error.value = e.data?.message || 'Falha ao enviar mensagem.';
 
 messageContent.value = originalContent; 
 
 messages.value = messages.value.filter(m => m.id !== tempId);
 
} finally {
 // 5. Finaliza e Reinicia o Polling
 sendingMessage.value = false;
 scrollToBottom();
 
 // 🟢 RECOMEÇA O POLLING! (Ele agora tentará substituir/adicionar)
 startLongPolling(); 
}
};

// --- Ciclo de Vida do Componente (Manter) ---

onMounted(async () => {
const canProceed = await loadUserData(); 

if (canProceed === true) {
 await fetchRoomAndMessages();
}
});

onUnmounted(() => {
if (pollingController.value) {
 pollingController.value.abort();
}
});


// --- Exposição de Variáveis para o Template (Manter) ---
defineExpose({
scrollToBottom,
});
</script>

<template>
<Header />
<div class="min-h-screen bg-gray-100 py-8">
 <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

 <NuxtLink to="/chat" class="text-indigo-600 hover:text-indigo-800 mb-6 inline-block font-semibold">
  ← Voltar
 </NuxtLink>

 <div class="bg-white shadow-xl rounded-xl flex flex-col h-[80vh]">
  
  <div class="p-4 border-b bg-gray-50 rounded-t-xl">
  <h1 class="text-xl font-bold text-gray-800">
   Chat com {{ partnerName || 'Carregando Contato...' }}
  </h1>
  </div>

  <div v-if="isLoading" class="flex-1 flex items-center justify-center text-gray-500">
  <i class="fas fa-spinner fa-spin text-4xl text-indigo-500 mr-2"></i>
  Carregando mensagens...
  </div>
  
  <div v-else-if="error" class="flex-1 flex items-center justify-center p-4 text-red-600 bg-red-50">
  <i class="fas fa-exclamation-triangle mr-2"></i> {{ error }}
  <NuxtLink v-if="error && error !== 'ID de parceiro de chat inválido.' && error !== 'Token de autenticação inválido. Por favor, faça login novamente.'" to="/chat" class="text-indigo-600 hover:text-indigo-800 ml-3 font-semibold underline">
   Voltar para a lista
  </NuxtLink>
  </div>

  <div v-else class="flex-1 overflow-y-auto p-4 space-y-4" ref="messagesContainer">
     
     <div v-if="messages.length === 0" class="text-center p-10 text-gray-500">
      <i class="fas fa-handshake text-4xl mb-3 text-indigo-400"></i>
      <p class="text-lg font-semibold">Inicie a conversa!</p>
      <p class="text-sm text-gray-600">Envie a primeira mensagem para **{{ partnerName }}**.</p>
     </div>

  <div 
   v-for="message in messages" 
   :key="message.id" 
   :class="['flex', message.sender_id === currentUserId ? 'justify-end' : 'justify-start']"
  >
   <div 
   :class="[
    'max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow-md',
    message.sender_id === currentUserId 
    ? 'bg-indigo-600 text-white rounded-br-none' + (message.is_temp ? ' opacity-50' : '') 
    : 'bg-gray-200 text-gray-800 rounded-tl-none'
   ]"
   >
   <p v-if="message.content" class="whitespace-pre-wrap">{{ message.content }}</p>
   
   <div v-if="message.message_files && message.message_files.length > 0" class="mt-2">
    <p :class="['text-xs italic mb-1', message.sender_id === currentUserId ? 'text-indigo-200' : 'text-gray-500']">
    <i class="fas fa-lock mr-1"></i> Conteúdo Privado:
    </p>
    <img 
    :src="getProxyUrl(message.message_files[0].file_url)" 
    alt="Imagem Privada" 
    class="rounded-lg max-h-40 w-auto object-cover cursor-pointer"
    @click="viewImage(message.message_files[0].file_url)"
    />
   </div>

   <p :class="['mt-1 text-xs', message.sender_id === currentUserId ? 'text-indigo-200' : 'text-gray-500']">
    {{ formatTime(message.created_at) }}
   </p>
   </div>
  </div>

  <div v-if="sendingMessage" class="flex justify-end">
   <div class="max-w-xs p-3 rounded-xl bg-indigo-200 text-indigo-800 rounded-br-none text-sm italic">
   <i class="fas fa-spinner fa-spin mr-1"></i> Enviando...
   </div>
  </div>
  </div>

  <div class="p-4 border-t bg-white rounded-b-xl">
  <div v-if="selectedFile" class="mb-3 p-3 border-l-4 border-indigo-500 bg-indigo-50 flex justify-between items-center text-sm rounded-lg">
   <span>
   <i class="fas fa-paperclip mr-2"></i> 
   Arquivo Anexado: {{ selectedFile.name }} ({{ formatBytes(selectedFile.size) }})
   </span>
   <button type="button" @click="removeFile" class="text-red-500 hover:text-red-700 ml-3">
   <i class="fas fa-times"></i>
   </button>
  </div>

  <form @submit.prevent="sendMessage" class="flex space-x-3">
   <input 
   type="file" 
   ref="fileInput" 
   @change="handleFileSelect" 
   accept="image/*,video/*"
   class="hidden"
   />
   <button 
   type="button" 
   @click="fileInput.click()"
   :disabled="isUploading || sendingMessage || isLoading || !!error"
   class="text-gray-500 hover:text-indigo-600 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
   >
   <i :class="['fas fa-paperclip text-xl', {'fa-spinner fa-spin': isUploading}]"></i>
   </button>

   <input 
   v-model="messageContent"
   type="text"
   placeholder="Digite sua mensagem..."
   class="flex-1 border-gray-300 rounded-full py-2 px-4 focus:ring-indigo-500 focus:border-indigo-500"
   :disabled="isUploading || sendingMessage || isLoading || !!error"
   />
   
   <button
   type="submit"
   :disabled="(!(messageContent || '').trim() && !selectedFile) || sendingMessage || isUploading || isLoading || !!error" 
   class="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-full shadow-md hover:bg-indigo-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
   >
   <i class="fas fa-paper-plane"></i>
   </button>
  </form>
  </div>

 </div>
 </div>
</div>
</template>