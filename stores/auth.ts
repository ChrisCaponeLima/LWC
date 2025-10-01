// ~/stores/auth.ts

import { defineStore } from 'pinia';
import { ref } from 'vue';

// Definição de Tipagem para o Objeto de Usuário
interface User {
    userId: number;
    username: string;
    apelido: string | null;
    email: string;
    initialWeight: number;
    heightCm: number;
    
    // 1. CORREÇÃO: Adicionando photoUrl e role
    photoUrl: string | null; // CRÍTICO: Campo da foto que estava faltando!
    role: string;
}

export const useAuthStore = defineStore('auth', () => {
    // Estado
    const user = ref<User | null>(null);
    const token = ref<string | null>(null);
    const isAuthenticated = ref(false);

    // Ação de Login
    const login = (data: { token: string, user: User }) => {
        token.value = data.token;
        user.value = data.user;
        isAuthenticated.value = true;
        
        // Protegido: Salva no localStorage APENAS no cliente
        if (process.client) {
            localStorage.setItem('authToken', data.token);
            // 2. CORREÇÃO: data.user agora tem photoUrl e role garantidos pelo tipo
            localStorage.setItem('authUser', JSON.stringify(data.user)); 
        }
    };

    // Ação de Logout
    const logout = () => {
        token.value = null;
        user.value = null;
        isAuthenticated.value = false;
        
        // Protegido: Remove do localStorage APENAS no cliente
        if (process.client) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
        }
    };

    // Ação CRÍTICA: Inicializar/Reidratar o estado (Chamada pelo plugin)
    const init = () => {
        // Protegido: Tenta recuperar do localStorage APENAS no cliente
        if (process.client) {
            const savedToken = localStorage.getItem('authToken');
            const savedUser = localStorage.getItem('authUser');

            if (savedToken && savedUser) {
                token.value = savedToken;
                try {
                    // A nova tipagem 'User' agora inclui photoUrl e role
                    user.value = JSON.parse(savedUser) as User; 
                    isAuthenticated.value = true;
                } catch (e) {
                    console.error("Erro ao fazer parse dos dados de usuário salvos:", e);
                    logout();
                }
            } else {
                isAuthenticated.value = false;
            }
        }
    };

    return {
        user,
        token,
        isAuthenticated,
        login,
        logout,
        init
    };
});