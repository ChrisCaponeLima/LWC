// /nuxt.config.ts - V1.15 - Reforço CRÍTICO do limite de payload do Nitro.

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
devtools: { enabled: true, debug: true }, 

// 1. Manter: Transpilação
build: {
transpile: ['cloudinary'],
},

nitro: {
compatibilityDate: '2025-09-30',
externals: {
 inline: ['bcryptjs'], 
 external: ['@prisma/client', 'cloudinary'], 
},
    // 🚨 ALTERAÇÃO CRÍTICA: Definir maxBodySize através de uma variável de ambiente injetada
    // Se a variável NITRO_MAX_BODY_SIZE não está funcionando no ambiente, 
    // podemos tentar injetar o limite do body de forma explícita no runtime.
    // O valor deve ser definido em bytes. 4718592 = 4.5MB
    // Este método é um fallback quando a variável de ambiente não é lida pelo H3/Nitro.
    runtimeConfig: {
        // Usa uma variável de ambiente CUSTOMIZADA, com fallback para o valor exigido
        // Garante que o valor de 4.5MB seja o limite.
        maxPayloadSize: process.env.PAYLOAD_MAX_SIZE || 4718592, // 🚨 NOVO: Variável injetada
    }
},

// 🚨 ALTERAÇÃO CRÍTICA (Controle): Expõe a variável de limite para o lado do cliente (se necessário)
runtimeConfig: {
openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
// 🚨 NOVO: Adiciona o limite de payload ao runtimeConfig (acessível via useRuntimeConfig())
maxPayloadSize: process.env.PAYLOAD_MAX_SIZE || 4718592, 
public: {
 apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
    // 🚨 NOVO: Expor o limite no cliente
    maxPayloadSize: process.env.PAYLOAD_MAX_SIZE || 4718592, 
},
},

modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

css: ['~/assets/css/main.css'],

// Manter o bloco vite comentado
// ...
})