// nuxt.config.ts - V1.3 (seguro para Prisma + Cloudinary + Bcrypt)
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },

  nitro: {
    compatibilityDate: '2025-09-30',
    externals: {
      inline: ['cloudinary', 'bcryptjs'], // empacotar dentro do Nitro
      external: ['@prisma/client'],       // manter prisma como dependência externa
    },
  },

  runtimeConfig: {
    openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
    },
  },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  css: ['~/assets/css/main.css'],
})
