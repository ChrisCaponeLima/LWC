// /pages/profile.vue - V1.1 - Inclusão do Middleware de Autenticação
<template>
 <div class="p-6 bg-white shadow-md rounded-lg text-center">
    <div class="w-24 h-24 mx-auto rounded-full overflow-hidden border border-gray-300 flex items-center justify-center bg-gray-200">
   <img
    v-if="authStore.user?.photo_perfil_url"
    :src="authStore.user.photo_perfil_url"
    alt="Foto de Perfil"
    class="w-full h-full object-cover"
    @error="handleImgError"
   />
   <span
    v-else
    class="text-lg font-bold text-gray-600"
   >
    {{ initials }}
   </span>
  </div>

    <h2 class="mt-4 text-2xl font-semibold text-gray-800">
   {{ authStore.user?.apelido || authStore.user?.username || 'Usuário' }}
  </h2>
  <p class="text-gray-500">{{ authStore.user?.email }}</p>

  <div class="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
   <div>
    <span class="font-bold">Altura:</span>
    <p>{{ authStore.user?.heightCm || '---' }} cm</p>
       </div>
   <div>
    <span class="font-bold">Peso Inicial:</span>
    <p>{{ authStore.user?.initialWeight || '---' }} kg</p>
   </div>
  </div>
 </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth';

// 🛑 Novo: Protege a página usando o middleware.
// Esta proteção só funcionará sem perder a sessão APÓS aplicar a correção do runWithContext.
definePageMeta({
    middleware: ['auth'],
});

const authStore = useAuthStore();

// Iniciais para fallback
const initials = computed(() => {
 if (authStore.user?.apelido) {
  return authStore.user.apelido.charAt(0).toUpperCase();
 }
 if (authStore.user?.username) {
  return authStore.user.username.charAt(0).toUpperCase();
 }
 return 'U';
});

const handleImgError = () => {
 if (authStore.user) {
  // CORREÇÃO: Usar um valor reativo para forçar a atualização da imagem
  authStore.user.photo_perfil_url = '/default-profile.png';
 }
};
</script>