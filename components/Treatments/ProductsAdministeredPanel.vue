// /components/Treatments/ProductsAdministeredPanel.vue - V1.0 - Registro e Histórico de Produtos Aplicados
<template>
    <div class="space-y-6">
        <h3 class="text-xl font-bold text-gray-800 flex items-center mb-4">
            <i class="fas fa-prescription-bottle-alt mr-2 text-red-500"></i> Histórico de Aplicações de Produtos
        </h3>

        <div v-if="activeTreatment" class="bg-white p-6 rounded-xl shadow-lg border border-indigo-200">
            <h4 class="text-lg font-bold text-indigo-700 mb-4">
                <i class="fas fa-notes-medical mr-2"></i> Registrar Nova Aplicação
            </h4>

            <form @submit.prevent="registerApplication" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Tratamento Ativo:</label>
                    <p class="mt-1 text-lg font-semibold text-green-700">{{ activeTreatment.name }}</p>
                    <input type="hidden" v-model="form.treatmentId" />
                </div>

                <div>
                    <label for="product" class="block text-sm font-medium text-gray-700">Produto Aplicado:</label>
                    <select
                        id="product"
                        v-model="form.productId"
                        required
                        class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm sm:text-sm"
                    >
                        <option :value="null" disabled>Selecione o produto</option>
                        <option
                            v-for="product in activeTreatment.products"
                            :key="product.id"
                            :value="product.id"
                        >
                            {{ product.name }} ({{ product.sku }})
                        </option>
                    </select>
                    <p v-if="!activeTreatment.products || activeTreatment.products.length === 0" class="text-red-500 text-sm mt-1">
                        ⚠️ Nenhum produto associado ao tratamento ativo. Associe um produto primeiro.
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="quantity" class="block text-sm font-medium text-gray-700">Quantidade (mL/unidade):</label>
                        <input
                            type="number"
                            id="quantity"
                            v-model.number="form.quantity"
                            step="0.01"
                            min="0.01"
                            required
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label for="applicationDate" class="block text-sm font-medium text-gray-700">Data da Aplicação:</label>
                        <input
                            type="date"
                            id="applicationDate"
                            v-model="form.applicationDate"
                            required
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label for="notes" class="block text-sm font-medium text-gray-700">Notas da Aplicação (Opcional):</label>
                    <textarea
                        id="notes"
                        v-model="form.notes"
                        rows="3"
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    ></textarea>
                </div>

                <div class="flex justify-end items-center space-x-4">
                    <div v-if="statusMessage" :class="statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'" class="text-sm font-medium">
                        {{ statusMessage.message }}
                    </div>
                    <button
                        type="submit"
                        :disabled="isProcessing || !form.productId"
                        class="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition shadow-md disabled:bg-gray-400"
                    >
                        <i v-if="isProcessing" class="fas fa-spinner fa-spin mr-2"></i>
                        <i v-else class="fas fa-check mr-2"></i>
                        Registrar Aplicação
                    </button>
                </div>
            </form>
        </div>
        <div v-else class="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4">
            <p class="font-medium">
                <i class="fas fa-exclamation-circle mr-2"></i> É necessário ter um tratamento ativo associado ao paciente para registrar a aplicação de produtos.
            </p>
        </div>


        <div class="bg-white p-6 rounded-xl shadow-lg border">
            <h4 class="text-lg font-bold text-gray-700 mb-4">Aplicações Anteriores (Últimas {{ historyToShow }})</h4>
            
            <div v-if="isLoadingHistory" class="text-center py-8">
                <i class="fas fa-spinner fa-spin fa-2x text-gray-500"></i>
            </div>
            
            <div v-else-if="productsHistory && productsHistory.length > 0">
                <ul class="divide-y divide-gray-200">
                    <li v-for="app in displayedHistory" :key="app.id" class="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-calendar-alt text-gray-500"></i>
                            <div>
                                <p class="text-base font-semibold text-gray-800">
                                    {{ app.product.name }}
                                </p>
                                <p class="text-sm text-gray-600">
                                    Tratamento: <span class="font-medium text-indigo-600">{{ app.treatment.name }}</span>
                                </p>
                            </div>
                        </div>
                        <div class="text-right mt-2 sm:mt-0">
                            <p class="text-sm font-medium text-gray-700">{{ app.quantity }} {{ app.product.unit || 'unidades' }}</p>
                            <p class="text-xs text-gray-500">Em: {{ formatDate(app.application_date) }}</p>
                        </div>
                    </li>
                </ul>
                <div v-if="productsHistory.length > maxHistoryDisplay" class="mt-4 text-center">
                    <button @click="showAllHistory = !showAllHistory" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        {{ showAllHistory ? 'Mostrar Menos' : `Mostrar Todas (${productsHistory.length})` }}
                    </button>
                </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500 italic">
                Nenhum registro de aplicação encontrado.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRuntimeConfig } from '#app';
