// /components/Treatments/TreatmentAssociationManager.vue - V2.8 - CORREÇÃO CRÍTICA DE PROP: Define 'availableAreas' como não obrigatória ('required: false') com um 'default' para resolver o erro de renderização do Vue ('Missing required prop').

<template>
<div class="bg-white shadow-lg rounded-xl p-6 mb-8">
<h3 class="text-xl font-extrabold text-gray-800 mb-4 flex items-center">
<i class="fas fa-heartbeat text-red-500 mr-3"></i>
Tratamentos do Paciente </h3>

<div v-if="activeTreatments && activeTreatments.length > 0" class="space-y-4">
<div
v-for="treatment in activeTreatments"
:key="treatment.id"
class="flex justify-between items-center p-4 rounded-lg"
:class="{
'border border-green-200 bg-green-50': treatment.isActive,
'border border-gray-300 bg-gray-100': !treatment.isActive
}"
>
<div>
<p 
class="font-semibold text-lg"
:class="treatment.isActive ? 'text-green-700' : 'text-gray-700'"
>
{{ treatment.name }} <span class="text-sm font-normal">({{ treatment.size }})</span>
</p>
<p class="text-sm text-gray-500 mt-1">
Início: **{{ formatDate(treatment.startDate) }}**
<span v-if="!treatment.isActive && treatment.endDate">
| Encerramento: **{{ formatDate(treatment.endDate) }}**
</span>
</p>
<p class="text-sm mt-1 flex items-center space-x-2">
<strong class="font-bold" :class="treatment.isCourtesy ? 'text-red-500' : 'text-gray-700'">
Custo: {{ treatment.isCourtesy ? 'Cortesia' : `R$ ${formatPrice(treatment.realCost)}` }}
</strong>
 <i v-if="treatment.isCourtesy" class="fas fa-gift text-red-500 text-base" title="Cortesia"></i>
</p>
</div>
<button
v-if="treatment.isActive"
@click="openEndModal(treatment)"
:disabled="isProcessing"
class="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded-full hover:bg-red-600 transition disabled:opacity-50"
>
<i class="fas fa-times-circle mr-1"></i>
Encerrar
</button>
<span v-else class="text-xs font-semibold text-gray-500 p-1 px-3 border border-gray-400 rounded-full">
Encerrado
</span>
</div>
</div>
<div v-else class="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
<i class="fas fa-band-aid text-4xl text-gray-400 mb-3"></i>
<p class="text-gray-600 font-medium">Nenhum tratamento encontrado.</p>
</div>

<div class="mt-6 pt-6 border-t border-gray-200">
<h4 class="text-lg font-bold text-gray-700 mb-3">Associar Novo Tratamento</h4>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">

<select
v-model="selectedTreatmentId"
:disabled="isProcessing"
@change="handleTreatmentChange"
class="border border-gray-300 p-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
>
<option :value="null" disabled>Selecione o Tratamento</option>
<option
v-for="available in treatmentsToDisplay"
:key="available.id"
:value="available.id"
>
{{ available.name }}
</option>
</select>

<select
v-model="selectedSize"
:disabled="isProcessing || !selectedTreatmentId"
class="border border-gray-300 p-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
>
<option :value="null" disabled>Selecione o Tamanho</option>
<option
v-for="(price, size) in availableSizes"
:key="size"
:value="size"
>
{{ size }} (R$ {{ formatPrice(price) }})
</option>
</select>

<select
v-model="selectedAreaId"
:disabled="isProcessing"
class="border border-gray-300 p-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
>
<option :value="0">Selecione a Área (Opcional)</option>
<option
v-for="area in props.availableAreas || []"
:key="area.id"
:value="area.id"
>
{{ area.name }}
</option>
</select>

<div 
@click="isCourtesy = !isCourtesy" 
:class="[
'flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors duration-200',
'border border-gray-300 hover:border-gray-400', // Manter a borda do select
isCourtesy ? 'bg-green-50' : 'bg-white', // Fundo sutil para o estado ativo
{ 'opacity-50 cursor-not-allowed': isProcessing }
]"
:title="isCourtesy ? 'Cortesia Ativa (Clique para desativar)' : 'Marcar como Cortesia'"
>
<i 
:class="['fas fa-gift', isCourtesy ? 'text-green-600' : 'text-gray-400', 'text-lg']"
></i>
</div>
</div>
<div class="flex justify-between items-center mt-4"> 
<button
@click="associateTreatment"
:disabled="!selectedTreatmentId || !selectedSize || isProcessing"
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
:user-id="props.userId"
@close="isEndModalOpen = false"
@treatment-ended="handleTreatmentEnded"
/>
</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'; 
import { useAuthStore } from '~/stores/auth';
import EndTreatmentModal from '~/components/Treatments/EndTreatmentModal.vue'; 
import { PropType } from 'vue'; 

// /components/Treatments/TreatmentAssociationManager.vue - V2.8 - CORREÇÃO CRÍTICA DE PROP

