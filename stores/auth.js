import { defineStore } from 'pinia';

// Usa o ID do usuário (userId) como chave primária
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // Objeto do usuário: { userId, username, photoUrl, role, heightCm, ... }
    isAuthenticated: false,
  }),

  actions: {
    // 1. Ação para simular o login (receber dados do usuário)
    login(userData) {
      this.user = userData;
      this.isAuthenticated = true;
      
      // No Nuxt, você usaria o useCookie ou um plugin para persistir
      // o token/dados, mas por enquanto, vamos apenas salvar o estado.
      
      // Carrega os dados no localStorage para simular a persistência
      if (process.client) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
    },

    // 2. Ação para carregar o usuário persistente ao iniciar a aplicação
    loadUser() {
      if (process.client) { // Garante que roda apenas no navegador
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          this.user = JSON.parse(storedUser);
          this.isAuthenticated = true;
        }
      }
    },

    // 3. Ação para fazer o logout
    logout() {
      this.user = null;
      this.isAuthenticated = false;

      if (process.client) {
        // Limpa todas as chaves de usuário do localStorage, como no seu original
        localStorage.removeItem('user');
        localStorage.removeItem('username');
        localStorage.removeItem('userPhotoUrl');
        localStorage.removeItem('role');
        localStorage.removeItem('userHeightCm');
        localStorage.removeItem('userId');

        // Redireciona o usuário (usando a função de navegação do Nuxt)
        // O `MapsTo` é mais eficiente que `window.location.href`
        navigateTo('/login', { replace: true });
      }
    },
  },

  getters: {
    // Para verificar o cargo do usuário em qualquer lugar da aplicação
    isAdmin: (state) => state.user?.role === 'admin',
    
    // Simplifica o acesso a dados no template
    username: (state) => state.user?.username || 'Meu Perfil',
    photoUrl: (state) => state.user?.photo_perfil_url || 'https://api.iconify.design/solar:user-circle-bold-duotone.svg',
  }
});