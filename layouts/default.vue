<template>
    <div>
      <slot />
    </div>
  </template>
  
  <script setup>
  import { useAuthStore } from '~/stores/auth';
  
  const authStore = useAuthStore();
  
  // Chamado automaticamente antes de montar o componente
  // Garante que o estado do usuário seja carregado do localStorage
  authStore.loadUser();
  
  // Verifica se o usuário está logado e, se não estiver, redireciona para a página de login.
  // Em um projeto real, você usaria Middleware para isso, mas esta é a forma mais simples.
  if (!authStore.isAuthenticated && process.client) {
    // Simulação de que a página inicial (index.vue) exige login
    // Note que '/login' é um componente de página que precisaria ser criado
    // Se estiver na página de login, não redireciona
    if (useRoute().path !== '/login') {
      navigateTo('/login', { replace: true });
    }
  }
  
  </script>