<template>
  <div class="form-container bg-white p-6 rounded-lg shadow-xl mt-6">
    <h3 class="text-xl font-bold mb-4 text-gray-800">Adicionar Novo Registro</h3>
    <form @submit.prevent="submitRecord" class="space-y-6">
      
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
        <p class="mt-1 text-xs text-gray-500">Opcional, mas importante para o gráfico de evolução.</p>
      </div>

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
// Presume-se que você tem o useAuthStore para obter o ID do usuário
import { useAuthStore } from '~/stores/auth'; 

// Define o evento para notificar o componente pai (index.vue)
const emit = defineEmits(['recordSaved']);

const authStore = useAuthStore();
const isSubmitting = ref(false);
const submissionError = ref(null);

// Inicializa a data com a data atual
const today = new Date().toISOString().split('T')[0];

const formData = reactive({
  record_date: today,
  weight: null,
  waist: null, 
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
  
  // 1. Cria o objeto FormData para enviar texto e arquivos
  const data = new FormData();
  data.append('user_id', authStore.user.id);
  data.append('record_date', formData.record_date);
  data.append('weight', formData.weight);
  
  // 2. Adiciona Medidas Adicionais
  // Simplificamos enviando a cintura como uma 'measurement' adicional
  const measurements = [];
  if (formData.waist) {
    // Nota: O ID '2' é um PLACHOLDER. Na sua API de records você deve
    // garantir que ele seja o ID correto para 'cintura' na tabela 'measurements'.
    // Se você não tiver uma tabela de 'measurements', a API de records precisa
    // ser ajustada para aceitar 'waist' diretamente. Presumindo a estrutura de 'measurements'
    // com ID:
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
      body: data, // Não precisa de Content-Type: application/json
    });
    
    if (response.ok) {
      // Limpa e emite o evento
      formData.weight = null;
      formData.waist = null;
      photoFile.value = null;
      formaFile.value = null;
      // Reinicializa o input de arquivos
      document.getElementById('photo').value = null;
      document.getElementById('forma').value = null;
      
      emit('recordSaved');
      alert('Registro salvo com sucesso!');
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