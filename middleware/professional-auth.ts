// /middleware/professional-auth.ts - V4.4 - Aguarda hidratação completa da store (token + role) antes da validação de acesso.

import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()
  const allowedRoles = ['profissional', 'admin', 'owner']

  // ⚙️ Garante inicialização da store antes da checagem
  if (!authStore.initialized) {
    await authStore.init()
  }

  // 🔁 Aguarda token ser carregado do localStorage
  if (process.client && !authStore.token) {
    await new Promise((resolve) => {
      const checkToken = setInterval(() => {
        if (authStore.token) {
          clearInterval(checkToken)
          resolve(true)
        }
      }, 50)
      // timeout de segurança (1,5s)
      setTimeout(() => {
        clearInterval(checkToken)
        resolve(true)
      }, 1500)
    })
  }

  // 🔁 Aguarda papel ser definido (quando carregado de localStorage)
  if (process.client && !authStore.user?.role) {
    await new Promise((resolve) => {
      const checkRole = setInterval(() => {
        if (authStore.user?.role) {
          clearInterval(checkRole)
          resolve(true)
        }
      }, 50)
      // timeout de segurança (1,5s)
      setTimeout(() => {
        clearInterval(checkRole)
        resolve(true)
      }, 1500)
    })
  }

  // 🧩 Releitura segura após possível atraso de hidratação
  const userRole = authStore.user?.role || 'Não Carregado/Sem Papel'
  const hasToken = !!authStore.token

  // ✅ Fallback: se o usuário tiver token e role ainda indefinido,
  // mantém temporariamente acesso até o Pinia definir o papel real.
  const isAuthorized =
    allowedRoles.includes(userRole) ||
    (hasToken && userRole === 'Não Carregado/Sem Papel')

  console.warn(`[PROF-AUTH] Role: ${userRole}`)
  console.warn(`[PROF-AUTH] Token: ${hasToken}`)
  console.warn(`[PROF-AUTH] Autorizado: ${isAuthorized}`)

  if (!hasToken) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (!isAuthorized) {
    return navigateTo({ path: '/dashboard', query: { error: 'unauthorized' } })
  }

  // ✅ Caso válido, segue normalmente
})
