// /pages/admin/treatments/index.vue - V3.1 - Adição de rolagem horizontal à tabela para ajuste em telas pequenas (overflow-x-auto).
<template>
    <div>
        <Header pageTitle="Gerenciamento de Tratamentos" />

        <div class="p-4 sm:p-8">
            <h1 class="text-3xl font-extrabold text-gray-900 mb-6">Gerenciamento de Tratamentos</h1>

            <div class="flex justify-end mb-6 space-x-3">
                
                <button
                    @click="isAreaRuleManagerOpen = true"
                    class="px-6 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-600 rounded-lg hover:bg-indigo-100 transition duration-150 shadow-md flex items-center"
                >
                    <i class="fas fa-balance-scale-right mr-2"></i>
                    Gerenciar Regras Avançadas
                </button>
                <button
                    @click="openCreateModal"
                    class="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md flex items-center"
                >
                    <i class="fas fa-plus-circle mr-2"></i>
                    Novo Tratamento
                </button>
            </div>

            <div class="bg-white shadow-xl rounded-lg"> 
                
                <div v-if="isLoading" class="p-10 text-center">
                    <i class="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
                    <p class="mt-2 text-gray-600">Carregando lista de tratamentos...</p>
                </div>
                
                <div v-else-if="error" class="p-10 text-center text-red-600 border border-red-200 bg-red-50">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    {{ error }}
                </div>
                
                <div v-else-if="treatments.length" class="overflow-x-auto"> 
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tratamento
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Preço P
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Preço M
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Preço G
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Preço GG
                                </th>
                                <th scope="col" class="relative px-6 py-3">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="treatment in treatments" :key="treatment.id">
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {{ treatment.treatment_name }}
                                    <p class="text-xs text-gray-500 truncate">{{ treatment.description }}</p>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    R$ {{ formatPrice(treatment.precoP) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    R$ {{ formatPrice(treatment.precoM) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    R$ {{ formatPrice(treatment.precoG) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    R$ {{ formatPrice(treatment.precoGG) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        @click="openEditModal(treatment)"
                                        class="text-indigo-600 hover:text-indigo-900 transition mr-3"
                                        title="Editar"
                                    >
                                        <i class="fas fa-pencil-alt"></i>
                                    </button>
                                    </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="p-10 text-center text-gray-500">
                    <i class="fas fa-info-circle mr-2"></i>
                    Nenhum tratamento cadastrado. Clique em "Novo Tratamento" para começar.
                </div>
            </div>
        </div>

        <TreatmentForm
            :is-open="isModalOpen"
            :treatment="selectedTreatment"
            @close="closeModal"
            @refreshData="fetchTreatments"
        />

        <AreaRuleManager 
            :is-open="isAreaRuleManagerOpen" 
            @close="isAreaRuleManagerOpen = false" 
        />
        
        <Footer />
    </div>
</template>

<script setup lang="ts">
// /pages/admin/treatments/index.vue - V3.1 - Adição de rolagem horizontal à tabela para ajuste em telas pequenas (overflow-x-auto).
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import TreatmentForm from '~/components/Admin/TreatmentForm.vue';
import AreaRuleManager from '~/components/Admin/Treatment/AreaRuleManager.vue'; 

// Definições de Meta e Segurança
definePageMeta({ 
  middleware: ['professional-auth'],
  allowedRoles: ['admin', 'owner'], // Apenas admins e owners podem gerenciar
});
useHead({ title: 'Gerenciar Tratamentos - Admin' });

// Interfaces (Refletindo a estrutura do model treatments)
interface Treatment {
  id: number;
  treatment_name: string;
  description: string;
  // Assume que a API retorna como string para evitar problemas de Decimal
  precoP: string; 
  precoM: string;
  precoG: string;
  precoGG: string;
  // ... outros campos (created_at, etc.)
}

const authStore = useAuthStore();
const treatments = ref<Treatment[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Estado do Modal (CRUD de Tratamentos)
const isModalOpen = ref(false);
const selectedTreatment = ref<Treatment | null>(null); // Usado para modo Edição

// ESTADO NOVO: Modal de Gerenciamento de Regras
const isAreaRuleManagerOpen = ref(false); // 👈 NOVO ESTADO

// -----------------------------------------------------------
// LÓGICA DE BUSCA E FETCH (Item 5: APIs CRUD de Tratamentos)
// -----------------------------------------------------------

const fetchTreatments = async () => {
  isLoading.value = true;
  error.value = null;
  const token = authStore.token;

  try {
    const response = await $fetch<Treatment[]>('/api/admin/treatments/list', { 
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    treatments.value = response;

  } catch (e: any) {
    console.error('Erro ao buscar tratamentos:', e);
    error.value = e?.data?.statusMessage || 'Falha ao carregar a lista de tratamentos.';
  } finally {
    isLoading.value = false;
  }
};

// -----------------------------------------------------------
// LÓGICA DO MODAL (CRUD Tratamento Simples)
// -----------------------------------------------------------

const openCreateModal = () => {
  selectedTreatment.value = null; // Modo Criação
  isModalOpen.value = true;
};

const openEditModal = (treatment: Treatment) => {
  selectedTreatment.value = treatment; // Modo Edição
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedTreatment.value = null;
};

// -----------------------------------------------------------
// FUNÇÕES AUXILIARES
// -----------------------------------------------------------

const formatPrice = (price: string) => {
  if (!price || price === '0.00' || price === '0') return '0,00';
  // Garante que o número é formatado corretamente (usa ponto como decimal para parseFloat, depois vírgula)
  return parseFloat(price.toString().replace(',', '.')).toFixed(2).replace('.', ',');
};


// -----------------------------------------------------------
// HOOKS
// -----------------------------------------------------------
onMounted(() => {
  fetchTreatments();
});
</script>

<style scoped>
/* Estilos */
</style>