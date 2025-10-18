// nuxt.config.ts - V1.13 - Base V1.6 com Correção Mínima do Rollup/Cloudinary

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
devtools: { enabled: true, debug: true }, 

// 1. Manter: Transpilação (da V1.6)
build: {
 transpile: ['cloudinary'],
},

nitro: {
 compatibilityDate: '2025-09-30',
 externals: {
  // 🚨 CORREÇÃO CRÍTICA: Mover 'cloudinary' para a lista 'external'.
       // Isso impede que o Rollup/Nitro tente compilar o pacote (que falha com CJS/node:url).
  inline: ['bcryptjs'], // Manteve apenas bcryptjs como inline
  external: ['@prisma/client', 'cloudinary'], // <-- CLOUDINARY MOVIDO AQUI
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

// Manter o bloco vite comentado, conforme sua V1.6
// // NOVO BLOCO VITE PARA EXCLUIR 'cloudinary' DA OTIMIZAÇÃO DE DEPENDÊNCIAS
// // Isso resolve o erro "Cannot read properties of null (reading 'moduleSideEffects')"
// vite: {
//  optimizeDeps: {
//   exclude: ['cloudinary'], 
//  },
// },
})