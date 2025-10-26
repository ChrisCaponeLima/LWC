// /stores/auth.ts - V2.0 - Adicionado e exposto o computed 'isProfessional'.
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

type AnyUser = Record<string, any>

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AnyUser | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = ref(false)
  const initialized = ref(false)

  const isAdmin = computed(() => String(user.value?.role || '').toLowerCase() === 'admin')
  const isOwner = computed(() => String(user.value?.role || '').toLowerCase() === 'owner')
  // CORREÇÃO: Adicionado isProfessional, seguindo o padrão de nomenclatura.
  const isProfessional = computed(() => String(user.value?.role || '').toLowerCase() === 'profissional')

  // 💥 NOVO MÉTODO: Atualiza o objeto user e o localStorage (após edição de perfil, etc.)
  const setUser = (userData: AnyUser) => {
    // Garantimos a normalização básica
    const normalizedUser: AnyUser = {
      ...userData,
      id: userData.id ?? userData.userId,
    }
    normalizedUser.userId = normalizedUser.id
    
    // Atualiza a reatividade (mescla o novo dado com o user.value existente)
    user.value = { ...user.value, ...normalizedUser }
    
    // Atualiza a persistência
    if (process.client) {
      localStorage.setItem('authUser', JSON.stringify(user.value))
    }
  }
  // FIM DO NOVO MÉTODO

  const login = (data: { token?: string; user: AnyUser }) => {
    token.value = data.token || null
    const incoming = data.user || {}
    const normalizedUser: AnyUser = {
      ...incoming,
      id: incoming.id ?? incoming.userId,
    }
    normalizedUser.userId = normalizedUser.id
    user.value = normalizedUser
    isAuthenticated.value = true

    if (process.client) {
      if (token.value) localStorage.setItem('authToken', token.value)
      localStorage.setItem('authUser', JSON.stringify(user.value))
    }
    initialized.value = true
  }

  const logout = () => {
    token.value = null
    user.value = null
    isAuthenticated.value = false
    if (process.client) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
    }
    initialized.value = true
  }

  const init = async () => {
    if (initialized.value) return
    if (!process.client) {
      initialized.value = true
      return
    }

    await new Promise((resolve) => {
      setTimeout(() => {
        try {
          const savedToken = localStorage.getItem('authToken')
          const savedUser = localStorage.getItem('authUser')
          if (savedToken && savedUser) {
            token.value = savedToken
            const parsed = JSON.parse(savedUser)
            const normalizedUser: AnyUser = {
              ...parsed,
              id: parsed.id ?? parsed.userId,
            }
            normalizedUser.userId = normalizedUser.id
            user.value = normalizedUser
            isAuthenticated.value = true
          } else {
            token.value = null
            user.value = null
            isAuthenticated.value = false
          }
        } catch (err) {
          console.error('auth.init: erro inesperado', err)
        } finally {
          initialized.value = true
          resolve(true)
        }
      }, 10)
    })
  }

  return {
    user,
    token,
    isAuthenticated,
    initialized,
    isAdmin,
    isOwner,
    isProfessional, // 👈 AGORA EXPOSTO!
    login,
    logout,
    init,
    setUser,
  }
})