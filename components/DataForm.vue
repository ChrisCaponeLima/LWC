// /components/DataForm.vue - V2.2.18 - Usa Composável (TS) para checagem de IDs e limpeza.

<template>
<div class="form-container bg-white p-6 rounded-lg shadow-xl mt-6">
<h3 class="text-xl font-bold mb-4 text-gray-800">Adicionar Novo Registro</h3>
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

<button 
type="button" 
@click="removeMeasurement(index)" 
class="p-2 text-red-600 hover:text-red-800 transition rounded-md"
title="Remover Medida"
>
<i class="fas fa-trash-alt"></i>
</button>
</div>
</div>

<button 
type="button" 
@click="addMeasurement"
:disabled="allMeasurementsUsed"
class="mt-2 px-3 py-2 bg-indigo-500 text-white rounded-md text-sm font-medium hover:bg-indigo-600 disabled:bg-gray-400 transition"
>
<i class="fas fa-plus mr-1"></i> Adicionar Medida
</button>
<p v-if="allMeasurementsUsed" class="mt-2 text-xs text-red-500">Todas as medidas disponíveis foram adicionadas.</p>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label for="event" class="block text-sm font-medium text-gray-700">Evento</label>
<input type="text" id="event" v-model="formData.event" placeholder="Ex: Festa de aniversário, Viagem" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
</div>
<div>
<label for="weeklyAction" class="block text-sm font-medium text-gray-700">Ação Semanal</label>
<input type="text" id="weeklyAction" v-model="formData.weeklyAction" placeholder="Ex: Dieta cutting, Fase de manutenção" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
</div>
<div>
<label for="workoutDays" class="block text-sm font-medium text-gray-700">Dias de Treino</label>
<input type="number" id="workoutDays" v-model.number="formData.workoutDays" min="0" max="7" placeholder="Ex: 3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
</div>
</div>

<div>
<label for="observations" class="block text-sm font-medium text-gray-700">Observações</label>
<textarea id="observations" v-model="formData.observations" rows="3" placeholder="Comentários sobre a semana, sentimentos, desafios..." class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"></textarea>
<p class="text-xs text-gray-500 mt-1">Max 2000 caracteres.</p>
</div>

<div class="mt-4">
<button 
 type="button" 
 @click="goToImageUpload"
 class="w-full px-4 py-3 bg-indigo-500 text-white rounded-md font-bold hover:bg-indigo-600 transition duration-150 flex items-center justify-center"
 title="Adicionar ou Editar Fotos de Evolução/Forma"
>
 <i class="fas fa-camera text-2xl"></i> 
</button>
</div>

<div v-if="tempPhotoFileIds.length > 0 || tempFormaFileIds.length > 0" class="p-3 bg-yellow-100 text-yellow-700 border border-yellow-400 rounded-md">
<i class="fas fa-exclamation-triangle mr-2"></i>
Há {{ tempPhotoFileIds.length }} foto(s) de Evolução e {{ tempFormaFileIds.length }} foto(s) de Forma prontas para serem anexadas.
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
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '~/stores/auth'; 
import { clearAllTempFiles } from '~/composables/useTempFiles'; // Importa a função de limpeza

// Tipos
interface Measurement {
    id: number | string; // Permitir string vazia para o v-model inicial
    value: number | null;
}
interface FormData {
    record_date: string;
    weight: number | null;
    event: string;
    weeklyAction: string;
    workoutDays: number | null;
    observations: string;
}

const emit = defineEmits(['recordSaved', 'cancel', 'openImageEditor']);

const authStore = useAuthStore();
const isSubmitting = ref(false);
const submissionError = ref<string | null>(null);

const today = new Date().toISOString().split('T')[0];

const formData: FormData = reactive({
    record_date: today,
    weight: null,
    event: '',
    weeklyAction: '',
    workoutDays: null,
    observations: '',
});

// IDs temporários lidos da sessão (para o display e envio ao backend)
const tempPhotoFileIds = ref<string[]>([]);
const tempFormaFileIds = ref<string[]>([]);

