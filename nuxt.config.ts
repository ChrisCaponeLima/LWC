// nuxt.config.ts - V1.2 - Adição do runtimeConfig público para NUXT_PUBLIC_API_BASE_URL
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  nitro: {
    compatibilityDate: '2025-09-30',
    externals: {
      packages: ['cloudinary', 'bcryptjs', '@prisma/client'],
    },
  },
  
  // 🚨 ATUALIZADO: Configuração para chaves privadas (servidor) e públicas (cliente)
  runtimeConfig: {
    // Variável privada de servidor: lida de OPENWEATHER_API_KEY no .env
    openWeatherApiKey: process.env.OPENWEATHER_API_KEY, 
    
    // Variável pública: lida de NUXT_PUBLIC_API_BASE_URL no .env, acessível no frontend via useRuntimeConfig()
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
    }
  },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  css: ['~/assets/css/main.css'],
})