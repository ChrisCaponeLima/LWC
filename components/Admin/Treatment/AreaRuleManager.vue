// /components/Admin/Treatment/AreaRuleManager.vue - V1.1 - Remoção temporária da importação de useToast

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="emit('close')"></div>

            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div 
                class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
                :class="{ 'animate-in fade-in zoom-in-50 duration-300': isOpen }"
            >
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="w-full">
                        <h3 class="text-2xl leading-6 font-bold text-gray-900 mb-2" id="modal-title">
                            ⚙️ Gerenciamento de Regras de Preço Avançado
                        </h3>
                        <p class="text-sm text-gray-500 mb-6">
                            Defina as Áreas de Tratamento e seus Fatores (Limites de Medida) que serão usados para calcular o preço final de um serviço.
                        </p>

                        <div v-if="globalError" class="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                            <i class="fas fa-exclamation-triangle mr-2"></i> {{ globalError }}
                        </div>
                        <div v-if="globalMessage" class="mt-4 p-3 text-sm text-green-700 bg-green-100 rounded-lg">
                            <i class="fas fa-check-circle mr-2"></i> {{ globalMessage }}
                        </div>

                        <div v-if="isLoading" class="p-10 text-center">
                            <i class="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
                            <p class="mt-2 text-gray-600">Carregando regras existentes...</p>
                        </div>
                        
                        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            <div class="md:col-span-1 border-r pr-6">
                                <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <i class="fas fa-plus-circle mr-2 text-indigo-600"></i> Adicionar Nova Área
                                </h4>
                                
                                <form @submit.prevent="handleCreateArea">
                                    <label for="new_area_name" class="block text-sm font-medium text-gray-700">Nome da Área</label>
                                    <input 
                                        v-model="newAreaName" 
                                        type="text" 
                                        id="new_area_name" 
                                        required
                                        :disabled="isSubmitting"
                                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                    
                                    <p v-if="areaError" class="mt-1 text-xs text-red-600">{{ areaError }}</p>

                                    <button 
                                        type="submit" 
                                        :disabled="isSubmitting || !newAreaName.trim()"
                                        class="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition duration-150"
                                    >
                                        <i v-if="isSubmitting" class="fas fa-spinner fa-spin mr-2"></i>
                                        Criar Área
                                    </button>
                                </form>
                                
                                <h4 class="text-lg font-semibold text-gray-800 mt-8 mb-4 flex items-center border-t pt-4">
                                    <i class="fas fa-list-alt mr-2 text-gray-600"></i> Áreas Existentes
                                </h4>
                                
                                <ul class="space-y-2 max-h-96 overflow-y-auto pr-2">
                                    <li 
                                        v-for="area in areas" 
                                        :key="area.id"
                                        @click="selectArea(area)"
                                        :class="{'bg-indigo-50 border-indigo-600': selectedArea?.id === area.id, 'bg-gray-50 border-gray-200 hover:bg-gray-100': selectedArea?.id !== area.id}"
                                        class="p-3 border rounded-lg cursor-pointer transition duration-150 flex justify-between items-center text-sm font-medium"
                                    >
                                        {{ area.name }}
                                        <i class="fas fa-chevron-right text-indigo-600 ml-2" v-if="selectedArea?.id === area.id"></i>
                                        <button @click.stop="handleDeleteArea(area)" class="text-red-500 hover:text-red-700 ml-3" title="Deletar Área">
                                             <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            <div class="md:col-span-2">
                                <div v-if="!selectedArea" class="p-10 text-center bg-gray-50 rounded-lg">
                                    <i class="fas fa-mouse-pointer text-4xl text-gray-400"></i>
                                    <p class="mt-3 text-gray-600">Selecione uma área na lista para configurar suas regras de preço.</p>
                                </div>
                                
                                <div v-else>
                                    <h4 class="text-xl font-bold text-indigo-700 mb-4 border-b pb-2">
                                        <i class="fas fa-ruler-combined mr-2"></i> Configurando: {{ selectedArea.name }}
                                    </h4>

                                    <MeasureForm 
                                        :area="selectedArea" 
                                        @success="fetchAreas" 
                                        @error="setGlobalError"
                                    />

                                    <hr class="my-6">

                                    <FactorManager 
                                        :area="selectedArea" 
                                        @success="fetchAreas" 
                                        @error="setGlobalError"
                                    />

                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button 
                        type="button" 
                        @click="emit('close')" 
                        class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition duration-150"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
// import { useToast } from '~/composables/useToast'; // Importação comentada para resolver erro de resolução.

// Importar sub-componentes 
import MeasureForm from './AreaRuleManager/MeasureForm.vue';
import FactorManager from './AreaRuleManager/FactorManager.vue';

// --- Interfaces (Refletindo a AreaWithDetails do AreaService) ---
interface Measure {
    id: number;
    area_id: number;
    measure_type: string;
    measure_name: string;
    is_required: boolean;
}

