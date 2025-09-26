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
            step="0.1" 
            min="1"
            placeholder="Ex: 85.5"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="waist" class="block text-sm font-medium text-gray-700">Cintura (cm)</label>
          <input 
            type="number" 
            id="waist" 
            v-model.number="formData.waist" 
            step="0.1" 
            min="1"
            placeholder="Ex: 92.0"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
          <p class="mt-1 text-xs text-gray-500">Opcional, importante para gráficos.</p>
        </div>
        <div>
          <label for="event" class="block text-sm font-medium text-gray-700">Evento (Novo Campo)</label>
          <input 
            type="text" 
            id="event" 
            v-model="formData.event" 
            placeholder="Ex: Festa de aniversário, Viagem"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="weeklyAction" class="block text-sm font-medium text-gray-700">Ação Semanal (Novo Campo)</label>
          <select 
            id="weeklyAction" 
            v-model="formData.weeklyAction" 
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white"
          >
            <option value="">Selecione uma opção</option>
            <option value="Manutenção">Manutenção</option>
            <option value="Déficit">Déficit (Perda de peso)</option>
            <option value="Superávit">Superávit (Ganho de massa)</option>
          </select>
        </div>
        <div>
          <label for="workoutDays" class="block text-sm font-medium text-gray-700">Dias de Treino (Novo Campo)</label>
          <input 
            type="number" 
            id="workoutDays" 
            v-model.number="formData.workoutDays" 
            min="0" 
            max="7"
            placeholder="Ex: 3"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        </div>
      </div>

      <div>
        <label for="observations" class="block text-sm font-medium text-gray-700">Observações (Novo Campo)</label>
        <textarea 
          id="observations" 
          v-model="formData.observations" 
          rows="3"
          placeholder="Comentários sobre a semana, sentimentos, desafios..."
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
        ></textarea>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="photo" class="block text-sm font-medium text-gray-700">Foto de Evolução (Opcional)</label>
          <input 
            type="file" 
            id="photo" 
            @change="handlePhotoUpload" 
            accept="image/*"
            class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        <div>
          <label for="forma" class="block text-sm font-medium text-gray-700">Foto de Forma (Opcional)</label>
          <input 
            type="file" 
            id="forma" 
            @change="handleFormaUpload" 
            accept="image/*"
            class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
      </div>

      <div v-if="submissionError" class="p-3 bg-red-100 text-red-700 border border-red-400 rounded-md">
        {{ submissionError }}
      </div>
      
      <button 
        type="submit" 
        :disabled="isSubmitting"
        class="w-full px-4 py-3 bg-btn-principal text-btn-font-principal rounded-md font-bold hover:opacity-80 disabled:opacity-50 transition duration-150"
      >
        {{ isSubmitting ? 'Salvando...' : 'Salvar Registro' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '~/stores/auth'; 

const emit = defineEmits(['recordSaved']);

const authStore = useAuthStore();
const isSubmitting = ref(false);
const submissionError = ref(null);

const today = new Date().toISOString().split('T')[0];

const formData = reactive({
  record_date: today,
  weight: null,
  waist: null, 
  // NOVOS CAMPOS PARA CORRESPONDER AO BACKEND
  event: '',
  weeklyAction: '',
  workoutDays: null,
  observations: '',
});

const photoFile = ref(null);
const formaFile = ref(null);

const handlePhotoUpload = (event) => {
  photoFile.value = event.target.files ? event.target.files[0] : null;
};

const handleFormaUpload = (event) => {
  formaFile.value = event.target.files ? event.target.files[0] : null;
};

const submitRecord = async () => {
  submissionError.value = null;
  isSubmitting.value = true;
  
  if (!authStore.user?.id) {
    submissionError.value = 'Erro: Usuário não logado.';
    isSubmitting.value = false;
    return;
  }

  // 1. Cria o objeto FormData para enviar texto e arquivos
  const data = new FormData();
  // CRÍTICO: Usa 'user_id' e 'record_date' para corresponder aos ajustes no Backend
  data.append('user_id', authStore.user.id);
  data.append('record_date', formData.record_date);
  data.append('weight', formData.weight);
  
  // Adiciona NOVOS CAMPOS
  data.append('event', formData.event || '');
  data.append('weeklyAction', formData.weeklyAction || '');
  data.append('workoutDays', formData.workoutDays || '');
  data.append('observations', formData.observations || '');

  // 2. Lida com Medidas Adicionais (Cintura)
  const measurements = [];
  if (formData.waist) {
    // ID 2 é um PLACEHOLDER para 'Cintura'. A API de records usará isso.
    // É essencial que a tabela 'measurements' no seu NeonDB tenha um registro com ID=2 para 'Cintura'.
    measurements.push({ measurement_id: 2, value: formData.waist }); 
  }
  data.append('measurements', JSON.stringify(measurements)); 
  
  // 3. Adiciona Fotos
  if (photoFile.value) {
    data.append('photo', photoFile.value);
  }
  if (formaFile.value) {
    data.append('forma', formaFile.value);
  }

  // 4. Envia para a API (Endpoint /api/records)
  try {
    const response = await fetch('/api/records', {
      method: 'POST',
      body: data,
    });
    
    if (response.ok) {
      // Limpa os dados (exceto a data) e emite o evento
      formData.weight = null;
      formData.waist = null;
      formData.event = '';
      formData.weeklyAction = '';
      formData.workoutDays = null;
      formData.observations = '';
      
      photoFile.value = null;
      formaFile.value = null;
      // Reinicializa o input de arquivos
      document.getElementById('photo').value = null;
      document.getElementById('forma').value = null;
      
      emit('recordSaved');
    } else {
      const errorData = await response.json();
      submissionError.value = `Falha ao salvar: ${errorData.message || 'Erro desconhecido.'}`;
    }
  } catch (error) {
    submissionError.value = 'Erro ao conectar com o servidor de API.';
    console.error('Erro de submissão:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>