<!-- /components/DataDisplay.vue - V1.7 - Usa booleans para privacidade; adiciona cadeado SVG visível -->
<template>
  <div>
    <div class="mt-8 space-y-4">
      <button 
        @click="toggleGallery('photo')" 
        :class="[
          'w-full px-4 py-3 text-gray-800 rounded-lg font-bold transition duration-150 flex justify-between items-center',
          props.hasRegistroPhotos ? 'btn-with-photos' : 'btn-no-photos'
        ]"
      >
        Registros (Fotos de Evolução)
        <i :class="{'fas fa-chevron-up': activeGallery === 'photo', 'fas fa-chevron-down': activeGallery !== 'photo'}"></i>
      </button>

      <div v-if="activeGallery === 'photo'" id="photo-grid" class="mt-2 photo-grid-gallery grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <template v-if="photoUrls.length > 0">
          <NuxtLink 
            v-for="photo in photoUrls" 
            :key="photo.url + '-' + photo.recordId" 
            :to="`/editor/${photo.recordId}?type=${photo.type}`" 
            class="relative pb-[100%] cursor-pointer group block"
          >
            <img 
              :src="photo.url" 
              :alt="`Foto de Evolução (${formatDate(photo.date)})`" 
              class="absolute inset-0 w-full h-full object-cover rounded-md shadow-md group-hover:opacity-75 transition-opacity"
            >
            
            <!-- Cadeado (inline SVG) - aparece apenas se isPrivate for true -->
            <div v-if="photo.isPrivate" class="absolute top-2 right-2 p-1 bg-black/80 rounded-full text-white text-sm z-50 flex items-center justify-center" aria-hidden="true">
              <!-- SVG cadeado pequeno para evitar depender de fontes externas -->
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>

            <!-- Tarja com data (mantida) -->
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-md text-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
              {{ formatDate(photo.date) }}<span v-if="photo.isPrivate"> &nbsp;🔒</span>
            </div>
          </NuxtLink>
        </template>
        <p v-else class="text-gray-500 col-span-full text-center py-4">Nenhuma foto de evolução registrada.</p>
      </div>

      <button 
        @click="toggleGallery('forma')" 
        :class="[
          'w-full px-4 py-3 text-gray-800 rounded-lg font-bold transition duration-150 flex justify-between items-center',
          props.hasFormaPhotos ? 'btn-with-photos' : 'btn-no-photos'
        ]"
      >
        Forma (Fotos de Forma)
        <i :class="{'fas fa-chevron-up': activeGallery === 'forma', 'fas fa-chevron-down': activeGallery !== 'forma'}"></i>
      </button>

      <div v-if="activeGallery === 'forma'" id="forma-grid" class="mt-2 photo-grid-gallery grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <template v-if="formaUrls.length > 0">
          <NuxtLink 
            v-for="forma in formaUrls" 
            :key="forma.url + '-' + forma.recordId" 
            :to="`/editor/${forma.recordId}?type=${forma.type}`" 
            class="relative pb-[100%] cursor-pointer group block"
          >
            <img 
              :src="forma.url" 
              :alt="`Foto de Forma (${formatDate(forma.date)})`" 
              class="absolute inset-0 w-full h-full object-cover rounded-md shadow-md group-hover:opacity-75 transition-opacity"
            >
            
            <div v-if="forma.isPrivate" class="absolute top-2 right-2 p-1 bg-black/80 rounded-full text-white text-sm z-50 flex items-center justify-center" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>

            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-md text-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
              {{ formatDate(forma.date) }}<span v-if="forma.isPrivate"> &nbsp;🔒</span>
            </div>
          </NuxtLink>
        </template>
        <p v-else class="text-gray-500 col-span-full text-center py-4">Nenhuma foto de forma registrada.</p>
      </div>
    </div>

    <!-- seção de gráficos mantida abaixo -->
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
        <LineChart v-if="chart.datasets.length" :chart-data="chart" :chart-title="chart.label" />
      </div>

      <p v-if="!chartSeriesArray.length && Object.keys(rawChartData.series).length === 0" class="col-span-full text-center text-gray-500">
        Nenhum dado de evolução disponível para gráficos.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import LineChart from './LineChart.vue';

interface RecordData {
  id: number;
  record_date: string;
  weight: number | null;
  photo_url: string | null;
  forma_url: string | null;
  photo_is_private: boolean; 
  forma_is_private: boolean;
  event: string | null;
  weekly_action: string | null;
  workout_days: number | null;
  observations: string | null;
}

interface ChartSeries {
  labels: string[];
  series: Record<string, (number | null)[]>;
  records: RecordData[];
}

const props = defineProps({
  rawChartData: {
    type: Object as () => ChartSeries,
    required: true,
    default: () => ({ labels: [], series: {}, records: [] })
  },
  hasRegistroPhotos: {
    type: Boolean,
    default: false,
  },
  hasFormaPhotos: {
    type: Boolean,
    default: false,
  },
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
const photoUrls = computed(() => {
  return (props.rawChartData.records || [])
    .filter(record => record.photo_url)
    .map(record => ({ 
      url: record.photo_url as string, 
      date: record.record_date,
      recordId: record.id,
      isPrivate: !!record.photo_is_private,
      type: 'registro' as const
    }))
    .reverse();
});

const formaUrls = computed(() => {
  return (props.rawChartData.records || [])
    .filter(record => record.forma_url)
    .map(record => ({ 
      url: record.forma_url as string,
      date: record.record_date,
      recordId: record.id,
      isPrivate: !!record.forma_is_private,
      type: 'forma' as const
    }))
    .reverse();
});

const formatDate = (dateString: string) => {
  if (!dateString) return 'S/D';
  try {
    const dateObject = new Date(dateString);
    if (isNaN(dateObject.getTime())) return dateString;
    return dateObject.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return dateString;
  }
};

// --- Lógica de Gráficos (mantida) ---
const colors: Record<string, { border: string, background: string, unit: string }> = {
  'weight': { border: '#070FFC', background: 'rgba(7, 15, 252, 0.1)', unit: 'kg' },
  'cintura': { border: '#F3934F', background: 'rgba(243, 147, 79, 0.1)', unit: 'cm' },
  'braço': { border: '#60A5FA', background: 'rgba(96, 165, 250, 0.1)', unit: 'cm' },
  'perna': { border: '#10B981', background: 'rgba(16, 185, 129, 0.1)', unit: 'cm' },
  'default': { border: '#EC4899', background: 'rgba(236, 72, 153, 0.1)', unit: 'unid.' }
};

const chartSeriesArray = computed(() => {
  const allSeries = props.rawChartData?.series || {};
  const labels = props.rawChartData?.labels || [];
  const seriesArray: any[] = [];

  const dataLength = labels.length;
  const filterCount = currentFilter.value === 'all' ? dataLength : parseInt(currentFilter.value);

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
        spanGaps: true, 
      }]
    });
  }

  return seriesArray;
});
</script>
