// pages/login.vue - V1.2 - Usa apenas o primeiro nome do usuário para efetuar o login, preservando o case
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
    // 1. Obtém o valor completo do campo (ex: 'Patricia Santos')
    const fullName = credentials.username.trim(); 
    
    // 2. Extrai APENAS o primeiro nome, preservando o case e a acentuação.
    // Ex: 'Patricia Santos' -> 'Patricia'
    const firstName = fullName.split(' ')[0];

    // 3. Cria o payload de login com o primeiro nome extraído
    const loginPayloadToSend = {
        username: firstName,
        password: credentials.password
    };

  const apiResponse = await $fetch('/api/auth', { 
   method: 'POST', 
   body: loginPayloadToSend, // 🚨 CORREÇÃO APLICADA: Usa o payload com apenas o primeiro nome
   headers: { 'Content-Type': 'application/json' }
  });

  // Mapeia os campos necessários da resposta da API
  const userPayload = {
   userId: apiResponse.userId,
   username: apiResponse.username,
   apelido: apiResponse.apelido || apiResponse.username,
   heightCm: apiResponse.heightCm, 
   initialWeight: apiResponse.initialWeight || 90.0,
   email: apiResponse.email || '', 
   role: apiResponse.role || 'user', 
   photo_perfil_url: apiResponse.photo_perfil_url || '' 
  };
  
  const authPayload = {
   token: apiResponse.token, 
   user: userPayload
  };

  if (userPayload.userId) {
   authStore.login(authPayload); 
   await navigateTo('/', { replace: true });
  } else {
   throw new Error('Resposta de login inválida do servidor.');
  }

 } catch (e) {
  const status = e.response?.status;
  const message = e.response?._data?.message;

  if (status === 401 || status === 403) {
   error.value = message || 'Nome de usuário ou senha incorretos.';
  } else {
   error.value = 'Falha na comunicação com o servidor. Verifique se o backend está online.';
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