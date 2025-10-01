<template>
  <header class="flex justify-between items-center p-4 shadow-md bg-white">
    <h1 class="text-xl font-bold text-gray-800">LWC - LIMA</h1>

    <ClientOnly>
      <div v-if="authStore.user" class="flex items-center relative">
        <div class="group">
          <button @click="toggleMenu" class="flex items-center no-underline text-gray-700 focus:outline-none">
            <strong class="mr-2">{{ displayFirstName }}</strong>
            <img
              :src="profilePhotoUrl" 
              alt="Foto de Perfil"
              
              class="h-16 w-16 rounded-full object-cover flex-shrink-0 border-4 border-red-500"
            />
          </button>

          <ul v-if="isMenuOpen" class="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <li><NuxtLink to="/profile" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">Meu Perfil</NuxtLink></li>
            
            <li v-if="authStore.user.role?.toLowerCase() === 'admin'" class="border-t border-gray-200 mt-2 pt-2">
              <NuxtLink to="/user_management" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">Gerenciar Usuários</NuxtLink>
            </li>
            
            <li><hr class="border-t border-gray-200 my-2"></li>
            <li><a @click.prevent="logout" class="block px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer">Sair</a></li>
          </ul>
        </div>
      </div>
      <div v-else class="text-gray-500">Carregando...</div>
    </ClientOnly>

  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { navigateTo } from '#app'; 

const authStore = useAuthStore();
const isMenuOpen = ref(false);

// Ícone SVG de usuário universal como fallback (base64)
const DEFAULT_AVATAR_URL = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#a0a0a0"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

// Lógica do Primeiro Nome (Correta)
const displayFirstName = computed(() => {
    const sourceName = authStore.user?.username || 'Usuário';
    return sourceName.split(' ')[0];
});

// Lógica da Foto (Com trim() e fallback)
const profilePhotoUrl = computed(() => {
    const url = authStore.user?.photoUrl?.trim();
    
    // Verifica se a URL é minimamente válida.
    let finalUrl = DEFAULT_AVATAR_URL;
    if (typeof url === 'string' && url.length > 5 && url.startsWith('http')) {
        finalUrl = url;
    }
    
    // 🛑 LOG DE DIAGNÓSTICO
    console.log('URL da Foto (Debug Final):', finalUrl);
    
    return finalUrl;
});


const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const logout = () => {
  authStore.logout();
  navigateTo('/login', { replace: true }); 
};
</script>