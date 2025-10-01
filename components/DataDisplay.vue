// components/DataDisplay.vue - V1.1 - Adiciona lógica para renderizar fotos de evolução e forma
<template>
  <div>
    <div class="mt-8 space-y-4">
      <button @click="toggleGallery('photo')" class="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition duration-150 flex justify-between items-center">
        Registros (Fotos de Evolução)
        <i :class="{'fas fa-chevron-up': activeGallery === 'photo', 'fas fa-chevron-down': activeGallery !== 'photo'}"></i>
      </button>
      <div v-if="activeGallery === 'photo'" id="photo-grid" class="mt-2 photo-grid-gallery grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <template v-if="photoUrls.length > 0">
          <div v-for="photo in photoUrls" :key="photo.url" class="relative pb-[100%] cursor-pointer group">
            <img :src="photo.url" :alt="`Foto de Evolução (${formatDate(photo.date)})`" class="absolute inset-0 w-full h-full object-cover rounded-md shadow-md group-hover:shadow-lg transition-shadow">
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-md text-center opacity-0 group-hover:opacity-100 transition-opacity">
              {{ formatDate(photo.date) }}
            </div>
          </div>
        </template>
        <p v-else class="text-gray-500 col-span-full text-center py-4">Nenhuma foto de evolução registrada.</p>
      </div>

      <button @click="toggleGallery('forma')" class="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition duration-150 flex justify-between items-center">
        Forma (Fotos de Forma)
        <i :class="{'fas fa-chevron-up': activeGallery === 'forma', 'fas fa-chevron-down': activeGallery !== 'forma'}"></i>
      </button>
      <div v-if="activeGallery === 'forma'" id="forma-grid" class="mt-2 photo-grid-gallery grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <template v-if="formaUrls.length > 0">
          <div v-for="forma in formaUrls" :key="forma.url" class="relative pb-[100%] cursor-pointer group">
            <img :src="forma.url" :alt="`Foto de Forma (${formatDate(forma.date)})`" class="absolute inset-0 w-full h-full object-cover rounded-md shadow-md group-hover:shadow-lg transition-shadow">
             <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-md text-center opacity-0 group-hover:opacity-100 transition-opacity">
              {{ formatDate(forma.date) }}
            </div>
          </div>
        </template>
        <p v-else class="text-gray-500 col-span-full text-center py-4">Nenhuma foto de forma registrada.</p>
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
      
      <div v-for="chart in chartSeriesArray" :key="chart.label" class="bg-white p-6 shadow-xl rounded-lg">
        <LineChart 
          v-if="chart.datasets.length" 
          :chart-data="chart" 
          :chart-title="chart.label"
        />
      </div>

      <p v-if="!chartSeriesArray.length && Object.keys(rawChartData.series).length === 0" class="col-span-full text-center text-gray-500">Nenhum dado de evolução disponível para gráficos.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import LineChart from './LineChart.vue';

// 🚨 NOVO: Definição de Tipos para o Registro (Baseado na estrutura do banco)
interface RecordData {
    record_date: string;
    weight: number;
    photo_url: string | null;
    forma_url: string | null;
    // Adicionar outros campos que o backend retorna para records
}

// 🚨 ATUALIZADO: Inclui a lista de records no objeto de dados
interface ChartSeries {
    labels: string[];
    series: Record<string, (number | null)[]>;
    records: RecordData[]; // Lista completa de registros
}

const props = defineProps({
  rawChartData: {
    type: Object as () => ChartSeries,
    required: true,
    default: () => ({ labels: [], series: {}, records: [] }) // 🚨 Default atualizado
  }
});

const activeGallery = ref<string | null>(null);
const currentFilter = ref('all');

const filters = [
  { key: '3', label: 'Últimos 3 Registros' },
  { key: '6', label: 'Últimos 6 Registros' },
  { key: 'all', label: 'Ver Tudo' }
];

const toggleGallery = (name: string) => {
  activeGallery.value = activeGallery.value === name ? null : name;
};

const filterData = (key: string) => {
  currentFilter.value = key;
};

// --- Lógica de Imagens ---

// 🚨 NOVO: Computa a lista de URLs de fotos de evolução (photo_url)
const photoUrls = computed(() => {
    return (props.rawChartData.records || [])
        .filter(record => record.photo_url)
        .map(record => ({ 
            url: record.photo_url as string, 
            date: record.record_date // Mantém a data para exibição
        }))
        .reverse(); // Opção: Exibe o mais recente primeiro na galeria
});

// 🚨 NOVO: Computa a lista de URLs de fotos de forma (forma_url)
const formaUrls = computed(() => {
    return (props.rawChartData.records || [])
        .filter(record => record.forma_url)
        .map(record => ({ 
            url: record.forma_url as string,
            date: record.record_date 
        }))
        .reverse(); // Opção: Exibe o mais recente primeiro na galeria
});

const formatDate = (dateString: string) => {
    if (!dateString) return 'S/D';
    try {
        // Converte a string de data (ex: YYYY-MM-DD) para o formato local (ex: DD/MM/YYYY)
        return new Date(dateString).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
        return dateString;
    }
};


// --- Lógica de Gráficos (Existente) ---

const colors: Record<string, { border: string, background: string, unit: string }> = {
    'weight': { border: '#070FFC', background: 'rgba(7, 15, 252, 0.1)', unit: 'kg' },
    'cintura': { border: '#F3934F', background: 'rgba(243, 147, 79, 0.1)', unit: 'cm' },
    'braço': { border: '#60A5FA', background: 'rgba(96, 165, 250, 0.1)', unit: 'cm' },
    'perna': { border: '#10B981', background: 'rgba(16, 185, 129, 0.1)', unit: 'cm' },
    'default': { border: '#EC4899', background: 'rgba(236, 72, 153, 0.1)', unit: 'unid.' }
};

// Transforma o objeto 'series' em um array de dados filtrados
const chartSeriesArray = computed(() => {
  const allSeries = props.rawChartData?.series || {};
  const labels = props.rawChartData?.labels || [];
  const seriesArray = [];

  const dataLength = labels.length;
  const filterCount = currentFilter.value === 'all' ? dataLength : parseInt(currentFilter.value);
  
  // Itera sobre cada série de dados (peso, cintura, braço...)
  for (const [name, data] of Object.entries(allSeries)) {
    if (!data || data.length === 0) continue;

    const filteredData = (data as (number | null)[]).slice(-filterCount);
    const labelsFiltered = labels.slice(-filterCount);
    
    const key = name.toLowerCase();
    const color = colors[key] || colors['default'];
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

    seriesArray.push({
      label: `${formattedName} (${color.unit})`,
      labels: labelsFiltered,
      datasets: [{
        label: formattedName,
        data: filteredData,
        borderColor: color.border,
        backgroundColor: color.background,
        tension: 0.3,
        pointStyle: 'circle',
        pointRadius: 5,
        pointHoverRadius: 8,
        spanGaps: true, // Garante que as linhas continuem se houver um 'null' no meio
      }]
    });
  }

  return seriesArray;
});
</script>