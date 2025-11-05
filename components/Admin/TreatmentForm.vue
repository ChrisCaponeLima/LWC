// /components/Admin/TreatmentForm.vue - V1.1 - Ajuste de Importação do Input de Preço (Mantendo a estrutura)
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
                                    {{ isEditMode ? 'Editar Tratamento' : 'Novo Tratamento' }}
                                </h3>
                                <p class="text-sm text-gray-500 mt-1">Defina o nome, descrição e os preços base para os diferentes tamanhos (P, M, G, GG).</p>

                                <div class="mt-4 space-y-4">
                                    
                                    <div>
                                        <label for="treatment_name" class="block text-sm font-medium text-gray-700">Nome do Tratamento <span class="text-red-500">*</span></label>
                                        <input 
                                            v-model="form.treatment_name" 
                                            type="text" 
                                            id="treatment_name" 
                                            required
                                            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                        <p v-if="errors.treatment_name" class="mt-1 text-xs text-red-600">{{ errors.treatment_name }}</p>
                                    </div>

                                    <div>
                                        <label for="description" class="block text-sm font-medium text-gray-700">Descrição (Detalhes sobre o procedimento)</label>
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
                            {{ isEditMode ? 'Salvar Alterações' : 'Criar Tratamento' }}
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
// /components/Admin/TreatmentForm.vue - V1.1 - Ajuste de Importação do Input de Preço
import { ref, watch, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
// ✅ CORREÇÃO: Importa o componente com o nome de arquivo correto
import InputCurrency from '~/components/Utils/InputCurrency.vue'; 

// --- Interfaces ---
interface Treatment {
    id: number;
    treatment_name: string;
    description: string;
    precoP: string;
    precoM: string;
    precoG: string;
    precoGG: string;
}

interface FormState {
    id: number | null;
    treatment_name: string;
    description: string;
    precoP: string;
    precoM: string;
    precoG: string;
    precoGG: string;
}

// --- Props e Emits ---
const props = defineProps<{
    isOpen: boolean;
    treatment: Treatment | null; // Objeto de tratamento para edição
}>();

const emit = defineEmits(['close', 'refreshData']);

// --- Estado ---
const authStore = useAuthStore();
const isSubmitting = ref(false);
const formError = ref<string | null>(null);
const errors = ref<Record<string, string | null>>({});

const emptyForm: FormState = {
    id: null,
    treatment_name: '',
    description: '',
    precoP: '0,00', 
    precoM: '0,00',
    precoG: '0,00',
    precoGG: '0,00',
};

const form = ref<FormState>({ ...emptyForm });

// --- Computed Properties ---
const isEditMode = computed(() => !!props.treatment);

// --- Lógica de Inicialização e Reset do Formulário ---
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        // Inicializa o formulário com dados de edição ou valores vazios
        if (props.treatment) {
            // Modo Edição: Carrega os dados existentes (os preços já vêm formatados com vírgula do list.get.ts)
            form.value = {
                id: props.treatment.id,
                treatment_name: props.treatment.treatment_name,
                description: props.treatment.description,
                // Garantir que a vírgula esteja presente, caso o valor venha sem formatação do list.get.ts (embora o list.get.ts já deve retornar formatado para o frontend)
                precoP: props.treatment.precoP.replace('.', ','),
                precoM: props.treatment.precoM.replace('.', ','),
                precoG: props.treatment.precoG.replace('.', ','),
                precoGG: props.treatment.precoGG.replace('.', ','),
            };
        } else {
            // Modo Criação: Reseta para o formulário vazio
            form.value = { ...emptyForm };
        }
        formError.value = null;
        errors.value = {};
    }
});

// --- Funções Auxiliares ---

// Função para converter o formato de preço BR (vírgula) para PONTO (padrão de API/DB)
const sanitizePrice = (price: string): string => {
    // 1. Remove pontos de milhar (se houver)
    let cleanPrice = price.replace(/\./g, '');
    // 2. Troca a vírgula decimal por ponto decimal
    return cleanPrice.replace(',', '.');
};

const validateForm = (): boolean => {
    errors.value = {};
    if (!form.value.treatment_name.trim()) {
        errors.value.treatment_name = 'O nome do tratamento é obrigatório.';
    }
    // TODO: Adicionar validação para garantir que os preços não são strings vazias ou inválidas.
    // O InputCurrency já garante um valor formatado como "0,00"

    return Object.values(errors.value).every(e => !e);
};

// --- Lógica de Submissão ---
const handleSubmit = async () => {
    if (!validateForm()) return;

    isSubmitting.value = true;
    formError.value = null;

    // Converte os preços para o formato padrão do banco de dados (ponto decimal)
    const payload = {
        treatment_name: form.value.treatment_name,
        description: form.value.description,
        // Usando sanitizePrice para garantir o padrão '0.00' (ponto) para o backend
        precoP: sanitizePrice(form.value.precoP),
        precoM: sanitizePrice(form.value.precoM),
        precoG: sanitizePrice(form.value.precoG),
        precoGG: sanitizePrice(form.value.precoGG),
        // area_ids: [], // A ser adicionado no futuro
    };

    const endpoint = isEditMode.value 
        ? `/api/admin/treatments/update/${form.value.id}` 
        : '/api/admin/treatments/create';
    const method = isEditMode.value ? 'PUT' : 'POST';
    const token = authStore.token;

    try {
        await $fetch(endpoint, {
            method: method,
            headers: { Authorization: `Bearer ${token}` },
            body: payload,
        });

        // Sucesso
        emit('refreshData'); // Atualiza a lista na página pai
        emit('close'); // Fecha o modal

    } catch (e: any) {
        console.error('Erro na submissão do tratamento:', e);
        // Tenta extrair a mensagem de erro do servidor
        formError.value = e?.data?.statusMessage || `Falha ao ${isEditMode.value ? 'atualizar' : 'criar'} o tratamento. Verifique o console para mais detalhes.`;
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style scoped>
/* Estilos para Tailwind/NuxtUI */
</style>