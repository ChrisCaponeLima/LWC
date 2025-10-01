// ~/plugins/auth-init.client.ts

import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin(nuxtApp => {
  // Chamada de inicialização da store APENAS no navegador (client-side)
  const authStore = useAuthStore();
  // Esta chamada agora deve funcionar
  authStore.init(); 
});