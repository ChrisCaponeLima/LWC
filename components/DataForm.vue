// /components/DataForm.vue - V2.5 - Correção ID Cintura (2 -> 4) e Inclusão de Privacy Flag
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
          <label for="event" class="block text-sm font-medium text-gray-700">Evento</label>
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
          <label for="weeklyAction" class="block text-sm font-medium text-gray-700">Ação Semanal</label>
          <input 
            type="text" 
            id="weeklyAction" 
            v-model="formData.weeklyAction" 
            placeholder="Ex: Dieta cutting, Fase de manutenção"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        </div>
        
        <div>
          <label for="workoutDays" class="block text-sm font-medium text-gray-700">Dias de Treino</label>
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
        <label for="observations" class="block text-sm font-medium text-gray-700">Observações</label>
        <textarea 
          id="observations" 
          v-model="formData.observations" 
          rows="3"
          placeholder="Comentários sobre a semana, sentimentos, desafios..."
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
        ></textarea>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col">
          <label for="photo" class="block text-sm font-medium text-gray-700">Foto de Evolução (Opcional)</label>
          <input 
            type="file" 
            id="photo" 
            @change="handlePhotoUpload" 
            accept="image/*"
            class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <div v-if="photoFile" class="mt-2 flex items-center">
            <input type="checkbox" id="photo_private" v-model="formData.photo_is_private" class="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4">
            <label for="photo_private" class="ml-2 text-sm text-gray-700">Tornar Foto de Evolução privada (🔒)</label>
          </div>
        </div>
        
        <div class="flex flex-col">
          <label for="forma" class="block text-sm font-medium text-gray-700">Foto de Forma (Opcional)</label>
          <input 
            type="file" 
            id="forma" 
            @change="handleFormaUpload" 
            accept="image/*"
            class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <div v-if="formaFile" class="mt-2 flex items-center">
            <input type="checkbox" id="forma_private" v-model="formData.forma_is_private" class="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4">
            <label for="forma_private" class="ml-2 text-sm text-gray-700">Tornar Foto de Forma privada (🔒)</label>
          </div>
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
// /components/DataForm.vue - V2.5 - Correção ID Cintura (2 -> 4) e Inclusão de Privacy Flag
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
  event: '',
  weeklyAction: '', 
  workoutDays: null,
  observations: '',
  // NOVOS CAMPOS DE PRIVACIDADE
  photo_is_private: false,
  forma_is_private: false,
});

const photoFile = ref(null);
const formaFile = ref(null);

const handlePhotoUpload = (event) => {
  photoFile.value = event.target.files ? event.target.files[0] : null;
  // Reseta o flag de privacidade se o arquivo for removido/trocado
  if (!photoFile.value) formData.photo_is_private = false;
};

const handleFormaUpload = (event) => {
  formaFile.value = event.target.files ? event.target.files[0] : null;
  // Reseta o flag de privacidade se o arquivo for removido/trocado
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

  // 🚨 CORREÇÃO CRÍTICA: ID 4 é Cintura (conforme measurements.csv)
  const measurements = [];
  if (formData.waist) {
    measurements.push({ measurement_id: 4, value: formData.waist }); 
  }
  data.append('measurements', JSON.stringify(measurements)); 
  
  // Envia os arquivos e os flags de privacidade (como string 'true'/'false')
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
      // limpa dados
      formData.weight = null;
      formData.waist = null;
      formData.event = '';
      formData.weeklyAction = '';
      formData.workoutDays = null;
      formData.observations = '';
      formData.photo_is_private = false; // Limpa flags
      formData.forma_is_private = false;
      
      photoFile.value = null;
      formaFile.value = null;
      // Limpa inputs de arquivo nativos
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