// /pages/admin/products/index.vue - V1.0 - Listagem e Gerenciamento de Produtos
<template>
    <NuxtLayout name="admin">
        <div class="p-4 sm:p-8">
            <h1 class="text-3xl font-extrabold text-gray-900 mb-6">Gerenciamento de Produtos</h1>

            <div class="flex justify-end mb-6">
                <button
                    @click="openCreateModal"
                    class="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md flex items-center"
                >
                    <i class="fas fa-plus-circle mr-2"></i>
                    Novo Produto
                </button>
            </div>

            <div class="bg-white shadow-xl rounded-lg overflow-hidden">
                
                <div v-if="isLoading" class="p-10 text-center">
                    <i class="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
                    <p class="mt-2 text-gray-600">Carregando lista de produtos...</p>
                </div>
                
                <div v-else-if="error" class="p-10 text-center text-red-600 border border-red-200 bg-red-50">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    {{ error }}
                </div>

                <table v-else-if="products.length" class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Produto
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ativo
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
                        <tr v-for="product in products" :key="product.id">
                            <td class="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                                {{ product.product_name }}
                                <p v-if="product.description" class="text-xs text-gray-500 truncate">{{ product.description }}</p>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span :class="product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                                    {{ product.is_active ? 'Sim' : 'Não' }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                R$ {{ formatPrice(product.precoP) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                R$ {{ formatPrice(product.precoM) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                R$ {{ formatPrice(product.precoG) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                R$ {{ formatPrice(product.precoGG) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button 
                                    @click="openEditModal(product)"
                                    class="text-indigo-600 hover:text-indigo-900 transition mr-3"
                                    title="Editar"
                                >
                                    <i class="fas fa-pencil-alt"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div v-else class="p-10 text-center text-gray-500">
                    <i class="fas fa-info-circle mr-2"></i>
                    Nenhum produto cadastrado. Clique em "Novo Produto" para começar.
                </div>
            </div>
        </div>

        <ProductForm
            :is-open="isModalOpen"
            :product="selectedProduct"
            @close="closeModal"
            @refreshData="fetchProducts"
        />
    </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import ProductForm from '~/components/Admin/ProductForm.vue';

// Definições de Meta e Segurança
definePageMeta({ 
    middleware: ['professional-auth'],
    allowedRoles: ['admin', 'owner'], // Apenas admins e owners podem gerenciar
});
useHead({ title: 'Gerenciar Produtos - Admin' });

// Interfaces (Refletindo a estrutura do model products)
interface Product {
    id: number;
    product_name: string;
    description: string;
    precoP: string; // API retorna como string para evitar problemas de Decimal
    precoM: string;
    precoG: string;
    precoGG: string;
    is_active: boolean; // Novo campo
}

const authStore = useAuthStore();
const products = ref<Product[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Estado do Modal
const isModalOpen = ref(false);
const selectedProduct = ref<Product | null>(null); // Usado para modo Edição

// -----------------------------------------------------------
// LÓGICA DE BUSCA E FETCH 
// -----------------------------------------------------------

const fetchProducts = async () => {
    isLoading.value = true;
    error.value = null;
    const token = authStore.token;

    try {
        // Usa o endpoint de listagem de produtos
        const response = await $fetch<Product[]>('/api/products/list', { 
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });

        products.value = response; // Atribuição direta da resposta (Array)

    } catch (e: any) {
        console.error('Erro ao buscar produtos:', e);
        error.value = e?.data?.statusMessage || 'Falha ao carregar a lista de produtos.';
    } finally {
        isLoading.value = false;
    }
};

// -----------------------------------------------------------
// LÓGICA DO MODAL
// -----------------------------------------------------------

const openCreateModal = () => {
    selectedProduct.value = null; // Modo Criação
    isModalOpen.value = true;
};

const openEditModal = (product: Product) => {
    selectedProduct.value = product; // Modo Edição
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
    selectedProduct.value = null;
};

// -----------------------------------------------------------
// FUNÇÕES AUXILIARES
// -----------------------------------------------------------

const formatPrice = (price: string | null) => {
    if (!price || price === '0.00' || price === '0') return '0,00';
    // Converte de ponto (API) para vírgula (BR)
    return parseFloat(price.toString().replace(',', '.')).toFixed(2).replace('.', ',');
};


// -----------------------------------------------------------
// HOOKS
// -----------------------------------------------------------
onMounted(() => {
    fetchProducts();
});
</script>

<style scoped>
/* Estilos */
</style>