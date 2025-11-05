// /components/Admin/Treatment/AreaRuleManager/FactorManager.vue - V1.0 - Gerenciamento de Fatores de Tamanho por Área

<template>
    <div class="p-4 border rounded-lg bg-white shadow-sm">
        <h5 class="font-bold text-gray-700 mb-4 flex items-center">
            <i class="fas fa-sliders-h mr-2 text-red-600"></i> Limites de Medida por Tamanho (Fatores)
        </h5>
        <p class="text-sm text-gray-500 mb-4">Defina o range de medida que define se o tratamento terá preço P, M, G ou GG.</p>

        <div v-if="currentFactors.length > 0" class="mb-4">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tamanho</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medida Mínima</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medida Máxima</th>
                        <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="factor in currentFactors" :key="factor.size_key">
                        <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{{ factor.size_key }}</td>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{{ formatMeasure(factor.measure_min) }}</td>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{{ formatMeasure(factor.measure_max) }}</td>
                        <td class="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                             <button @click="openEditFactor(factor)" class="text-indigo-600 hover:text-indigo-900 transition mr-2" title="Editar Fator">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                             <button @click="handleDeleteFactor(factor)" class="text-red-600 hover:text-red-900 transition" title="Excluir Fator">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <button 
            @click="openCreateFactor" 
            :disabled="isSubmitting"
            class="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition duration-150 flex items-center"
        >
            <i class="fas fa-plus mr-2"></i> Adicionar/Editar Fator
        </button>

        <div v-if="isFactorModalOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="factor-modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="isFactorModalOpen = false"></div>

                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form @submit.prevent="handleUpsertFactor">
                        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4" id="factor-modal-title">
                                {{ currentFactorForm.isEditMode ? 'Editar Fator de Tamanho' : 'Adicionar Novo Fator' }}
                            </h3>

                            <div class="space-y-4">
                                <div>
                                    <label for="size_key" class="block text-sm font-medium text-gray-700">Tamanho (Chave)</label>
                                    <select 
                                        v-model="currentFactorForm.size_key" 
                                        id="size_key" 
                                        required
                                        :disabled="currentFactorForm.isEditMode || isSubmitting"
                                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        <option value="">Selecione um Tamanho</option>
                                        <option v-for="key in sizeKeys" :key="key" :value="key">{{ key }}</option>
                                    </select>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label for="measure_min" class="block text-sm font-medium text-gray-700">Medida Mínima</label>
                                        <input 
                                            v-model.number="currentFactorForm.measure_min" 
                                            type="number" 
                                            id="measure_min" 
                                            step="0.01" 
                                            required
                                            :disabled="isSubmitting"
                                            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label for="measure_max" class="block text-sm font-medium text-gray-700">Medida Máxima</label>
                                        <input 
                                            v-model.number="currentFactorForm.measure_max" 
                                            type="number" 
                                            id="measure_max" 
                                            step="0.01" 
                                            required
                                            :disabled="isSubmitting"
                                            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <p v-if="localError" class="mt-2 text-xs text-red-600">{{ localError }}</p>

                            </div>
                        </div>
                        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button 
                                type="submit" 
                                :disabled="isSubmitting || !currentFactorForm.size_key || !currentFactorForm.measure_min || !currentFactorForm.measure_max"
                                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 transition duration-150 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                <i v-if="isSubmitting" class="fas fa-spinner fa-spin mr-2"></i>
                                Salvar Fator
                            </button>
                            <button 
                                type="button" 
                                @click="isFactorModalOpen = false" 
                                :disabled="isSubmitting"
                                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 transition duration-150 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { Area, Factor } from '../AreaRuleManager.vue';

// --- Interfaces & Types ---
interface FactorFormState {
    size_key: 'P' | 'M' | 'G' | 'GG' | '';
    measure_min: number | null;
    measure_max: number | null;
    isEditMode: boolean;
}

