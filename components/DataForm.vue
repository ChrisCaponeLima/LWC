// /components/DataForm.vue - V2.2.10 - Alterado o campo peso para aceitar duas casas decimais.
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

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div class="flex flex-col">
 <label for="photo" class="block text-sm font-medium text-gray-700">Foto de Evolução (Opcional)</label>
 <input type="file" id="photo" @change="handlePhotoUpload" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
 <div v-if="photoFile" class="mt-2 flex items-center">
 <input type="checkbox" id="photo_private" v-model="formData.photo_is_private" class="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4">
 <label for="photo_private" class="ml-2 text-sm text-gray-700">Tornar Foto de Evolução privada (🔒)</label>
 </div>
 </div>
 
 <div class="flex flex-col">
 <label for="forma" class="block text-sm font-medium text-gray-700">Foto de Forma (Opcional)</label>
 <input type="file" id="forma" @change="handleFormaUpload" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
 <div v-if="formaFile" class="mt-2 flex items-center">
 <input type="checkbox" id="forma_private" v-model="formData.forma_is_private" class="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4">
 <label for="forma_private" class="ml-2 text-sm text-gray-700">Tornar Foto de Forma privada (🔒)</label>
 </div>
 </div>
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

<script setup>
import { reactive, ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth'; 

const emit = defineEmits(['recordSaved', 'cancel']);

const authStore = useAuthStore();
const isSubmitting = ref(false);
const submissionError = ref(null);

const today = new Date().toISOString().split('T')[0];

const formData = reactive({
record_date: today,
weight: null,
event: '',
weeklyAction: '', 
workoutDays: null,
observations: '',
photo_is_private: false,
forma_is_private: false,
});

// LISTA FIXA DAS 8 MEDIDAS (MANTIDA DA V2.7)
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

// 🚨 MUDANÇA CRÍTICA 1: Estado inicial VAZIO. O campo de medidas não é renderizado por padrão.
const dynamicMeasurements = ref([]); 

const usedMeasureIds = computed(() => {
return dynamicMeasurements.value
.map(m => m.id)
.filter(id => id !== null && id !== ''); // IDs em uso
});

// Retorna apenas as medidas que ainda não foram usadas, além da opção atual
const availableMeasurements = (currentId) => {
return availableMeasures.filter(m => !usedMeasureIds.value.includes(m.id) || m.id === currentId);
};

// Verifica se todas as medidas disponíveis foram adicionadas
const allMeasurementsUsed = computed(() => {
return usedMeasureIds.value.length === availableMeasures.length;
});

const addMeasurement = () => {
if (allMeasurementsUsed.value) return;

// Tenta encontrar a primeira medida não usada para preencher a nova linha
const nextAvailable = availableMeasures.find(m => !usedMeasureIds.value.includes(m.id));

dynamicMeasurements.value.push({ 
id: nextAvailable ? nextAvailable.id : '', 
value: null 
});
};

const removeMeasurement = (index) => {
dynamicMeasurements.value.splice(index, 1);
};


const photoFile = ref(null);
const formaFile = ref(null);

const handlePhotoUpload = (event) => {
photoFile.value = event.target.files ? event.target.files[0] : null;
if (!photoFile.value) formData.photo_is_private = false;
};

const handleFormaUpload = (event) => {
formaFile.value = event.target.files ? event.target.files[0] : null;
if (!formaFile.value) formData.forma_is_private = false;
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
data.append('weight', formData.weight);
data.append('event', formData.event || '');
data.append('weeklyAction', formData.weeklyAction || '');
data.append('workoutDays', formData.workoutDays ? String(formData.workoutDays) : '');
data.append('observations', formData.observations || '');

// Constrói a lista de medidas para o backend, filtrando valores nulos/vazios
const validMeasurements = dynamicMeasurements.value
.filter(m => m.id && m.value !== null && m.value > 0)
.map(m => ({
measurement_id: m.id, 
value: m.value 
}));

// Envia a lista de medidas para o backend (records.post.ts)
data.append('measurements', JSON.stringify(validMeasurements)); 

// Envia os arquivos e os flags de privacidade
if (photoFile.value) {
data.append('photo', photoFile.value);
data.append('photo_is_private', String(formData.photo_is_private));
}
if (formaFile.value) {
data.append('forma', formaFile.value);
data.append('forma_is_private', String(formData.forma_is_private));
}

try {
const response = await fetch('/api/records', {
method: 'POST',
headers: { Authorization: `Bearer ${token}` },
body: data,
});

if (response.ok) {
// Limpa dados e reseta o formulário
formData.weight = null;
formData.event = '';
formData.weeklyAction = '';
formData.workoutDays = null;
formData.observations = '';
formData.photo_is_private = false;
formData.forma_is_private = false;

// 🚨 MUDANÇA CRÍTICA 2: Reseta as medidas dinâmicas para VAZIO.
dynamicMeasurements.value = []; 

photoFile.value = null;
formaFile.value = null;
document.getElementById('photo').value = null;
document.getElementById('forma').value = null;

emit('recordSaved');
} else {
const errorData = await response.json();
submissionError.value = `Falha ao salvar. Detalhe: ${errorData.message || 'Erro desconhecido.'}`;
}
} catch (error) {
submissionError.value = 'Erro de rede: Não foi possível conectar com o servidor.';
console.error('Erro de submissão:', error);
} finally {
isSubmitting.value = false;
}
};
</script>