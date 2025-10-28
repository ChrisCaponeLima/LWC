// /pages/login.vue - V1.4 - Correção: Remoção da extração de primeiro nome, envia o campo username completo.
<template>
<div class="min-h-screen flex flex-col">
<header class="flex justify-between items-center p-4 shadow-md bg-white">
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
import { useRouter } from 'vue-router'; // 🚨 IMPORTAÇÃO NECESSÁRIA

definePageMeta({
layout: false 
});

const authStore = useAuthStore();
const router = useRouter(); // 🚨 INICIALIZAÇÃO NECESSÁRIA

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
 // 🚨 CORREÇÃO CRÍTICA: Enviar o objeto de credenciais diretamente.
 const loginPayloadToSend = {
  username: credentials.username.trim(), // Limpa espaços em branco acidentais
  password: credentials.password
 };

const apiResponse = await $fetch('/api/auth', { 
method: 'POST', 
body: loginPayloadToSend,
headers: { 'Content-Type': 'application/json' }
});
  
 // 🚨 Checagem Crítica do Token e userId (mantida, é uma boa prática)
 if (!apiResponse || !apiResponse.token || !apiResponse.userId) {
  throw new Error('AUTH_PAYLOAD_INVALID: Token ou ID de usuário ausente na resposta da API.');
 }

// Mapeia os campos necessários da resposta da API de forma resiliente
const userPayload = {
id: apiResponse.userId, 
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

// Chama o login, que persistirá os dados e definirá isAuthenticated = true
authStore.login(authPayload); 

// 🚀 Redirecionamento programático
await router.push({ path: '/dashboard', replace: true });

// 🚨 CLEANUP: Limpar a senha (embora o redirecionamento já remova a página do histórico)
credentials.password = '';


} catch (e) {
const status = e.response?.status;
const message = e.response?._data?.message;

if (status === 401 || status === 403) {
error.value = message || 'Nome de usuário ou senha incorretos.';
} else if (e.message && e.message.includes('AUTH_PAYLOAD_INVALID')) {
  // Trata o erro específico de payload ausente
  error.value = 'Resposta de login incompleta. Contate o administrador do sistema.';
 } else {
error.value = 'Falha na comunicação com o servidor. Verifique sua conexão ou tente novamente.';
  console.error('Erro durante o login:', e);
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