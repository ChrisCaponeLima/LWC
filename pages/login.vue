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
// useRuntimeConfig não é necessário se não usarmos API_BASE_URL
// import { useRuntimeConfig } from '#app'; 

definePageMeta({
 layout: false 
});

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

 try {
  // Comunicação OK, sem baseURL
  const apiResponse = await $fetch('/api/auth', { 
   method: 'POST', 
   body: credentials,
   headers: { 'Content-Type': 'application/json' }
  });
    
    // Tentativa de obter o token (que deve vir do backend)
    const tokenValue = apiResponse.token || apiResponse.authToken;

  // Mapeamento da resposta (usando o que o backend retornou)
  const userPayload = {
   userId: apiResponse.userId,
   username: apiResponse.username,
   apelido: apiResponse.apelido || apiResponse.username,
   heightCm: apiResponse.heightCm, 
   initialWeight: apiResponse.initialWeight || 90.0,
   email: apiResponse.email || '', 
  };
  
  const loginPayload = {
    token: tokenValue, // Usamos o valor obtido acima
    user: userPayload
  };

    // CORREÇÃO: Lógica de validação que lança um erro específico
  if (loginPayload.token && loginPayload.user.userId) {
   // SUCESSO!
   authStore.login(loginPayload); 
   await navigateTo('/', { replace: true });
  } else {
        // Agora, se a resposta foi 200, mas sem token, lançamos um erro claro.
   throw new Error('ERRO_TOKEN: O login foi bem-sucedido, mas o token de autenticação não foi encontrado na resposta do servidor.');
  }

 } catch (e) {
  // Tratamento de erro detalhado.
  const status = e.response?.status;
  const message = e.response?._data?.message;

  if (status === 401 || status === 403) {
   // Credenciais inválidas (Funciona OK)
   error.value = message || 'Nome de usuário ou senha incorretos.';
  } else if (e.message.includes('ERRO_TOKEN')) {
        // Diagnóstico Final: O backend precisa ser corrigido para enviar o token.
        error.value = e.message;
    } else {
        // Problema de rede real (O backend está offline, roteamento mudou, etc.)
     console.error('Falha de Comunicação/Roteamento no Nuxt:', e);
     error.value = 'Falha na comunicação com o servidor. O backend está online?';
  }
 } finally {
  isLoading.value = false;
 }
};
</script>