interface TreatmentArea {
id: number;
name: string; 
}

interface ActiveTreatment {
id: number; 
treatmentId: number; 
name: string;
startDate: string; 
isActive: boolean; 
endDate?: string; 
size: string; 
isCourtesy: boolean; 
realCost: string | null; 
}

interface AvailableTreatment {
id: number;
name: string;
precoP: string | null;
precoM: string | null;
precoG: string | null;
precoGG: string | null;
}

const props = defineProps({
  userId: { type: Number, required: true }, 
  activeTreatments: { type: Array as PropType<ActiveTreatment[]>, required: true }, 
  availableTreatments: { type: Array as PropType<AvailableTreatment[]>, required: true }, 
  // 🛑 CORREÇÃO CRÍTICA: Mudar para required: false e adicionar default para prevenir erro do Vue com dados assíncronos.
  availableAreas: { 
        type: Array as PropType<TreatmentArea[]>, 
        required: false, // Alterado de true para false
        default: () => [] // Adicionado um valor default
    }, 
});

const emit = defineEmits(['refreshData']);

const authStore = useAuthStore();

const selectedTreatmentId = ref<number | null>(null);
const selectedSize = ref<string | null>(null); 
const selectedAreaId = ref<number>(0); 
const isCourtesy = ref<boolean>(false);
const isProcessing = ref(false);
const statusMessage = ref<{ message: string, type: 'success' | 'error' } | null>(null);

const isEndModalOpen = ref(false);
const treatmentToClose = ref<ActiveTreatment | null>(null); 

// ---------------------------------------------------------------------
// LÓGICA DE PRECIFICAÇÃO E ASSOCIAÇÃO
// ---------------------------------------------------------------------

const treatmentsToDisplay = computed(() => {
return props.availableTreatments;
});

const availableSizes = computed(() => {
const selected = props.availableTreatments.find(t => t.id === selectedTreatmentId.value);
if (!selected) return {};

const sizes: { [key: string]: string | null } = {};
if (selected.precoP && parseFloat(selected.precoP) >= 0) sizes['P'] = selected.precoP;
if (selected.precoM && parseFloat(selected.precoM) >= 0) sizes['M'] = selected.precoM;
if (selected.precoG && parseFloat(selected.precoG) >= 0) sizes['G'] = selected.precoG;
if (selected.precoGG && parseFloat(selected.precoGG) >= 0) sizes['GG'] = selected.precoGG;

return sizes;
});

const selectedCost = computed(() => {
if (!selectedSize.value || !selectedTreatmentId.value) return '0.00';
return availableSizes.value[selectedSize.value] || '0.00';
});

const handleTreatmentChange = () => {
selectedSize.value = null;
isCourtesy.value = false;
}

const associateTreatment = async () => {
if (!selectedTreatmentId.value || !selectedSize.value) return;

isProcessing.value = true;
statusMessage.value = null;
const token = authStore.token;

try {
await $fetch(`/api/professional/user/${props.userId}/treatments/associate`, {
method: 'POST',
headers: { Authorization: `Bearer ${token}` },
body: {
// DADOS ENVIADOS: Agora inclui tratamentoId, treatment_size, isCortesia E treatment_area_id.
treatmentId: selectedTreatmentId.value, 
treatment_size: selectedSize.value,
isCortesia: isCourtesy.value,
treatment_area_id: selectedAreaId.value > 0 ? selectedAreaId.value : null, // Envia 0 ou null se não selecionado
}
});

statusMessage.value = { message: 'Tratamento associado com sucesso! Recarregando dados...', type: 'success' };
selectedTreatmentId.value = null; 
selectedSize.value = null; 
selectedAreaId.value = 0; 
isCourtesy.value = false; 

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
const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00.000Z');
return date.toLocaleDateString('pt-BR');
} catch {
return dateString;
}
}

const formatPrice = (price: string | number | null) => {
if (price === null || price === undefined) return '0,00';
return parseFloat(price.toString()).toFixed(2).replace('.', ',');
};


// 🚨 ADIÇÃO CRÍTICA DE LOGS DE DEBBUG
// O `watch` garante que capturamos a lista de áreas assim que ela for recebida pelo componente pai
watch(() => props.availableAreas, (newVal) => {
console.log('[TREATMENT ASSOCIATION MANAGER] Prop availableAreas ATUALIZADA:', newVal);
console.log('[TREATMENT ASSOCIATION MANAGER] Tamanho do Array de Áreas:', newVal ? newVal.length : 0);
}, { immediate: true });

onMounted(() => {
console.log('[TREATMENT ASSOCIATION MANAGER] Estado inicial da Prop availableAreas no Mount:', props.availableAreas);
console.log('[TREATMENT ASSOCIATION MANAGER] Tamanho do Array de Áreas no Mount:', props.availableAreas ? props.availableAreas.length : 0);
})
</script>