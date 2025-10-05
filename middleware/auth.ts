// /middleware/auth.ts - V2.1 - Skip SSR, aguarda init() no cliente antes de validar
import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // IMPORTANTE: não bloqueie no servidor (SSR) — deixe o cliente decidir depois de reidratar.
  if (process.server) return;

  const authStore = useAuthStore();

  if (!authStore.initialized) {
    // init é idempotente e trata se já houve reidratação pelo plugin de persistência
    await authStore.init();
  }

  // Rotas que requerem autenticação (adicione outras quando necessário)
  const protectedRoutes = ['/'];

  if (protectedRoutes.includes(to.path) && !authStore.isAuthenticated) {
    return navigateTo('/login');
  }
});
