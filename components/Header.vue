<template>
  <header class="flex justify-between items-center p-4 shadow-md bg-white">
    <h1 class="text-xl font-bold text-gray-800">LWC - LIMA</h1>
    <div class="flex items-center relative">
      <div class="group">
        <button @click="toggleMenu" class="flex items-center no-underline text-gray-700 focus:outline-none">
          <strong class="mr-2">{{ authStore.username }}</strong>
          <img
            :src="authStore.photoUrl"
            alt="Foto de Perfil"
            class="h-8 w-8 rounded-full"
          />
        </button>

        <ul v-if="isMenuOpen" class="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <li><NuxtLink to="/profile" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">Meu Perfil</NuxtLink></li>
          <li v-if="authStore.isAdmin" class="border-t border-gray-200 mt-2 pt-2">
            <NuxtLink to="/user_management" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">Gerenciar Usuários</NuxtLink>
          </li>
          <li><hr class="border-t border-gray-200 my-2"></li>
          <li><a @click.prevent="logout" class="block px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer">Sair</a></li>
        </ul>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const logout = () => {
  authStore.logout();
  isMenuOpen.value = false;
};
</script>