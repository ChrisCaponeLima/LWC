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
  photo_perfil_url?: string; // 👈 adicionado para garantir tipagem correta
}

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isAuthenticated = ref(false);

  // Ação de Login
  const login = (data: { token?: string, user: User }) => {
    token.value = data.token || null;
    user.value = data.user;
    isAuthenticated.value = true;
    
    if (process.client) {
      if (data.token) localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
    }
  };

  // Ação de Logout
  const logout = () => {
    token.value = null;
    user.value = null;
    isAuthenticated.value = false;
    
    if (process.client) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
  };

  // Ação de Inicialização
  const init = () => {
    if (process.client) {
      const savedToken = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('authUser');

      if (savedToken && savedUser) {
        token.value = savedToken;
        try {
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
