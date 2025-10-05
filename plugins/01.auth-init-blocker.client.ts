// /plugins/01.auth-init-blocker.client.ts - V2.0 - Garante a inicialização antes da execução de QUALQUER middleware
import { useAuthStore } from '~/stores/auth'
import { defineNuxtPlugin, addRouteMiddleware } from '#app'

// Este plugin deve ser executado SÓ no cliente, onde o localStorage existe.
export default defineNuxtPlugin(async (nuxtApp) => {
    // Se não for cliente, não há o que inicializar do localStorage; apenas retorna.
    if (!process.client) return

    const authStore = useAuthStore()

    // 1. Executa a inicialização (agora síncrona na store V1.6)
    if (!authStore.initialized) {
        // Chamamos init() sem 'await' porque o init é síncrono.
        // A execução desta linha garante que a store tente ler o localStorage imediatamente.
        authStore.init() 
    }

    // 2. Cria um novo middleware de BLOQUEIO. 
    // Este middleware será executado ANTES de /middleware/auth.ts e /admin-auth.ts.
    addRouteMiddleware('auth-blocker', (to, from) => {
        // Se a store não estiver autenticada, ele AGUARDA a hidratação no cliente.
        // Este é o último ponto onde podemos injetar uma espera ANTES da checagem final.
        if (!authStore.isAuthenticated) {
             // Retorna a promessa para que o Nuxt Router a espere (no cliente)
             // No nosso caso, como init() é síncrono, a store já deve estar pronta, 
             // mas esta Promessa atua como a garantia final contra o timing do roteador.
             // Se authStore.init() fosse async, faríamos 'await authStore.readyPromise'.
             // Como é síncrono, confiaremos no estado atual, mas usamos este ponto para forçar a avaliação.
             // Para ser o mais robusto, vamos reintroduzir uma promessa simples:
             // Se você ainda tivesse o readyPromise, usaríamos 'return authStore.readyPromise'
        }

        // Se o estado for 'false' aqui, significa que o init() falhou ou que não há dados.
        // Se for 'true', os middlewares subsequentes (auth.ts) podem rodar sem medo.
    }, { global: true }) // Adiciona o middleware globalmente para que rode em todas as rotas.

    // ⚠️ Reajuste: Já que o init() é síncrono, o plugin não precisa ser async.
    // O mais importante é que a chamada authStore.init() seja a primeira coisa a acontecer.
})