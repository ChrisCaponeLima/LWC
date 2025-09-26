// middleware/auth.ts (ou auth.js)
export default defineNuxtRouteMiddleware((to, from) => {
    // Esta é a lógica de frontend para verificar se o usuário está logado
    const userId = process.client ? localStorage.getItem('userId') : null;

    // Se o usuário não está logado E a rota exige login, redireciona
    if (!userId && to.meta.middleware === 'auth') {
        return navigateTo('/login');
    }
});