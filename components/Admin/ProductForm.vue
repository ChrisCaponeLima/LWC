// /components/Admin/ProductForm.vue - V1.0 - Formulário de Cadastro/Edição de Produtos
<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="emit('close')"></div>

            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div 
                class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
                :class="{ 'animate-in fade-in zoom-in-50 duration-300': isOpen }"
            >
                <form @submit.prevent="handleSubmit">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    {{ isEditMode ? 'Editar Produto' : 'Novo Produto' }}
                                </h3>
                                <p class="text-sm text-gray-500 mt-1">Defina o nome, descrição, status e os preços base para os diferentes tamanhos (P, M, G, GG).</p>

                                <div class="mt-4 space-y-4">
                                    
                                    <div>
                                        <label for="product_name" class="block text-sm font-medium text-gray-700">Nome do Produto <span class="text-red-500">*</span></label>
                                        <input 
                                            v-model="form.product_name" 
                                            type="text" 
                                            id="product_name" 
                                            required
                                            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                        <p v-if="errors.product_name" class="mt-1 text-xs text-red-600">{{ errors.product_name }}</p>
                                    </div>

                                    <div>
                                        <label for="description" class="block text-sm font-medium text-gray-700">Descrição</label>
                                        <textarea 
                                            v-model="form.description" 
                                            id="description" 
                                            rows="3"
                                            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        ></textarea>
                                    </div>

                                    <h4 class="text-md font-semibold text-gray-800 pt-2 border-t mt-4">Preços Base por Tamanho</h4>
                                    <div class="grid grid-cols-2 gap-4">
                                        
                                        <div>
                                            <label for="precoP" class="block text-sm font-medium text-gray-700">Preço P (Pequeno)</label>
                                            <InputCurrency 
                                                v-model="form.precoP"
                                                id="precoP"
                                            />
                                            <p v-if="errors.precoP" class="mt-1 text-xs text-red-600">{{ errors.precoP }}</p>
                                        </div>

                                        <div>
                                            <label for="precoM" class="block text-sm font-medium text-gray-700">Preço M (Médio)</label>
                                            <InputCurrency 
                                                v-model="form.precoM"
                                                id="precoM"
                                            />
                                            <p v-if="errors.precoM" class="mt-1 text-xs text-red-600">{{ errors.precoM }}</p>
                                        </div>

                                        <div>
                                            <label for="precoG" class="block text-sm font-medium text-gray-700">Preço G (Grande)</label>
                                            <InputCurrency 
                                                v-model="form.precoG"
                                                id="precoG"
                                            />
                                            <p v-if="errors.precoG" class="mt-1 text-xs text-red-600">{{ errors.precoG }}</p>
                                        </div>

                                        <div>
                                            <label for="precoGG" class="block text-sm font-medium text-gray-700">Preço GG (Super Grande)</label>
                                            <InputCurrency 
                                                v-model="form.precoGG"
                                                id="precoGG"
                                            />
                                            <p v-if="errors.precoGG" class="mt-1 text-xs text-red-600">{{ errors.precoGG }}</p>
                                        </div>

                                    </div>

                                    <div v-if="isEditMode" class="pt-4 border-t">
                                        <div class="flex items-center">
                                            <input 
                                                id="is_active" 
                                                name="is_active" 
                                                type="checkbox" 
                                                v-model="form.is_active"
                                                class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            >
                                            <label for="is_active" class="ml-2 block text-sm font-medium text-gray-700">
                                                Produto Ativo (Aparece nas listas de seleção)
                                            </label>
                                        </div>
                                    </div>
                                    
                                </div>
                                
                                <div v-if="formError" class="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                                    <i class="fas fa-exclamation-circle mr-2"></i> {{ formError }}
                                </div>
                                
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button 
                            type="submit" 
                            :disabled="isSubmitting"
                            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition duration-150"
                        >
                            <i v-if="isSubmitting" class="fas fa-spinner fa-spin mr-2"></i>
                            {{ isEditMode ? 'Salvar Alterações' : 'Criar Produto' }}
                        </button>
                        <button 
                            type="button" 
                            @click="emit('close')" 
                            :disabled="isSubmitting"
                            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition duration-150"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import InputCurrency from '~/components/Utils/InputCurrency.vue'; 

