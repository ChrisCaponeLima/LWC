// /components/chat/ModalSearchPartner.vue - V1.1 - Alterado para emitir o objeto completo de resposta (ID, Nome e Telefone digitado).
<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
    <div 
      class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 scale-100"
      @click.stop
    >
      <div class="flex justify-between items-start border-b pb-3 mb-4">
        <h3 class="text-xl font-bold text-gray-800">
          Iniciar Nova Conversa
        </h3>
        <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <form @submit.prevent="searchPartner" class="space-y-4">
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
            Buscar por Telefone (DDD + Número)
          </label>
          <input 
            type="tel" 
            id="phone" 
            v-model="phoneNumber" 
            placeholder="Ex: 11987654321"
            :disabled="isLoading"
            class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
            required
          />
        </div>

        <div v-if="errorMessage" class="text-red-600 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
          <i class="fas fa-exclamation-circle mr-2"></i> {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="text-green-600 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
          <i class="fas fa-check-circle mr-2"></i> {{ successMessage }}
        </div>

        <button 
          type="submit"
          :disabled="isLoading || !phoneNumber.trim()"
          class="w-full flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 font-semibold disabled:opacity-50"
        >
          <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
          {{ isLoading ? 'Buscando...' : 'Buscar Usuário' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isOpen: Boolean,
});

// ALTERADO: Novo nome de evento para emitir o objeto completo
const emit = defineEmits(['close', 'partner-found-data']); 

const phoneNumber = ref('');
const isLoading = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);

const authToken = useCookie('authToken');

const closeModal = () => {
  phoneNumber.value = '';
  errorMessage.value = null;
  successMessage.value = null;
  emit('close');
};

const searchPartner = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;
  
  const token = authToken.value || (typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null);

  if (!token) {
    errorMessage.value = 'Erro de autenticação. Faça login.';
    isLoading.value = false;
    return;
  }

  try {
    const cleanedPhone = phoneNumber.value.replace(/\D/g, ''); // Garante que o telefone limpo é usado

    // Chamada para a nova API de busca por telefone
    const response = await $fetch('/api/users/find-by-phone', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        phone: cleanedPhone 
      }
    });
    
    // Supondo que a API retorna { partnerId: number, partnerName: string }
    if (response && response.partnerId) {
      successMessage.value = `Usuário ${response.partnerName} encontrado! Redirecionando...`;
      
      // EMITE O OBJETO COMPLETO
      const dataToEmit = {
        partnerId: response.partnerId,
        partnerName: response.partnerName,
        phoneNumber: cleanedPhone // Adiciona o telefone digitado para rastreio
      };
      
      setTimeout(() => {
        emit('partner-found-data', dataToEmit); 
      }, 800); 
      
    } else {
      errorMessage.value = 'Nenhum usuário encontrado com este telefone.';
    }

  } catch (e) {
    errorMessage.value = e.data?.message || 'Falha na busca. Verifique o número.';
    console.error("Erro searchPartner:", e);
  } finally {
    isLoading.value = false;
  }
};
</script>