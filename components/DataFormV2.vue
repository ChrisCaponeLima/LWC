// /components/DataFormV2.vue - V1.6 - REMOÇÃO DOS CAMPOS OPCIONAIS EVENTO, AÇÃO SEMANAL E DIAS DE TREINO.
<template>
<div class="form-container bg-white p-6 rounded-lg shadow-xl mt-0">
<h3 class="text-xl font-bold mb-4 text-gray-800">
<span class="text-indigo-600">{{ patientName }}</span>
</h3>

<form @submit.prevent="submitRecord" class="space-y-6">

 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
 <label for="record_date" class="block text-sm font-medium text-gray-700">Data do Registro</label>
 <input 
 type="date" 
 id="record_date" 
 v-model="formData.record_date" 
 required 
 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
 />
 </div>
 <div>
 <label for="weight" class="block text-sm font-medium text-gray-700">Peso (kg)</label>
 <input 
 type="number" 
 id="weight" 
 v-model.number="formData.weight" 
 required 
 step="0.01" 
 min="1"
 placeholder="Ex: 85.5"
 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
 />
 </div>
 </div>

  <div class="border p-4 rounded-md bg-gray-50">
 <h4 class="text-lg font-semibold mb-3 text-gray-700">Medidas Corporais (cm)</h4>
 
 <div v-if="dynamicMeasurements.length > 0">
 <div v-for="(measurement, index) in dynamicMeasurements" :key="index" class="flex gap-2 mb-3 items-end">
 <div class="flex-grow">
 <label :for="`measure_select_${index}`" class="block text-xs font-medium text-gray-600">Área</label>
 <select 
 :id="`measure_select_${index}`" 
 v-model="measurement.id" 
 required 
 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border text-sm"
 >
 <option value="" disabled>Selecione a Medida</option>
 <option v-for="m in availableMeasurements(measurement.id)" :key="m.id" :value="m.id">{{ m.name }} (cm)</option>
 </select>
 </div>
 <div class="w-2/5">
 <label :for="`measure_value_${index}`" class="block text-xs font-medium text-gray-600">Valor (cm)</label>
 <input 
 type="number" 
 :id="`measure_value_${index}`" 
 v-model.number="measurement.value" 
 step="0.1" 
 min="1"
 required
 placeholder="00.0"
 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border text-sm"
 />
 </div>
 <button type="button" @click="removeMeasurement(index)" class="p-2 text-red-600 hover:text-red-800 transition rounded-md" title="Remover Medida">
 <i class="fas fa-trash-alt"></i>
 </button>
 </div>
 </div>
 <button type="button" @click="addMeasurement" :disabled="allMeasurementsUsed" class="mt-2 px-3 py-2 bg-indigo-500 text-white rounded-md text-sm font-medium hover:bg-indigo-600 disabled:bg-gray-400 transition">
 <i class="fas fa-plus mr-1"></i> Adicionar Medida
 </button>
 <p v-if="allMeasurementsUsed" class="mt-2 text-xs text-red-500">Todas as medidas disponíveis foram adicionadas.</p>
 </div>

  
  <div>
 <label for="observations" class="block text-sm font-medium text-gray-700">Observações</label>
 <textarea id="observations" v-model="formData.observations" rows="3" placeholder="Comentários sobre a semana, sentimentos, desafios..." class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"></textarea>
 <p class="text-xs text-gray-500 mt-1">Max 2000 caracteres.</p>
 </div>
 
  <div v-if="submissionError" class="p-3 bg-red-100 text-red-700 border border-red-400 rounded-md">
 {{ submissionError }}
 </div>

  <div class="flex gap-4">
 <button 
 type="button" 
 @click="emit('cancel')"
 class="w-1/3 px-4 py-3 bg-gray-300 text-gray-700 rounded-md font-bold hover:bg-gray-400 transition duration-150"
 >
 Cancelar
 </button>

 <button 
 type="submit" 
 :disabled="isSubmitting"
 class="w-2/3 px-4 py-3 bg-btn-principal text-btn-font-principal rounded-md font-bold hover:opacity-80 disabled:opacity-50 transition duration-150"
 >
 {{ isSubmitting ? 'Salvando...' : 'Salvar Registro' }}
 </button>
 </div>

</form>
</div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'; 
import { useAuthStore } from '~/stores/auth'; 

// --- PROPS E EMITS (Mantidos) ---
const props = defineProps<{
userId: number; 
patientName: string; 
}>();

