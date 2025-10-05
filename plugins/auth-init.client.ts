// /plugins/auth-init.client.ts - V1.4 - Garante init() no cliente (idempotente)
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  // Segurança: apenas tenta inicializar se ainda não inicializado
  if (!authStore.initialized && process.client) {
    await authStore.init();
  }
});
