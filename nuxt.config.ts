// nuxt.config.ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  // --- CRÍTICO: Configuração de Variáveis de Ambiente Públicas ---
  // Este bloco expõe a variável NUXT_PUBLIC_API_BASE_URL ao código do frontend
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL 
    }
  },
  // ------------------------------------------------------------

  // Adiciona a data de compatibilidade do Nitro
  nitro: {
    compatibilityDate: '2025-09-25'
  },

  // TODOS os módulos devem estar listados neste array 'modules'
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  
  css: ['~/assets/css/main.css'],
})