import { formatDate } from '~/utils/formatters'; // Assumindo que você tem uma função de formatação de data global

interface Product {
    id: number;
    name: string;
    sku: string;
    unit: string;
}

interface Treatment {
    id: number;
    name: string;
    products: Product[]; // Lista de produtos associados
    is_active: boolean;
}

interface ApplicationHistory {
    id: number;
    treatment: { id: number; name: string };
    product: Product;
    quantity: number;
    application_date: string; // ISO Date String
    notes: string | null;
}

const props = defineProps<{
    userId: number;
    activeTreatments: Treatment[]; // Todos os tratamentos do paciente.
    productsHistory: ApplicationHistory[]; // Histórico de aplicações, vindo da prop pai.
}>();

const emit = defineEmits(['refreshData']);

const authStore = useAuthStore();
const config = useRuntimeConfig();

const isProcessing = ref(false);
const isLoadingHistory = ref(false); // No V1.0, o histórico vem da prop, então sempre é falso.
const statusMessage = ref<{ message: string, type: 'success' | 'error' } | null>(null);

// Form data for new application
const initialForm = {
    treatmentId: null as number | null,
    productId: null as number | null,
    quantity: 1 as number,
    applicationDate: new Date().toISOString().split('T')[0] as string,
    notes: '' as string,
};
const form = ref({...initialForm});

const maxHistoryDisplay = 5;
const showAllHistory = ref(false);

// ---------------------------------------------------------------------
// COMPUTED / ESTADO
// ---------------------------------------------------------------------

/**
 * Encontra o tratamento ativo na lista. Se houver mais de um, pega o primeiro.
 */
const activeTreatment = computed<Treatment | undefined>(() => {
    const treatment = props.activeTreatments.find(t => t.is_active);
    if (treatment) {
        form.value.treatmentId = treatment.id; // Preenche o ID no formulário
    }
    return treatment;
});

const displayedHistory = computed(() => {
    if (showAllHistory.value) {
        return props.productsHistory;
    }
    // Mostra os mais recentes (primeiros da lista, assumindo que a lista vem ordenada por data decrescente)
    return props.productsHistory.slice(0, maxHistoryDisplay); 
});

const historyToShow = computed(() => {
    return showAllHistory.value ? props.productsHistory.length : Math.min(props.productsHistory.length, maxHistoryDisplay);
});

// ---------------------------------------------------------------------
// FUNÇÃO DE REGISTRO
// ---------------------------------------------------------------------

const registerApplication = async () => {
    if (!form.value.treatmentId || !form.value.productId) return;

    isProcessing.value = true;
    statusMessage.value = null;
    const token = authStore.token;

    try {
        // Endpoint sugerido: /api/professional/products/administer (POST)
        await $fetch(`/api/professional/products/administer`, {
            baseURL: config.public.apiBaseUrl,
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: {
                user_id: props.userId,
                treatment_id: form.value.treatmentId,
                product_id: form.value.productId,
                quantity: form.value.quantity,
                application_date: form.value.applicationDate,
                notes: form.value.notes,
            }
        });

        statusMessage.value = { message: 'Aplicação registrada com sucesso!', type: 'success' };
        
        // Reseta o formulário, mantendo o tratamento e a data de hoje
        form.value = { ...initialForm, treatmentId: form.value.treatmentId, applicationDate: new Date().toISOString().split('T')[0] }; 
        
        emit('refreshData'); // Solicita que a página pai recarregue o histórico
        
    } catch (e: any) {
        console.error('Erro ao registrar aplicação:', e);
        statusMessage.value = { 
            message: e?.data?.statusMessage || e?.message || 'Falha ao registrar aplicação.', 
            type: 'error' 
        };
    } finally {
        isProcessing.value = false;
        setTimeout(() => statusMessage.value = null, 5000);
    }
};

// ---------------------------------------------------------------------
// HOOKS
// ---------------------------------------------------------------------

onMounted(() => {
    // Garante que o campo de data esteja preenchido corretamente no mounted
    form.value.applicationDate = new Date().toISOString().split('T')[0];
});
</script>