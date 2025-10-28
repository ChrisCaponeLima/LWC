// /components/Treatments/EndTreatmentModal.vue - V1.1 - CORREÇÕES DE API E FORMATO DE DATA
<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300" @click="closeModal">
    <div 
      class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-100"
      @click.stop
    >
      <h3 class="text-2xl font-bold mb-4 text-red-700 border-b pb-2 flex items-center">
        <i class="fas fa-times-circle mr-3"></i> Encerrar Tratamento
      </h3>
      
      <p v-if="treatmentToEnd" class="mb-4 text-gray-700">
        Você está prestes a finalizar o tratamento: 
        <strong class="font-semibold">{{ treatmentToEnd.name }}</strong>, iniciado em **{{ formatDate(treatmentToEnd.startDate) }}**.
      </p>

      <div class="mb-4">
        <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">Data de Encerramento *</label>
        <input 
          type="date" 
          id="endDate" 
          v-model="endDate" 
          :max="today"
          :min="treatmentToEnd?.startDate"
          :disabled="isSubmitting"
          class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-red-500 focus:border-red-500 transition"
        />
        <p v-if="dateError" class="text-xs text-red-500 mt-1">{{ dateError }}</p>
      </div>

      <p v-if="errorMessage" class="text-red-600 text-sm mt-3 p-2 border border-red-200 rounded-md bg-red-50">
        <i class="fas fa-exclamation-triangle mr-2"></i> {{ errorMessage }}
      </p>

      <div class="flex justify-end space-x-3 mt-6">
        <button 
          @click="closeModal" 
          :disabled="isSubmitting"
          class="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          Cancelar
        </button>
        <button 
          @click="submitEndTreatment" 
          :disabled="!isValid || isSubmitting"
          class="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition shadow-md disabled:bg-red-300 disabled:cursor-not-allowed"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin mr-2"></i>
          Encerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
// useRuntimeConfig não é necessário se não usarmos o baseURL
// import { useRuntimeConfig } from '#app'; 

// Interface que reflete o dado que TreatmentAssociationManager.vue envia
interface ActiveTreatment {
  id: number; // ID do user_treatment (necessário para o endpoint de encerramento)
  treatmentId: number; 
  name: string;
  startDate: string;
}

const props = defineProps<{
  isOpen: boolean;
  treatmentToEnd: ActiveTreatment | null;
  userId: number; // Precisamos do userId do paciente
}>();

const emit = defineEmits(['close', 'treatmentEnded']);

const authStore = useAuthStore();
// const config = useRuntimeConfig(); // Removido por não ser mais necessário

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const endDate = ref<string>(''); // YYYY-MM-DD
const dateError = ref<string | null>(null);

// Data de hoje no formato YYYY-MM-DD
const today = computed(() => new Date().toISOString().split('T')[0]);

/**
* Lógica de validação do formulário.
* NOTA: `new Date(dateString)` para YYYY-MM-DD no JS pode causar bugs de fuso horário, mas
* aqui, como estamos apenas comparando strings YYYY-MM-DD (min/max) e convertendo para Date
* para comparação, o efeito de fuso horário se cancela, sendo aceitável.
*/
const isValid = computed(() => {
  dateError.value = null;
  if (!endDate.value) {
    return false;
  }

  // Criamos as datas no mesmo fuso horário (UTC, ao usar YYYY-MM-DD) para comparação
  const end = new Date(endDate.value);
  const start = props.treatmentToEnd ? new Date(props.treatmentToEnd.startDate) : null;

  if (start && end < start) {
    dateError.value = 'A data de encerramento não pode ser anterior à data de início.';
    return false;
  }

  return true;
});

/**
* Limpa o estado quando o modal é fechado/aberto.
*/
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    // Define a data de encerramento como hoje por padrão
    endDate.value = today.value; 
    errorMessage.value = null;
    dateError.value = null;
  }
});


const closeModal = () => {
  emit('close');
};

const submitEndTreatment = async () => {
  if (!isValid.value || !props.treatmentToEnd) return;

  isSubmitting.value = true;
  errorMessage.value = null;
  const token = authStore.token;

  try {
    // CORREÇÃO: Removido o baseURL para chamada interna
    await $fetch(`/api/professional/user/${props.userId}/treatments/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        user_treatment_id: props.treatmentToEnd.id, 
        end_date: endDate.value
      }
    });

    // Sucesso
    emit('treatmentEnded');
    
  } catch (e: any) {
    console.error('Erro ao encerrar tratamento:', e);
    errorMessage.value = e?.data?.statusMessage || e?.message || 'Falha ao encerrar tratamento. Tente novamente.';
  } finally {
    isSubmitting.value = false;
  }
};

// CORREÇÃO: Usando o método seguro de formatação de data (como no componente manager)
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
        const parts = dateString.split('-');
        if (parts.length === 3) {
            // Cria uma data local (Ano, Mês-1, Dia) para exibição correta
            const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            return d.toLocaleDateString('pt-BR');
        }
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}
</script>