// --- Interfaces ---
interface Product {
    id: number;
    product_name: string;
    description: string;
    precoP: string; // Vem como string do backend (ponto decimal)
    precoM: string;
    precoG: string;
    precoGG: string;
    is_active: boolean; // Novo campo
}

interface FormState {
    id: number | null;
    product_name: string;
    description: string;
    precoP: string;
    precoM: string;
    precoG: string;
    precoGG: string;
    is_active: boolean;
}

// --- Props e Emits ---
const props = defineProps<{
    isOpen: boolean;
    product: Product | null; // Objeto de produto para edição
}>();

const emit = defineEmits(['close', 'refreshData']);

// --- Estado ---
const authStore = useAuthStore();
const isSubmitting = ref(false);
const formError = ref<string | null>(null);
const errors = ref<Record<string, string | null>>({});

const emptyForm: FormState = {
    id: null,
    product_name: '',
    description: '',
    precoP: '0,00', 
    precoM: '0,00',
    precoG: '0,00',
    precoGG: '0,00',
    is_active: true, // Novo campo
};

const form = ref<FormState>({ ...emptyForm });

// --- Computed Properties ---
const isEditMode = computed(() => !!props.product);

// --- Lógica de Inicialização e Reset do Formulário ---
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        if (props.product) {
            // Modo Edição
            form.value = {
                id: props.product.id,
                product_name: props.product.product_name,
                description: props.product.description,
                // Converte de ponto (API) para vírgula (InputCurrency)
                precoP: props.product.precoP ? props.product.precoP.replace('.', ',') : '0,00',
                precoM: props.product.precoM ? props.product.precoM.replace('.', ',') : '0,00',
                precoG: props.product.precoG ? props.product.precoG.replace('.', ',') : '0,00',
                precoGG: props.product.precoGG ? props.product.precoGG.replace('.', ',') : '0,00',
                is_active: props.product.is_active,
            };
        } else {
            // Modo Criação
            form.value = { ...emptyForm };
        }
        formError.value = null;
        errors.value = {};
    }
});

// --- Funções Auxiliares ---

// Função para converter o formato de preço BR (vírgula) para PONTO (padrão de API/DB)
const sanitizePrice = (price: string): string => {
    let cleanPrice = price.replace(/\./g, ''); // Remove pontos de milhar
    return cleanPrice.replace(',', '.'); // Troca vírgula decimal por ponto decimal
};

const validateForm = (): boolean => {
    errors.value = {};
    if (!form.value.product_name.trim()) {
        errors.value.product_name = 'O nome do produto é obrigatório.';
    }
    return Object.values(errors.value).every(e => !e);
};

// --- Lógica de Submissão ---
const handleSubmit = async () => {
    if (!validateForm()) return;

    isSubmitting.value = true;
    formError.value = null;

    // Converte os preços para o formato padrão do banco de dados (ponto decimal)
    const payload = {
        product_name: form.value.product_name,
        description: form.value.description,
        precoP: sanitizePrice(form.value.precoP),
        precoM: sanitizePrice(form.value.precoM),
        precoG: sanitizePrice(form.value.precoG),
        precoGG: sanitizePrice(form.value.precoGG),
        is_active: form.value.is_active,
    };

    // Note que a API de produtos espera o ID no BODY para PUT, não na URL, diferentemente de treatments.
    const endpoint = isEditMode.value 
        ? `/api/products/update` // Endpoint de atualização espera o ID no body
        : '/api/products/create';
    const method = isEditMode.value ? 'PUT' : 'POST';
    const finalPayload = isEditMode.value ? { ...payload, id: form.value.id } : payload;
    const token = authStore.token;

    try {
        await $fetch(endpoint, {
            method: method,
            headers: { Authorization: `Bearer ${token}` },
            body: finalPayload,
        });

        emit('refreshData'); // Atualiza a lista na página pai
        emit('close'); // Fecha o modal

    } catch (e: any) {
        console.error('Erro na submissão do produto:', e);
        formError.value = e?.data?.statusMessage || `Falha ao ${isEditMode.value ? 'atualizar' : 'criar'} o produto.`;
    } finally {
        isSubmitting.value = false;
    }
};
</script>