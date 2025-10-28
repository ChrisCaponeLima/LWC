// /middleware/professional-auth.ts - V5.0 - Padronização com admin-auth.ts (SSR-safe)
import { useAuthStore } from '~/stores/auth'
import { defineNuxtRouteMiddleware, navigateTo } from '#app'

export default defineNuxtRouteMiddleware(async (to, from) => {
 // 🛑 Adicionando a guarda SSR para evitar redirecionamento incorreto na renderização inicial
 if (process.server) return 

 const authStore = useAuthStore()
 const allowedRoles = ['profissional', 'admin', 'owner']

 // 🔄 Garante inicialização da store (que tentará carregar token/user do localStorage)
 if (!authStore.initialized) {
  await authStore.init()
 }

 // 🔁 PADRÃO DE ADMIN-AUTH: Aguarda token E user.role carregarem completamente
 // Isso unifica as duas esperas anteriores, garantindo que ambos cheguem juntos.
 if (process.client && (!authStore.token || !authStore.user?.role)) {
  await new Promise((resolve) => {
   const check = setInterval(() => {
    if (authStore.token && authStore.user?.role) {
     clearInterval(check)
     resolve(true)
    }
   }, 50)
   // timeout de segurança (1,5s)
   setTimeout(() => {
    clearInterval(check)
    resolve(true)
   }, 1500)
  })
 }

 // 🧩 Releitura segura
 const hasToken = !!authStore.token
 const role = String(authStore.user?.role || '').toLowerCase()
 
 // Verifica se a role do usuário está entre as permitidas
 const isAuthorized = allowedRoles.includes(role)

 console.warn(`[PROF-AUTH] Role: ${role}`)
 console.warn(`[PROF-AUTH] Token: ${hasToken}`)
 console.warn(`[PROF-AUTH] Autorizado: ${isAuthorized}`)

 // 🛑 Redirecionamento 1: Se não houver token, vá para login
 if (!hasToken) {
  return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
 }

 // 🛑 Redirecionamento 2: Se não for autorizado, vá para dashboard
 if (!isAuthorized) {
  return navigateTo({ path: '/dashboard', query: { error: 'unauthorized' } })
 }

 // ✅ Caso válido, segue normalmente
})