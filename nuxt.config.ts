// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  nitro: {
    compatibilityDate: '2025-09-30',
    externals: {
      packages: ['cloudinary', 'bcryptjs', '@prisma/client'],
    },
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  css: ['~/assets/css/main.css'],
})
