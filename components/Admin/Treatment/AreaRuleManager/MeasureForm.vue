// /components/Admin/Treatment/AreaRuleManager/MeasureForm.vue - V1.1 - Remoção temporária da importação de useToast

<template>
    <div class="p-4 border rounded-lg bg-white shadow-sm">
        <h5 class="font-bold text-gray-700 mb-3 flex items-center">
            <i class="fas fa-balance-scale-right mr-2 text-blue-600"></i> Regra de Medida
        </h5>

        <form @submit.prevent="handleUpsertMeasure">
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label for="measure_type" class="block text-sm font-medium text-gray-700">Tipo (Chave Única)</label>
                    <input 
                        v-model="form.measure_type" 
                        type="text" 
                        id="measure_type" 
                        required
                        placeholder="Ex: area, peso, volume"
                        :disabled="isSubmitting"
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label for="measure_name" class="block text-sm font-medium text-gray-700">Nome de Exibição</label>
                    <input 
                        v-model="form.measure_name" 
                        type="text" 
                        id="measure_name" 
                        required
                        placeholder="Ex: Área (cm²), Peso (kg)"
                        :disabled="isSubmitting"
                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
            </div>

            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <input 
                        id="is_required" 
                        name="is_required" 
                        type="checkbox" 
                        v-model="form.is_required"
                        :disabled="isSubmitting"
                        class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    >
                    <label for="is_required" class="ml-2 block text-sm font-medium text-gray-700">
                        Obrigatória para Cálculo?
                    </label>
                </div>
                
                <div class="flex space-x-3">
                    <button 
                        v-if="currentMeasure"
                        type="button" 
                        @click="handleDeleteMeasure"
                        :disabled="isSubmitting"
                        class="inline-flex justify-center rounded-md border border-red-300 shadow-sm px-4 py-2 bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 transition duration-150"
                    >
                        <i v-if="isSubmitting && isDeleting" class="fas fa-spinner fa-spin mr-2"></i>
                        <i v-else class="fas fa-times-circle mr-2"></i> 
                        Remover Regra
                    </button>

                    <button 
                        type="submit" 
                        :disabled="isSubmitting || !form.measure_type || !form.measure_name"
                        class="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
                    >
                        <i v-if="isSubmitting && !isDeleting" class="fas fa-spinner fa-spin mr-2"></i>
                        {{ currentMeasure ? 'Atualizar Regra' : 'Salvar Nova Regra' }}
                    </button>
                </div>
            </div>
            <p v-if="localError" class="mt-2 text-xs text-red-600">{{ localError }}</p>
        </form>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
// import { useToast } from '~/composables/useToast'; // Importação comentada para resolver erro de resolução.
import { Area, Measure } from '../AreaRuleManager.vue'; // Importa as interfaces globais

// --- Interfaces & Types ---
interface FormState {
    measure_type: string;
    measure_name: string;
    is_required: boolean;
}

// --- Props e Emits ---
const props = defineProps<{
    area: Area; // A área selecionada
}>();

const emit = defineEmits(['success', 'error']); // Sucesso para dar refresh na lista principal, error para mostrar globalmente

// --- Estado ---
const authStore = useAuthStore();
const isSubmitting = ref(false);
const isDeleting = ref(false);
const localError = ref<string | null>(null);

const emptyForm: FormState = {
    measure_type: '',
    measure_name: '',
    is_required: true,
};

const form = ref<FormState>({ ...emptyForm });

// --- Computed Properties ---
const currentMeasure = computed<Measure | null>(() => props.area.treatment_area_measures);

// --- Lógica de Inicialização e Watcher ---
watch(() => props.area, (newArea) => {
    // Quando a área selecionada muda, atualiza o formulário
    localError.value = null;
    if (newArea.treatment_area_measures) {
        // Modo Edição
        form.value = {
            measure_type: newArea.treatment_area_measures.measure_type,
            measure_name: newArea.treatment_area_measures.measure_name,
            is_required: newArea.treatment_area_measures.is_required,
        };
    } else {
        // Modo Criação/Nova
        form.value = { ...emptyForm };
    }
}, { immediate: true });

// --- Lógica de Criação/Atualização (Upsert) ---

const handleUpsertMeasure = async () => {
    isSubmitting.value = true;
    isDeleting.value = false;
    localError.value = null;
    const token = authStore.token;

    try {
        const endpoint = '/api/admin/treatments/areas/measure'; // Rota de upsert/post
        
        const payload = {
            area_id: props.area.id,
            measure_type: form.value.measure_type.trim(),
            measure_name: form.value.measure_name.trim(),
            is_required: form.value.is_required,
        };
        
        const result = await $fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: payload,
        });

        emit('success');
        // A mensagem de sucesso é tratada pelo componente pai (AreaRuleManager.vue)
        
    } catch (e: any) {
        console.error('Erro ao salvar medida:', e);
        localError.value = 'Falha ao salvar a regra de medida: ' + (e?.data?.statusMessage || e?.message);
        emit('error', 'Falha ao salvar a regra de medida: ' + (e?.data?.statusMessage || e?.message));

    } finally {
        isSubmitting.value = false;
    }
};

// --- Lógica de Deleção ---

const handleDeleteMeasure = async () => {
    if (!currentMeasure.value) return;

    if (!confirm(`Tem certeza que deseja remover a regra de medida para a área "${props.area.name}"?`)) {
        return;
    }
    
    isSubmitting.value = true;
    isDeleting.value = true;
    localError.value = null;
    const token = authStore.token;

    try {
        const endpoint = '/api/admin/treatments/areas/measure.delete'; // Rota de delete
        
        await $fetch(endpoint, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            body: { area_id: props.area.id },
        });

        // Após deletar, o watch em props.area no componente pai fará o refresh
        emit('success');
        
    } catch (e: any) {
        console.error('Erro ao deletar medida:', e);
        localError.value = 'Falha ao deletar a regra de medida: ' + (e?.data?.statusMessage || e?.message);
        emit('error', 'Falha ao deletar a regra de medida: ' + (e?.data?.statusMessage || e?.message));

    } finally {
        isSubmitting.value = false;
        isDeleting.value = false;
    }
};
</script>