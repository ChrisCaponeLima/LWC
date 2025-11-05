// /components/Patient/PatientFinancialReport.vue
<template>
  <div class="bg-white p-6 rounded-lg shadow-xl border border-gray-200">
    <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
      <i class="fas fa-file-invoice-dollar mr-3 text-indigo-600"></i>
      Relatório Financeiro do Tratamento
    </h3>

    <div class="space-y-4 border-b pb-4 mb-4">
      <h4 class="text-xl font-semibold text-gray-700">Serviços Contratados</h4>
      
      <div 
        v-for="item in treatments" 
        :key="item.id" 
        class="flex justify-between items-center py-2 border-b last:border-b-0"
      >
        <div class="flex items-center">
          <span class="text-gray-900 font-medium">
            {{ item.name }}
          </span>
          
          <i 
            v-if="item.isCortesia" 
            class="fas fa-gift ml-2 text-green-500" 
            title="Tratamento Cortesia (Custo zerado para o cliente)"
          ></i>
          </div>
        <div class="text-right">
          <span 
            :class="[
              'font-semibold',
              item.isCortesia ? 'text-gray-500 line-through' : 'text-gray-800'
            ]"
          >
            {{ formatCurrency(item.custoReal) }}
          </span>
        </div>
      </div>

      <p v-if="treatments.length === 0" class="text-gray-500 italic">
        Nenhum tratamento associado a este relatório.
      </p>
    </div>

    <div v-if="totalDiscount > 0" class="space-y-2 border-b pb-4 mb-4">
      <h4 class="text-xl font-semibold text-gray-700">Descontos e Cortesias</h4>
      
      <div 
        v-for="cortesia in cortesias" 
        :key="cortesia.id" 
        class="flex justify-between items-center py-1 text-green-600"
      >
        <span class="font-medium">
          Cortesia: {{ cortesia.name }}
        </span>
        <span class="font-bold">
          - {{ formatCurrency(cortesia.custoReal) }}
        </span>
      </div>
    </div>

    <div class="space-y-3">
      <div class="flex justify-between items-center text-lg">
        <span class="text-gray-700 font-medium">Subtotal (Valor Real)</span>
        <span class="text-gray-800 font-semibold">{{ formatCurrency(totalRealCost) }}</span>
      </div>
      
      <div class="flex justify-between items-center text-lg">
        <span class="text-green-600 font-medium">Total de Descontos</span>
        <span class="text-green-600 font-semibold">- {{ formatCurrency(totalDiscount) }}</span>
      </div>

      <div class="flex justify-between items-center pt-3 border-t-2 border-indigo-200">
        <span class="text-xl text-indigo-700 font-bold">TOTAL DEVIDO PELO CLIENTE</span>
        <span class="text-2xl text-indigo-700 font-extrabold">{{ formatCurrency(totalDue) }}</span>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Definição das props (O array de tratamentos)
const props = defineProps({
  treatments: {
    type: Array,
    required: true,
    default: () => [],
  },
});

// ---------------------------------------------------------------------
// FUNÇÕES DE CÁLCULO FINANCEIRO
// ---------------------------------------------------------------------

// Total do custo real de todos os tratamentos
const totalRealCost = computed(() => {
  return props.treatments.reduce((sum, item) => sum + (item.custoReal || 0), 0);
});

// Lista de cortesias
const cortesias = computed(() => {
  return props.treatments.filter(item => item.isCortesia);
});

// Total de desconto (igual à soma do custo real das cortesias)
const totalDiscount = computed(() => {
  return cortesias.value.reduce((sum, item) => sum + (item.custoReal || 0), 0);
});

// TOTAL DEVIDO:
// A lógica é:
// 1. Soma o custo real de todos os itens (totalRealCost)
// 2. Subtrai o custo real dos itens que são cortesia (totalDiscount)
const totalDue = computed(() => {
  return totalRealCost.value - totalDiscount.value;
});


// ---------------------------------------------------------------------
// FUNÇÃO DE FORMATAÇÃO
// ---------------------------------------------------------------------

/**
 * Formata um número para o formato de moeda BRL.
 * @param {number} value - O valor a ser formatado.
 * @returns {string} O valor formatado como moeda.
 */
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  // Garante que o valor é um número para toLocaleString funcionar
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) return 'R$ 0,00';
  
  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

</script>

<style scoped>
/* Estilos específicos se necessário */
</style>