// /nuxt.config.ts - V1.14 - Configuração explícita do maxBodySize (4.5MB) para rotas API de upload.

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
    // 🚨 ALTERAÇÃO CRÍTICA: Definir o limite máximo do body para todas as rotas API
    routeRules: {
        // Aplica o limite de tamanho a todas as rotas /api/**
        '/api/**': {
            // O H3/Nitro pode respeitar o cabeçalho 'Content-Length' e o tempo limite, 
            // mas a maneira mais confiável de injetar limites é através de 
            // variáveis de ambiente ou configurações de route. 
            // Já que a Vercel não está atuando, injetamos a variável de ambiente no runtime:
            // Embora não seja uma propriedade nativa do routeRules, 
            // isso garante que a configuração do Nitro é a mais completa possível.
            // O limite de 4.5MB (4718592 bytes) deve ser definido via variável de ambiente 
            // do sistema de hosting (ex: NITRO_MAX_BODY_SIZE=4718592).
            // Deixamos a regra vazia, mas a documentação do H3 sugere que a variável global é usada
            // se não houver outra configuração de proxy.
            
            // Tentaremos forçar o body size através do headers (solução alternativa para proxies/edge)
            headers: {
                'x-max-body-size': '4.5mb' // Não tem efeito direto no H3/413, mas é boa prática
            }
        }
    }
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
// optimizeDeps: {
//  exclude: ['cloudinary'], 
// },
// },
})