interface Factor {
    id: number;
    area_id: number;
    size_key: 'P' | 'M' | 'G' | 'GG';
    measure_min: string; // Vem como string Decimal do backend
    measure_max: string; // Vem como string Decimal do backend
}

interface Area {
    id: number;
    name: string;
    treatment_area_measures: Measure | null;
    treatment_factors: Factor[];
}

// --- Props e Emits ---
const props = defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits(['close']);

// --- Estado Global ---
const authStore = useAuthStore();
// const toast = useToast(); // Variável toast removida, pois a importação foi comentada.
const isLoading = ref(false);
const isSubmitting = ref(false);
const globalError = ref<string | null>(null);
const globalMessage = ref<string | null>(null);

// --- Estado de Gerenciamento de Área ---
const areas = ref<Area[]>([]);
const selectedArea = ref<Area | null>(null);
const newAreaName = ref('');
const areaError = ref<string | null>(null);

// --- Watcher para Reset e Load de Dados ---
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        fetchAreas();
        selectedArea.value = null;
        globalError.value = null;
        globalMessage.value = null;
    }
});

// --- Funções Auxiliares ---

const setGlobalError = (message: string) => {
    globalError.value = message;
    globalMessage.value = null;
    // Auto-limpa o erro após 5 segundos
    setTimeout(() => { globalError.value = null; }, 5000); 
};

const setGlobalMessage = (message: string) => {
    globalMessage.value = message;
    globalError.value = null;
    // Auto-limpa a mensagem após 5 segundos
    setTimeout(() => { globalMessage.value = null; }, 5000); 
};

const selectArea = (area: Area) => {
    selectedArea.value = area;
};


// -----------------------------------------------------------
// LÓGICA DE FETCH (LISTAGEM)
// -----------------------------------------------------------

const fetchAreas = async () => {
    isLoading.value = true;
    globalError.value = null;
    const token = authStore.token;
    
    // Rota de listagem completa de regras (Admin)
    const endpoint = '/api/admin/treatments/areas/list'; 

    try {
        const response = await $fetch<Area[]>(endpoint, { 
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });

        areas.value = response;
        
        // Se a área selecionada estava sendo editada, mantém ela selecionada com os dados atualizados
        if (selectedArea.value) {
            const updatedArea = response.find(a => a.id === selectedArea.value?.id);
            if (updatedArea) {
                selectedArea.value = updatedArea;
            } else {
                 // Caso a área tenha sido deletada por outra pessoa/método
                selectedArea.value = null;
            }
        }

    } catch (e: any) {
        console.error('Erro ao buscar áreas de tratamento:', e);
        setGlobalError(e?.data?.statusMessage || 'Falha ao carregar a lista de áreas de tratamento.');
    } finally {
        isLoading.value = false;
    }
};

// -----------------------------------------------------------
// LÓGICA DE CRIAÇÃO (treatment_areas)
// -----------------------------------------------------------

const handleCreateArea = async () => {
    if (!newAreaName.value.trim()) {
        areaError.value = 'O nome é obrigatório.';
        return;
    }
    
    isSubmitting.value = true;
    areaError.value = null;
    const token = authStore.token;

    try {
        const endpoint = '/api/admin/treatments/areas/create';
        
        const result = await $fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: { area_name: newAreaName.value.trim() },
        });
        
        setGlobalMessage((result as any).message); // Assumindo que result tem a propriedade message
        newAreaName.value = ''; // Limpa o campo
        fetchAreas(); // Atualiza a lista

    } catch (e: any) {
        console.error('Erro ao criar área:', e);
        areaError.value = e?.data?.statusMessage || 'Falha ao criar a área.';
    } finally {
        isSubmitting.value = false;
    }
};

// -----------------------------------------------------------
// LÓGICA DE DELEÇÃO (treatment_areas)
// -----------------------------------------------------------

const handleDeleteArea = async (area: Area) => {
    if (!confirm(`Tem certeza que deseja deletar a área "${area.name}"? Isso removerá todas as regras de medida e fatores associados!`)) {
        return;
    }
    
    isSubmitting.value = true;
    globalError.value = null;
    const token = authStore.token;

    try {
        const endpoint = '/api/admin/treatments/areas/delete';
        
        const result = await $fetch(endpoint, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            body: { area_id: area.id }, // ID no body para DELETE
        });
        
        setGlobalMessage((result as any).message);
        fetchAreas(); // Atualiza a lista
        if (selectedArea.value?.id === area.id) {
            selectedArea.value = null;
        }

    } catch (e: any) {
        console.error('Erro ao deletar área:', e);
        setGlobalError(e?.data?.statusMessage || 'Falha ao deletar a área.');
    } finally {
        isSubmitting.value = false;
    }
};

// -----------------------------------------------------------
// HOOKS
// -----------------------------------------------------------

onMounted(() => {
    // Se o modal iniciar aberto (em caso de refactor), carrega os dados
    if (props.isOpen) {
        fetchAreas();
    }
});

// Expondo funções para os sub-componentes via props/emits
defineExpose({
    setGlobalError, // Permite que os sub-componentes usem o manipulador de erro global
});
</script>