// --- Props e Emits ---
const props = defineProps<{
    area: Area; // A área selecionada
}>();

const emit = defineEmits(['success', 'error']); 

// --- Constantes ---
const sizeKeys: ('P' | 'M' | 'G' | 'GG')[] = ['P', 'M', 'G', 'GG'];

// --- Estado ---
const authStore = useAuthStore();
const isSubmitting = ref(false);
const localError = ref<string | null>(null);
const isFactorModalOpen = ref(false);

const emptyFactorForm: FactorFormState = {
    size_key: '',
    measure_min: null,
    measure_max: null,
    isEditMode: false,
};
const currentFactorForm = ref<FactorFormState>({ ...emptyFactorForm });

// --- Computed Properties ---
const currentFactors = computed<Factor[]>(() => props.area.treatment_factors || []);

// --- Funções Auxiliares ---

const formatMeasure = (value: string): string => {
    // Converte a string decimal (ponto) para o formato local (vírgula) para exibição
    return parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// --- Lógica de Modal e Formulário ---

const openCreateFactor = () => {
    currentFactorForm.value = { ...emptyFactorForm };
    isFactorModalOpen.value = true;
    localError.value = null;
};

const openEditFactor = (factor: Factor) => {
    currentFactorForm.value = {
        size_key: factor.size_key,
        measure_min: parseFloat(factor.measure_min), // Converte para Number
        measure_max: parseFloat(factor.measure_max), // Converte para Number
        isEditMode: true,
    };
    isFactorModalOpen.value = true;
    localError.value = null;
};

// --- Lógica de Criação/Atualização (Upsert) ---

const handleUpsertFactor = async () => {
    if (!currentFactorForm.value.size_key || currentFactorForm.value.measure_min === null || currentFactorForm.value.measure_max === null) {
        localError.value = 'Todos os campos são obrigatórios.';
        return;
    }
    
    if (currentFactorForm.value.measure_min >= currentFactorForm.value.measure_max) {
        localError.value = 'A Medida Mínima deve ser menor que a Medida Máxima.';
        return;
    }

    isSubmitting.value = true;
    localError.value = null;
    const token = authStore.token;

    try {
        const endpoint = '/api/admin/treatments/areas/factor'; // Rota de upsert/post
        
        const payload = {
            area_id: props.area.id,
            size_key: currentFactorForm.value.size_key,
            // Envia como string formatada para o backend (API Handler converte para Decimal)
            measure_min: currentFactorForm.value.measure_min.toFixed(2), 
            measure_max: currentFactorForm.value.measure_max.toFixed(2),
        };
        
        const result = await $fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: payload,
        });

        isFactorModalOpen.value = false;
        emit('success');

    } catch (e: any) {
        console.error('Erro ao salvar fator:', e);
        localError.value = 'Falha ao salvar o fator: ' + (e?.data?.statusMessage || e?.message);
        emit('error', 'Falha ao salvar o fator: ' + (e?.data?.statusMessage || e?.message));

    } finally {
        isSubmitting.value = false;
    }
};

// --- Lógica de Deleção ---

const handleDeleteFactor = async (factor: Factor) => {
    if (!confirm(`Tem certeza que deseja remover o Fator de Tamanho ${factor.size_key} para a área "${props.area.name}"?`)) {
        return;
    }
    
    isSubmitting.value = true;
    localError.value = null;
    const token = authStore.token;

    try {
        const endpoint = '/api/admin/treatments/areas/factor.delete'; // Rota de delete
        
        await $fetch(endpoint, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            body: { 
                area_id: props.area.id,
                size_key: factor.size_key,
            },
        });

        emit('success');
        
    } catch (e: any) {
        console.error('Erro ao deletar fator:', e);
        emit('error', 'Falha ao deletar o fator: ' + (e?.data?.statusMessage || e?.message));

    } finally {
        isSubmitting.value = false;
    }
};
</script>