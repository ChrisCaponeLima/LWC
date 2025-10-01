// /middleware/auth.ts

import { useAuthStore } from '~/stores/auth'; 

export default defineNuxtRouteMiddleware((to, from) => {
    // CORREÇÃO CRÍTICA: Se estiver no servidor, não faça nada.
    // Isso dá tempo para o Pinia carregar o localStorage no cliente.
    if (process.server) {
        return;
    }

    // A store de autenticação é importada automaticamente.
    const authStore = useAuthStore();
    
    // Verifica se a rota atual é protegida E se o usuário NÃO está logado.
    const protectedRoutes = ['/']; // Adicione outras rotas protegidas aqui
    
    // Se a rota é protegida E o usuário não está logado...
    // (Esta verificação agora só ocorre APÓS o carregamento do localStorage)
    if (protectedRoutes.includes(to.path) && !authStore.user) {
        // Redireciona para a página de login.
        return navigateTo('/login');
    }
});