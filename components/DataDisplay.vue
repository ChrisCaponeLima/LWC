<template>
  <div>
    <div class="mt-8 space-y-4">
      <button @click="toggleGallery('photo')" class="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition duration-150 flex justify-between items-center">
        Registros (Fotos de Evolução)
        <i :class="{'fas fa-chevron-up': activeGallery === 'photo', 'fas fa-chevron-down': activeGallery !== 'photo'}"></i>
      </button>
      <div v-if="activeGallery === 'photo'" id="photo-grid" class="mt-2 photo-grid-gallery grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div v-for="n in 4" :key="n" class="relative pb-[100%]">
          <img :src="`https://picsum.photos/200/200?random=${n}`" alt="Foto de Evolução" class="absolute inset-0 w-full h-full object-cover rounded-md shadow-md">
        </div>
      </div>

      <button @click="toggleGallery('forma')" class="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition duration-150 flex justify-between items-center">
        Forma (Fotos de Forma)
        <i :class="{'fas fa-chevron-up': activeGallery === 'forma', 'fas fa-chevron-down': activeGallery !== 'forma'}"></i>
      </button>
      <div v-if="activeGallery === 'forma'" id="forma-grid" class="mt-2 photo-grid-gallery grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <p class="text-gray-500">Nenhuma foto de forma registrada.</p>
      </div>
    </div>

    <div class="section-header mt-12">
      <h2 class="text-2xl font-bold text-gray-800">Gráficos de Evolução</h2>
    </div>

    <div class="flex space-x-2 my-4">
      <button v-for="filter in filters" :key="filter.key" 
              @click="filterData(filter.key)" 
              :class="['px-4 py-2 rounded-full text-sm font-semibold transition', 
                      currentFilter === filter.key ? 'bg-btn-secundario text-btn-font-secundario' : 'bg-gray-200 text-gray-700 hover:bg-gray-300']">
        {{ filter.label }}
      </button>
    </div>

    <div class="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
      <LineChart v-if="filteredWeightData.datasets.length" :chart-data="filteredWeightData" />
      <LineChart v-if="filteredWaistData.datasets.length" :chart-data="filteredWaistData" />
      <p v-if="!filteredWeightData.datasets.length" class="col-span-full text-center text-gray-500">Carregando dados de evolução...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import LineChart from './LineChart.vue';

// 1. DEFINE A PROP (A propriedade que recebe os dados do Composable)
const props = defineProps({
  rawChartData: {
    type: Object,
    required: true
  }
});

const activeGallery = ref(null);
const currentFilter = ref('all');

const filters = [
  { key: '3', label: 'Últimos 3 Registros' },
  { key: '6', label: 'Últimos 6 Registros' },
  { key: 'all', label: 'Ver Tudo' }
];

const toggleGallery = (name) => {
  activeGallery.value = activeGallery.value === name ? null : name;
};

const filterData = (key) => {
  currentFilter.value = key;
};

// **INÍCIO DA CORREÇÃO**

// Função auxiliar para retornar um objeto de gráfico vazio
const emptyChartData = () => ({ labels: [], datasets: [] });

// 2. PROPRIEDADE COMPUTADA PARA DADOS DE PESO
const filteredWeightData = computed(() => {
  // CRÍTICO: Verifica se os dados necessários existem antes de prosseguir
  const weights = props.rawChartData?.weights;
  const labels = props.rawChartData?.labels;
  
  if (!weights || !labels || weights.length === 0) {
    return emptyChartData();
  }
  
  const dataLength = weights.length;
  const filterCount = currentFilter.value === 'all' ? dataLength : parseInt(currentFilter.value);
  
  // O slice garante que sempre pegamos os últimos 'filterCount' elementos
  const data = weights.slice(-filterCount);
  const labelsFiltered = labels.slice(-filterCount);

  return {
    labels: labelsFiltered,
    datasets: [{
      label: 'Peso (kg)',
      data: data,
      borderColor: '#070FFC',
      backgroundColor: 'rgba(7, 15, 252, 0.1)',
      tension: 0.3,
      pointStyle: 'circle',
      pointRadius: 5,
      pointHoverRadius: 8
    }]
  };
});

// 3. PROPRIEDADE COMPUTADA PARA DADOS DE CINTURA
const filteredWaistData = computed(() => {
  // CRÍTICO: Verifica se os dados necessários existem antes de prosseguir
  const waists = props.rawChartData?.waists;
  const labels = props.rawChartData?.labels;
  
  if (!waists || !labels || waists.length === 0) {
    return emptyChartData();
  }
  
  const dataLength = waists.length;
  const filterCount = currentFilter.value === 'all' ? dataLength : parseInt(currentFilter.value);

  const data = waists.slice(-filterCount);
  const labelsFiltered = labels.slice(-filterCount);

  return {
    labels: labelsFiltered,
    datasets: [{
      label: 'Cintura (cm)',
      data: data,
      borderColor: '#F3934F',
      backgroundColor: 'rgba(243, 147, 79, 0.1)',
      tension: 0.3,
      pointStyle: 'circle',
      pointRadius: 5,
      pointHoverRadius: 8
    }]
  };
});

// **FIM DA CORREÇÃO**
</script>