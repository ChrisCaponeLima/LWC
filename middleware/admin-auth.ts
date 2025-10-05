// /middleware/admin-auth.ts - V1.3 - Compatível com init assíncrono e SSR-safe
import { useAuthStore } from '~/stores/auth'
import { defineNuxtRouteMiddleware, navigateTo } from '#app'

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.server) return // evita SSR redirect incorreto

  const authStore = useAuthStore()
  if (!authStore.initialized) await authStore.init()

  if (!authStore.isAuthenticated) return navigateTo('/login')
  if (!authStore.isAdmin && !authStore.isOwner) return navigateTo('/')
})
