<template>
    <div>
      <Header />
  
      <div class="container mx-auto px-4 my-8">
        <h2 class="text-3xl font-bold text-gray-800 mb-8 text-center">Meu Perfil e Dados Essenciais</h2>
  
        <div class="max-w-xl mx-auto p-8 bg-white rounded-xl shadow-2xl space-y-6">
          
          <div class="flex flex-col items-center">
            <img
              :src="userProfile.photo_perfil_url"
              alt="Foto de Perfil"
              class="h-24 w-24 rounded-full mb-4 object-cover border-4 border-gray-100"
            />
            <h3 class="text-xl font-semibold text-gray-800">{{ userProfile.username }}</h3>
            <p class="text-sm text-gray-500 capitalize">{{ userProfile.role }}</p>
          </div>
  
          <form @submit.prevent="saveProfile" class="space-y-6">
            
            <div>
              <label for="height" class="block text-sm font-medium text-gray-700">
                Altura (cm)
              </label>
              <input
                type="number"
                id="height"
                v-model.number="userProfile.heightCm"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                required
              />
            </div>
  
            <div>
              <label for="initialWeight" class="block text-sm font-medium text-gray-700">
                Peso Inicial (kg)
              </label>
              <input
                type="number"
                step="0.01"
                id="initialWeight"
                v-model.number="userProfile.initialWeight"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                required
              />
            </div>
  
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                id="email"
                :value="userProfile.email"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>
  
            <div v-if="statusMessage" :class="['p-3 rounded-md text-center', statusType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
              {{ statusMessage }}
            </div>
  
            <div class="pt-4">
              <button
                type="submit"
                :disabled="isLoading"
                class="w-full py-3 bg-btn-secundario text-btn-font-secundario rounded-md font-bold hover:opacity-80 disabled:bg-btn-desativado disabled:text-btn-font-desativado transition duration-150"
              >
                {{ isLoading ? 'Salvando...' : 'Salvar Alterações' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  </template>
  
  <script setup>
  import { ref, reactive } from 'vue';
  import { useAuthStore } from '~/stores/auth';
  
  // 1. Proteção de Rota
  definePageMeta({
    middleware: ['auth'] 
  });
  
  const authStore = useAuthStore();
  const isLoading = ref(false);
  const statusMessage = ref('');
  const statusType = ref('');
  
  // 2. Cria uma cópia reativa dos dados do usuário para edição
  // Usamos a função spread para criar uma cópia e evitar editar o store diretamente antes de salvar
  const userProfile = reactive({
    ...authStore.user,
    heightCm: authStore.user?.heightCm || 170, // Valor padrão se não existir
    initialWeight: authStore.user?.initialWeight || 90.0, // Valor padrão
    // Adicione outros campos do perfil aqui se necessário
  });
  
  const saveProfile = async () => {
    isLoading.value = true;
    statusMessage.value = '';
  
    // --- Lógica de Atualização (Simulação) ---
    // Em uma aplicação real, você faria uma chamada PATCH para sua API aqui
    
    // 1. Simula a chamada de API
    await new Promise(resolve => setTimeout(resolve, 1000)); 
  
    // 2. Verifica se houve alteração (simulação de sucesso)
    const isChanged = userProfile.heightCm !== authStore.user.heightCm || userProfile.initialWeight !== authStore.user.initialWeight;
    
    if (isChanged) {
      // 3. Se for bem-sucedido, atualiza o Store (simulando a resposta da API)
      authStore.login({ // Usamos 'login' para sobrescrever o estado atual do usuário
        ...authStore.user, // Mantém dados como username, role
        heightCm: userProfile.heightCm,
        initialWeight: userProfile.initialWeight,
      });
  
      statusMessage.value = 'Perfil atualizado com sucesso!';
      statusType.value = 'success';
    } else {
      statusMessage.value = 'Nenhuma alteração detectada.';
      statusType.value = 'success';
    }
  
    isLoading.value = false;
  };
  </script>