// /middleware/admin-auth.ts - V1.4 - Aguarda hidratação completa do Pinia antes de validar autenticação (SSR-safe e Nuxt3-first)
import { useAuthStore } from '~/stores/auth'
import { defineNuxtRouteMiddleware, navigateTo } from '#app'

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.server) return // Evita SSR redirect incorreto

  const authStore = useAuthStore()

  // 🔄 Aguarda inicialização completa (store.init)
  if (!authStore.initialized) {
    await authStore.init()
  }

  // 🔁 Aguarda token e user.role carregarem completamente
  if (process.client && (!authStore.token || !authStore.user?.role)) {
    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (authStore.token && authStore.user?.role) {
          clearInterval(check)
          resolve(true)
        }
      }, 50)
      setTimeout(() => {
        clearInterval(check)
        resolve(true)
      }, 1500) // timeout de segurança
    })
  }

  // 🧩 Releitura segura
  const hasToken = !!authStore.token
  const role = String(authStore.user?.role || '').toLowerCase()

  console.warn(`[ADMIN-AUTH] Role: ${role}`)
  console.warn(`[ADMIN-AUTH] Token: ${hasToken}`)

  if (!hasToken) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  // ✅ Autorização apenas para admin e owner
  if (role !== 'admin' && role !== 'owner') {
    return navigateTo({ path: '/', query: { error: 'unauthorized' } })
  }

  // ✅ Caso válido, segue normalmente
})
