// /plugins/pinia-persisted-state.client.ts - V1.1 - Ordem garantida antes do auth-init
import { createPersistedState } from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia
  if (process.client && pinia) {
    // Aplica o plugin de persistência ANTES da inicialização do auth
    pinia.use(
      createPersistedState({
        storage: localStorage,
      })
    )
  }
})