const checkTempFiles = () => {
    if (process.client) {
        // Lemos diretamente as chaves de ID salvas pelo Composável
        const photoIdsRaw = sessionStorage.getItem('tempPhotoFileIds'); 
        const formaIdsRaw = sessionStorage.getItem('tempFormaFileIds');
        
        try {
            tempPhotoFileIds.value = photoIdsRaw ? JSON.parse(photoIdsRaw) : [];
            tempFormaFileIds.value = formaIdsRaw ? JSON.parse(formaIdsRaw) : [];
        } catch (e) {
            console.error("Erro ao parsear IDs temporários da sessão:", e);
            tempPhotoFileIds.value = [];
            tempFormaFileIds.value = [];
        }
    }
};

onMounted(() => {
 checkTempFiles();
 window.addEventListener('focus', checkTempFiles); 
});

onUnmounted(() => { 
 if (process.client) {
  window.removeEventListener('focus', checkTempFiles);
 }
});

// LISTA FIXA DAS 8 MEDIDAS
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
        .filter((id): id is number => typeof id === 'number'); // Filtra e tipa
});

const availableMeasurements = (currentId: number | string) => {
    return availableMeasures.filter(m => !usedMeasureIds.value.includes(m.id) || m.id === currentId);
};

const allMeasurementsUsed = computed(() => {
    return usedMeasureIds.value.length === availableMeasures.length;
});

const addMeasurement = () => {
    if (allMeasurementsUsed.value) return;
    const nextAvailable = availableMeasures.find(m => !usedMeasureIds.value.includes(m.id));
    dynamicMeasurements.value.push({ 
        id: nextAvailable ? nextAvailable.id : '', 
        value: null 
    });
};

const removeMeasurement = (index: number) => {
    dynamicMeasurements.value.splice(index, 1);
};

const goToImageUpload = () => {
emit('openImageEditor');
};

const submitRecord = async () => {
submissionError.value = null;
isSubmitting.value = true;

const userId = authStore.user?.userId;
const token = authStore.token;

if (!userId || !token) {
submissionError.value = 'Erro de Autenticação: Usuário não logado ou token indisponível.';
isSubmitting.value = false;
authStore.logout();
return;
}

const data = new FormData();
data.append('user_id', String(userId));
data.append('record_date', formData.record_date);
data.append('weight', String(formData.weight));
data.append('event', formData.event || '');
data.append('weeklyAction', formData.weeklyAction || '');
data.append('workoutDays', formData.workoutDays !== null ? String(formData.workoutDays) : '');
data.append('observations', formData.observations || '');

const validMeasurements = dynamicMeasurements.value
.filter(m => m.id && m.value !== null && (m.value as number) > 0)
.map(m => ({
measurement_id: m.id as number, 
value: m.value as number 
}));

data.append('measurements', JSON.stringify(validMeasurements)); 

// 🚨 LOG DE DIAGNÓSTICO NO FRONTEND (MANTIDO)
console.log('Dados temporários para envio:', { 
tempPhotoFileIds: tempPhotoFileIds.value, 
tempFormaFileIds: tempFormaFileIds.value 
});

// Anexa os arrays de IDs temporários como JSON string para o backend
if (tempPhotoFileIds.value.length > 0) {
 data.append('tempPhotoFileIds', JSON.stringify(tempPhotoFileIds.value));
}
if (tempFormaFileIds.value.length > 0) {
 data.append('tempFormaFileIds', JSON.stringify(tempFormaFileIds.value));
}

try {
const response = await $fetch('/api/records', {
    method: 'POST',
    headers: { 
        Authorization: `Bearer ${token}` 
    },
    body: data, 
});

// Limpa dados e reseta o formulário
formData.weight = null;
formData.event = '';
formData.weeklyAction = '';
formData.workoutDays = null;
formData.observations = '';

dynamicMeasurements.value = []; 

// Limpa TODAS as chaves da sessão através do composável
clearAllTempFiles();

// Reseta os refs locais
tempPhotoFileIds.value = [];
tempFormaFileIds.value = [];

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