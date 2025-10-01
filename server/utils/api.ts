// /server/utils/api.ts

import { useAuthStore } from '~/stores/auth';

// 1. Defina a URL base da sua API
// Para desenvolvimento, pode ser 'http://localhost:3000/api'
// Para produção, mude para o endereço real do seu backend
const API_BASE_URL = process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';


/**
 * Função utilitária para fazer chamadas de API com autenticação.
 * Substitui o fetch ou axios tradicional.
 * @param {string} endpoint O caminho da URL da API (ex: '/records')
 * @param {object} options Opções padrão do $fetch (method, body, headers, etc.)
 */
export async function apiFetch(endpoint, options = {}) {
  const authStore = useAuthStore();

  // O token de autenticação (se estiver usando tokens JWT)
  // O Pinia precisaria armazenar o token, mas estamos usando o userId por enquanto.
  // const authToken = authStore.token;

  // Monta os headers da requisição
  const defaultHeaders = {
    'Content-Type': 'application/json',
    // Exemplo: se você usa JWT, descomente e use o token aqui:
    // ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  try {
    const response = await $fetch(endpoint, {
      baseURL: API_BASE_URL,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    });
    
    return response;
  } catch (error) {
    // Tratamento de erro centralizado (ex: 401 Unauthorized, 500 Server Error)
    console.error(`Erro na chamada da API para ${endpoint}:`, error);
    throw error; // Re-lança o erro para ser tratado no Composable ou Componente
  }
}