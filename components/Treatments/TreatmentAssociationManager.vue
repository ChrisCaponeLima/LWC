// /components/Treatments/TreatmentAssociationManager.vue - V1.5 - Ajuste de Layout (flex) para prevenir overflow.
<template>
 <div class="bg-white shadow-lg rounded-xl p-6 mb-8">
  <h3 class="text-xl font-extrabold text-gray-800 mb-4 flex items-center">
   <i class="fas fa-heartbeat text-red-500 mr-3"></i>
   Tratamentos Ativos do Paciente
  </h3>

  <div v-if="activeTreatments && activeTreatments.length > 0" class="space-y-4">
   <div
    v-for="treatment in activeTreatments"
    :key="treatment.id"
    class="flex justify-between items-center p-4 border border-green-200 rounded-lg bg-green-50"
   >
    <div>
     <p class="font-semibold text-green-700 text-lg">{{ treatment.name }}</p>
     <p class="text-sm text-gray-500 mt-1">
      Início: **{{ formatDate(treatment.startDate) }}**
     </p>
    </div>
    <button
     @click="openEndModal(treatment)"
     :disabled="isProcessing"
     class="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded-full hover:bg-red-600 transition disabled:opacity-50"
    >
     <i class="fas fa-times-circle mr-1"></i>
     Encerrar
    </button>
   </div>
  </div>
  <div v-else class="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
   <i class="fas fa-band-aid text-4xl text-gray-400 mb-3"></i>
   <p class="text-gray-600 font-medium">Nenhum tratamento ativo no momento.</p>
  </div>

  <div class="mt-6 pt-6 border-t border-gray-200">
   <h4 class="text-lg font-bold text-gray-700 mb-3">Associar Novo Tratamento</h4>

         <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full min-w-0">
    <select
     v-model="selectedTreatmentId"
     :disabled="isProcessing"
     class="flex-1 border border-gray-300 p-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
    >
     <option :value="null" disabled>Selecione um tratamento disponível</option>
     <option
      v-for="available in treatmentsToDisplay"
      :key="available.id"
      :value="available.id"
     >
      {{ available.name }}
     </option>
    </select>
        
        <select
     v-model="selectedAreaId"
     :disabled="isProcessing"
     class="flex-1 border border-gray-300 p-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
    >
     <option :value="0">Selecione a Área (Opcional)</option>
     <option
      v-for="area in props.availableAreas"
      :key="area.id"
      :value="area.id"
     >
      {{ area.name }}
     </option>
    </select>

    <button
     @click="associateTreatment"
     :disabled="!selectedTreatmentId || isProcessing"
               class="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-md disabled:bg-indigo-300 disabled:cursor-not-allowed flex-none w-auto"
    >
     <i v-if="isProcessing" class="fas fa-spinner fa-spin mr-2"></i>
     <i v-else class="fas fa-plus-circle mr-2"></i>
     Associar
    </button>
   </div>
   
   <p v-if="statusMessage" :class="statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'" class="mt-3 text-sm">
    {{ statusMessage.message }}
   </p>
  </div>

  <EndTreatmentModal
   :is-open="isEndModalOpen"
   :treatment-to-end="treatmentToClose"
   @close="isEndModalOpen = false"
   @treatment-ended="handleTreatmentEnded"
  />
 </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRuntimeConfig } from '#app';
import EndTreatmentModal from '~/components/Treatments/EndTreatmentModal.vue'; 

interface TreatmentArea {
 id: number;
 name: string;
}

interface ActiveTreatment {
 id: number; // ID do registro de user_treatment
 treatmentId: number; 
 name: string;
 startDate: string; 
 isActive: boolean;
}

interface AvailableTreatment {
 id: number;
 name: string;
}

const props = defineProps<{
 userId: number;
 activeTreatments: ActiveTreatment[]; 
 availableTreatments: AvailableTreatment[]; 
  availableAreas: TreatmentArea[]; 
}>();

const emit = defineEmits(['refreshData']);

const authStore = useAuthStore();
const config = useRuntimeConfig();

const selectedTreatmentId = ref<number | null>(null);
const selectedAreaId = ref<number>(0); 
const isProcessing = ref(false);
const statusMessage = ref<{ message: string, type: 'success' | 'error' } | null>(null);

const isEndModalOpen = ref(false);
const treatmentToClose = ref<ActiveTreatment | null>(null); 

// ---------------------------------------------------------------------
// LÓGICA DE ASSOCIAÇÃO
// ---------------------------------------------------------------------

const treatmentsToDisplay = computed(() => {
 const activeIds = props.activeTreatments.map(t => t.treatmentId); 
 return props.availableTreatments.filter(t => !activeIds.includes(t.id));
});

const associateTreatment = async () => {
 if (!selectedTreatmentId.value) return;

 isProcessing.value = true;
 statusMessage.value = null;
 const token = authStore.token;

 try {
  await $fetch(`/api/professional/user/${props.userId}/treatments/associate`, {
   method: 'POST',
   headers: { Authorization: `Bearer ${token}` },
   body: {
    treatment_id: selectedTreatmentId.value,
    start_date: new Date().toISOString().split('T')[0],
        treatment_area_id: selectedAreaId.value 
   }
  });

  statusMessage.value = { message: 'Tratamento associado com sucesso! Recarregando dados...', type: 'success' };
  selectedTreatmentId.value = null; 
    selectedAreaId.value = 0; 
  
  setTimeout(() => {
   emit('refreshData'); 
  }, 100); 
  
 } catch (e: any) {
  console.error('Erro ao associar tratamento:', e);
  statusMessage.value = { 
   message: e?.data?.statusMessage || e?.message || 'Falha ao associar tratamento. Verifique o console.', 
   type: 'error' 
  };
 } finally {
  isProcessing.value = false;
  setTimeout(() => statusMessage.value = null, 5000); 
 }
};

// ---------------------------------------------------------------------
// LÓGICA DE ENCERRAMENTO (Modal)
// ---------------------------------------------------------------------

const openEndModal = (treatment: ActiveTreatment) => {
 treatmentToClose.value = treatment;
 isEndModalOpen.value = true;
};

const handleTreatmentEnded = () => {
 isEndModalOpen.value = false;
 emit('refreshData'); 
};

// ---------------------------------------------------------------------
// FUNÇÕES AUXILIARES
// ---------------------------------------------------------------------

const formatDate = (dateString: string) => {
 if (!dateString) return 'N/A';
 try {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
 } catch {
  return dateString;
 }
}
</script>