// --- TIPOS ---
interface Measurement {
id: number | string; 
value: number | null;
}
interface FormData {
record_date: string;
weight: number | null;
// REMOVIDO: event: string;
// REMOVIDO: weeklyAction: string;
// REMOVIDO: workoutDays: number | null;
observations: string;
}

const emit = defineEmits(['recordSaved', 'cancel']); 

// --- ESTADO E STORES ---
const authStore = useAuthStore();
const isSubmitting = ref(false);
const submissionError = ref<string | null>(null);

const today = new Date().toISOString().split('T')[0];

const formData: FormData = reactive({
record_date: today,
weight: null,
// REMOVIDO: event: '',
// REMOVIDO: weeklyAction: '',
// REMOVIDO: workoutDays: null,
observations: '',
});

// --- LÓGICA DE MEDIDAS (Mantida) ---
const availableMeasures = [
{ id: 1, name: 'Pescoço', unit: 'cm' },
{ id: 2, name: 'Busto', unit: 'cm' },
{ id: 3, name: 'Tórax', unit: 'cm' },
{ id: 4, name: 'Cintura', unit: 'cm' },
{ id: 5, name: 'Quadril', unit: 'cm' },
{ id: 6, name: 'Coxa', unit: 'cm' },
{ id: 7, name: 'Braço', unit: 'cm' },
{ id: 8, name: 'Antebraço', unit: 'cm' },
];

const dynamicMeasurements = ref<Measurement[]>([]); 

const usedMeasureIds = computed(() => {
return dynamicMeasurements.value
.map(m => m.id)
.filter((id): id is number => typeof id === 'number'); 
});

const availableMeasurements = (currentId: number | string) => {
return availableMeasures.filter(m => !usedMeasureIds.value.includes(m.id as number) || m.id === currentId);
};

const allMeasurementsUsed = computed(() => {
return usedMeasureIds.value.length === availableMeasures.length;
});

const addMeasurement = () => {
if (allMeasurementsUsed.value) return;
const nextAvailable = availableMeasures.find(m => !usedMeasureIds.value.includes(m.id as number));
dynamicMeasurements.value.push({ 
id: nextAvailable ? nextAvailable.id : '', 
value: null 
});
};

const removeMeasurement = (index: number) => {
dynamicMeasurements.value.splice(index, 1);
};


// --- SUBMISSÃO (CORRIGIDA - V1.5) ---
const submitRecord = async () => {
submissionError.value = null;
isSubmitting.value = true;

const patientUserId = props.userId;
const token = authStore.token;

if (!patientUserId || !token) {
 submissionError.value = 'Erro de Autenticação: Paciente ou profissional não identificado.';
 isSubmitting.value = false;
 if (!token) authStore.logout();
 return;
}

const validMeasurements = dynamicMeasurements.value
.filter(m => m.id && m.value !== null && (m.value as number) > 0)
.map(m => ({
 measurement_id: m.id as number, 
 value: m.value as number 
}));

const payload = {
 userId: patientUserId, 
 recordDate: formData.record_date, 
 weight: formData.weight,
 // REMOVIDO: event: formData.event || '', 
 // REMOVIDO: weeklyAction: formData.weeklyAction || '', 
 // REMOVIDO: workoutDays: formData.workoutDays, 
 // Os campos omitidos acima serão enviados como `undefined` (e tratados como NULL pelo H3/backend)
 observations: formData.observations || '',
 measurements: validMeasurements,
 // CORREÇÃO CRÍTICA: Envia um array vazio para evitar o erro de 'map' no backend.
 tempFiles: [], 
};

try {
 const response = await $fetch<{ recordId: number }>('/api/records', { 
 method: 'POST',
 headers: { 
  Authorization: `Bearer ${token}`, 
  'Content-Type': 'application/json' 
 },
 body: payload, 
 });

 // Limpa dados e reseta o formulário
 formData.weight = null;
 // REMOVIDO: formData.event = '';
 // REMOVIDO: formData.weeklyAction = '';
 // REMOVIDO: formData.workoutDays = null;
 formData.observations = '';
 dynamicMeasurements.value = []; 

 emit('recordSaved');

} catch (error: any) {
 const errorData = error?.response?._data || error;
 submissionError.value = `Falha ao salvar. Detalhe: ${errorData.message || errorData || 'Erro desconhecido.'}`;
 console.error('Erro de submissão:', error);
} finally {
 isSubmitting.value = false;
}
};
</script>

<style scoped>
.bg-btn-principal {
background-color: #10B981; 
}
.text-btn-font-principal {
color: white;
}
</style>