<template>
  <div class="form-card mt-4 p-6 bg-white rounded-xl shadow-md">
    <form @submit.prevent="submitForm" class="space-y-4">
      
      <div v-if="statusMessage" :class="['p-3 rounded-md text-center', statusType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
        {{ statusMessage }}
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="date" class="block text-sm font-medium text-gray-700">Data</label>
          <input
            type="date"
            id="date"
            v-model="formData.date"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-200 p-2"
            required
          />
        </div>

        <div>
          <label for="weight" class="block text-sm font-medium text-gray-700">Peso (kg)</label>
          <input
            type="number"
            step="0.01"
            id="weight"
            v-model.number="formData.weight"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-200 p-2"
            required
          />
        </div>
      </div>

      <div class="flex justify-center mt-6">
        <button 
          type="submit" 
          :disabled="isLoading"
          class="px-6 py-2 bg-btn-secundario text-btn-font-secundario rounded-md font-bold hover:opacity-80 disabled:bg-btn-desativado disabled:text-btn-font-desativado"
        >
          {{ isLoading ? 'Salvando...' : 'Salvar Registro' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { apiFetch } from '~/utils/api';

const authStore = useAuthStore();
const emit = defineEmits(['recordSaved']); // Define o evento que será emitido
const isLoading = ref(false);
const statusMessage = ref('');
const statusType = ref('');

const formData = reactive({
  date: new Date().toISOString().substring(0, 10), // Data de hoje como padrão
  weight: null,
  measurements: [],
  event: '',
  weeklyAction: '',
  workoutDays: '',
  observations: '',
  // photo (o upload é um pouco mais complexo e será tratado separadamente, se necessário)
});

const submitForm = async () => {
  isLoading.value = true;
  statusMessage.value = '';
  const userId = authStore.user?.userId;

  if (!userId) {
    statusMessage.value = 'Erro: Usuário não autenticado.';
    statusType.value = 'error';
    isLoading.value = false;
    return;
  }

  // Objeto de dados que será enviado ao backend
  const payload = {
    user_id: userId,
    date: formData.date,
    weight: formData.weight,
    // Em um backend real, as medidas seriam estruturadas ou normalizadas
    measurements: formData.measurements, 
    // ... outros campos
  };
  
  try {
    // 1. Chamada de API para SALVAR (POST)
    // Assumimos que o endpoint para criar um novo registro é '/records'
    await apiFetch('/records', { 
      method: 'POST',
      body: payload
    });

    statusMessage.value = 'Registro salvo com sucesso! Atualizando KPIs...';
    statusType.value = 'success';
    
    // 2. Ação CRÍTICA: Emite um evento para o componente-pai
    // O Nuxt/Vue usa `emit` para comunicação de filho para pai.
    emit('recordSaved');
    
    // Opcional: Limpar o formulário após salvar
    // Object.assign(formData, { weight: null, event: '', measurements: [] });

  } catch (e) {
    statusMessage.value = `Falha ao salvar. Erro: ${e.message}`;
    statusType.value = 'error';
  } finally {
    isLoading.value = false;
  }
};

// ... (Restante do script, como addMeasurement, permanece igual)
</script>

<style scoped>
/* Estilos permanecem iguais */
</style>