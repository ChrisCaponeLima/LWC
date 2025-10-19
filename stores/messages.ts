// /stores/messages.ts - V1.0 - Store Pinia dedicado em TypeScript para gerenciar mensagens não lidas.
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// Importação comentada para evitar erro se o useAuthStore ainda não for um módulo TS.
// import { useAuthStore } from '~/stores/auth' 

// O uso de 'defineStore' com a Composition API (função de setup) já oferece tipagem 
// de retorno robusta.
export const useMessagesStore = defineStore('messages', () => {
  
  // Estado tipado: usa 'ref<number>'
  const unreadCount = ref<number>(0) 

  // Getters tipados: o retorno é automaticamente inferido como 'ComputedRef<boolean>'
  const hasUnreadMessages = computed(() => unreadCount.value > 0)

  // Ações

  /**
   * Busca a contagem de mensagens não lidas no backend.
   */
  const fetchUnreadCount = async (): Promise<void> => {
    // const authStore = useAuthStore()
    // if (!authStore.token) {
    //   unreadCount.value = 0;
    //   return;
    // }

    // Simulação de chamada de API:
    // **AJUSTE NECESSÁRIO:** Substituir este bloco pela chamada de API real.
    try {
      // Simulação para manter o teste visual.
      const mockCount = Math.random() < 0.7 ? 1 : 0; // 70% de chance de ter 1 mensagem não lida
      unreadCount.value = mockCount;
      // console.log(`[useMessagesStore] Estado de não lidas simulado: ${unreadCount.value}`);
      
    } catch (error) {
      console.error('Erro ao buscar contagem de mensagens não lidas:', error)
      unreadCount.value = 0
    }
  }

  /**
   * Marca todas as mensagens do usuário como lidas.
   */
  const markAllAsRead = async (): Promise<void> => {
    // const authStore = useAuthStore()
    // if (!authStore.token) return;

    // **AJUSTE NECESSÁRIO:** Substituir este bloco pela chamada de API real.
    try {
      // Exemplo de chamada real:
      // await $fetch('/api/messages/mark-as-read', { 
      //    method: 'POST', 
      //    headers: { Authorization: `Bearer ${authStore.token}` }
      // })
      unreadCount.value = 0 // Define o estado local para zero após o sucesso da API.
      
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error)
    }
  }

  return { 
    unreadCount, 
    hasUnreadMessages, 
    fetchUnreadCount, 
    markAllAsRead 
  }
})