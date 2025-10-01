// ~/stores/auth.ts - V1.2 - Adição de role e getter isAdmin para menu de admin
import { defineStore } from 'pinia';
import { ref, computed } from 'vue'; // 👈 Importação do computed adicionada

// Definição de Tipagem para o Objeto de Usuário
interface User {
  userId: number;
  username: string;
  apelido: string | null;
  email: string;
  initialWeight: number;
  heightCm: number;
  photo_perfil_url?: string;
  role?: string; // 👈 Adicionado o campo role
}

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isAuthenticated = ref(false);

  // Getters
  // 🚨 NOVO GETTER: Verifica se o usuário é admin de forma robusta
  const isAdmin = computed(() => {
    // Retorna true se a role existir e for estritamente igual a 'admin' (em minúsculas)
    return user.value?.role?.toLowerCase() === 'admin'; 
  });

  // Ação de Login
  // A tipagem de 'data' deve refletir o que vem da API, incluindo o role
  const login = (data: { token?: string, user: User & { role: string } }) => {
    token.value = data.token || null;
    user.value = { 
        ...data.user,
        // Garante que a role esteja sempre presente (o banco pode não ter enviado)
        role: data.user.role || 'user' 
    };
    isAuthenticated.value = true;
    
    if (process.client) {
      if (data.token) localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(user.value));
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
          const parsedUser = JSON.parse(savedUser);
          // 🚨 Garante que a role exista ao carregar do storage
          user.value = { ...parsedUser, role: parsedUser.role || 'user' } as User;
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
    isAdmin, // 👈 Exportação do novo getter
    login,
    logout,
    init
  };
});