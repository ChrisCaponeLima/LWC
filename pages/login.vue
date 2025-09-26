<template>
  <div class="min-h-screen flex flex-col">
    <header class="flex justify-between items-center p-4 shadow-md bg-white">
      <h1 class="text-xl font-bold text-gray-800">Login</h1>
    </header>

    <div class="flex flex-grow justify-center items-center p-4 bg-gray-50">
      <ClientOnly>
        <div class="w-full max-w-md form-card login-card p-8 bg-white rounded-xl shadow-2xl">
          <h2 class="text-2xl font-bold text-center mb-6 text-gray-800">Acesse sua conta</h2>
          
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700">Nome de Usuário</label>
              <input
                type="text"
                id="username"
                v-model="credentials.username"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                required
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                id="password"
                v-model="credentials.password"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                required
              />
            </div>
            
            <div v-if="error" class="text-red-600 text-sm p-2 bg-red-100 rounded">
              {{ error }}
            </div>

            <div class="pt-4">
              <button
                type="submit"
                :disabled="isLoading"
                class="w-full py-3 bg-btn-secundario text-btn-font-secundario rounded-md font-bold hover:opacity-80 disabled:bg-btn-desativado disabled:text-btn-font-desativado transition duration-150"
              >
                {{ isLoading ? 'Entrando...' : 'Entrar' }}
              </button>
            </div>
          </form>
        </div>
        <template #fallback>
          <div class="text-center p-8">Carregando formulário de login...</div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRuntimeConfig } from '#app'; 

definePageMeta({
layout: false 
});

const config = useRuntimeConfig();
const API_BASE_URL = config.public.apiBaseUrl;

const authStore = useAuthStore();
const credentials = reactive({
username: '',
password: ''
});
const isLoading = ref(false);
const error = ref(null);

const handleLogin = async () => {
error.value = null;
isLoading.value = true;

// CRÍTICO: Verifica se a URL foi configurada corretamente
if (!API_BASE_URL || API_BASE_URL.includes('seu-dominio')) {
 error.value = 'ERRO DE CONFIGURAÇÃO: API_BASE_URL não está definida corretamente.';
 isLoading.value = false;
 return;
}

try {
 // CORREÇÃO: Usa o endpoint correto (/api/auth)
 const apiResponse = await $fetch('/api/auth', { 
 baseURL: API_BASE_URL, 
 method: 'POST', 
 body: credentials,
 headers: { 'Content-Type': 'application/json' }
 });

    // CORREÇÃO: Mapeamento da resposta da API (direto do handler) para o Pinia Store.
    const loggedInUser = {
        userId: apiResponse.userId,
        username: apiResponse.username,
        role: apiResponse.role,
        photo_perfil_url: apiResponse.photoUrl || 'https://api.iconify.design/solar:user-circle-bold-duotone.svg',
        apelido: apiResponse.apelido || apiResponse.username,
        
        // Mapeamento de campos esperados (heightCm)
        heightCm: apiResponse.heightCm, 
        
        // CRÍTICO: initialWeight. Usamos o valor retornado ou 90.0 como fallback.
        initialWeight: apiResponse.initialWeight || 90.0, 
    };
 
 if (loggedInUser && loggedInUser.userId) {
 authStore.login(loggedInUser); 
 await navigateTo('/', { replace: true });
 } else {
 throw new Error('Resposta de login inválida do servidor.');
 }

} catch (e) {
 // Tratamento de erro detalhado.
 const status = e.response?.status;
 const message = e.response?._data?.message;

 if (status === 401 || status === 403) {
 error.value = message || 'Nome de usuário ou senha incorretos.';
 } else if (status === 404) {
 error.value = 'Endpoint de login não encontrado. Verifique se o domínio da API está correto.';
 } else {
 error.value = e.message || 'Falha na comunicação com o servidor. Verifique se o backend está online.';
 }
} finally {
 isLoading.value = false;
}
};
</script>

<style scoped>
.form-card {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>