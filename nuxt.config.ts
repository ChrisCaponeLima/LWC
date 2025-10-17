// nuxt.config.ts - V1.6 - Correção de falha de build/runtime do Cloudinary
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
 devtools: { enabled: true, debug: true }, 

 // 1. Adicionar o pacote à lista de transpilação (CORREÇÃO para moduleSideEffects)
 build: {
   transpile: ['cloudinary'],
 },
 
 nitro: {
  compatibilityDate: '2025-09-30',
  externals: {
   inline: ['cloudinary', 'bcryptjs'], // Manter: bom para o runtime do Nitro
   external: ['@prisma/client'], 
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

//  // NOVO BLOCO VITE PARA EXCLUIR 'cloudinary' DA OTIMIZAÇÃO DE DEPENDÊNCIAS
//  // Isso resolve o erro "Cannot read properties of null (reading 'moduleSideEffects')"
//  vite: {
//    optimizeDeps: {
//      exclude: ['cloudinary'], 
//    },
//  },
})