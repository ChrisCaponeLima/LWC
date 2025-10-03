// /pages/index.vue - V1.7 - Clima e Saudação Dinâmica
<template>
  <div>
    <Header />

    <div class="container mx-auto px-4 my-8">
      <div class="my-8">
        <ClientOnly>
          <h2 class="text-3xl font-bold text-gray-800">
            {{ greetingMessage }}, {{ authStore.user?.apelido || authStore.user?.username || 'Usuário' }}!
          </h2>
          <p v-if="isLoading" class="text-gray-500">carregando seus dados...</p>
          <p v-else-if="error" class="text-red-500">{{ error }}</p>
          </ClientOnly>
      </div>

      <div class="mb-4">
        <KpiCard
          label="Clima Atual"
          :value="weatherData.value"
          color="terracota"
          :icon-url="weatherData.iconUrl"
          icon-alt="Ícone de Clima"
          :weather-code="weatherData.code"
        />
        <p v-if="isWeatherLoading" class="text-sm text-gray-500 mt-1">Carregando clima em **{{ weatherData.city || 'localização padrão' }}**...</p>
        <p v-else-if="weatherError" class="text-sm text-red-500 mt-1">Erro ao carregar clima: {{ weatherError || 'verifique o console' }}.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Peso Atual"
          :value="`${kpiData.currentWeight} kg`"
          color="azul"
          icon-url="https://api.iconify.design/solar:scale-bold-duotone.svg"
          icon-alt="Ícone de Escala"
        />

        <KpiCard
          label="Perda Total"
          :value="`${kpiData.totalLoss} kg`"
          color="roxo"
          icon-url="https://api.iconify.design/solar:minus-square-bold-duotone.svg"
          icon-alt="Ícone de Perda"
        />

        <KpiCard
          label="Status Semanal"
          value="Estável"
          color="amarelo"
          icon-url="https://api.iconify.design/solar:calendar-bold-duotone.svg"
          icon-alt="Ícone de Calendário"
        />

        <KpiCard
          label="IMC"
          :value="kpiData.imc?.toFixed(2) || '---'" 
          color="verde"
          icon-url="https://api.iconify.design/solar:ruler-bold-duotone.svg"
          icon-alt="Ícone de Régua"
        />
      </div>

      <div class="mt-8 text-center">
        <button
          @click="startNewRecord"
          class="px-6 py-3 bg-btn-principal text-btn-font-principal rounded-md font-bold hover:opacity-80"
        >
          <i class="fas fa-plus-circle mr-2"></i> Adicionar Novo Registro
        </button>
      </div>

      <DataForm v-if="showForm" :record-id="editingRecordId" @recordSaved="handleRecordSaved" />

      <DataDisplay 
        :raw-chart-data="chartData" 
        :has-registro-photos="hasRegistroPhotos" 
        :has-forma-photos="hasFormaPhotos" 
        @editRecord="handleEditRecord"
      />
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'; // Adicionado 'computed'
import { useAuthStore } from '~/stores/auth';
import { useKpiData } from '~/composables/useKpiData';

definePageMeta({
  middleware: ['auth'] 
});

const authStore = useAuthStore();
const showForm = ref(false);
const editingRecordId = ref(null); 

// --- Lógica KPI ---
const { 
  kpiData, 
  chartData, 
  isLoading, 
  error, 
  fetchData,
  hasRegistroPhotos, 
  hasFormaPhotos 
} = useKpiData();

// --- NOVO: Saudação Dinâmica ---
const greetingMessage = computed(() => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    // Manhã
    const options = ["Bom dia", "Lindo dia", "Excelente manhã"];
    return options[Math.floor(Math.random() * options.length)];
  } else if (hour >= 12 && hour < 18) {
    // Tarde
    const options = ["Boa tarde", "Excelente dia", "Que tarde agradável"];
    return options[Math.floor(Math.random() * options.length)];
  } else {
    // Noite/Madrugada
    const options = ["Boa noite", "Bom te ver", "Esperamos que tenha tido um bom dia"];
    return options[Math.floor(Math.random() * options.length)];
  }
});

// --- Lógica Clima (Otimizada e Isolada) ---
const weatherData = ref({ 
  value: '---', 
  iconUrl: 'https://api.iconify.design/solar:sun-bold-duotone.svg', 
  description: '',
  city: 'N/A',
  code: null 
});
const isWeatherLoading = ref(false);
const weatherError = ref(null);


const fetchWeather = () => {
  // Corrigindo o bug: Reseta o erro do clima a cada tentativa de busca
  isWeatherLoading.value = true;
  weatherError.value = null;
  
  if (process.client && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        callWeatherApi(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // Fallback: se a localização for negada ou falhar
        callWeatherApi();
      }
    );
  } else {
    // Fallback: se não estiver no cliente (SSR) ou não tiver geolocalização
    callWeatherApi();
  }
};

const callWeatherApi = async (lat = null, lon = null) => {
  try {
    const params = {};
    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    }

    const response = await $fetch('/api/weather', { params });
    
    weatherData.value.value = `${response.temperature} - ${response.description}`;
    weatherData.value.iconUrl = `https://openweathermap.org/img/wn/${response.iconCode}@2x.png`;
    weatherData.value.description = response.description;
    weatherData.value.city = response.city; 
    weatherData.value.code = response.iconCode; 

  } catch (e) {
    // Corrigindo o bug: Tratamento mais robusto do erro da API
    weatherError.value = e.statusMessage || 'Falha na comunicação com o serviço de clima.';
    weatherData.value.value = 'N/A';
    weatherData.value.iconUrl = 'https://api.iconify.design/solar:cloud-snow-bold-duotone.svg'; 
    weatherData.value.city = 'Localização Desconhecida';
    weatherData.value.code = 'error'; 
  } finally {
    isWeatherLoading.value = false;
  }
}


// --- Handlers de Ação (Mantidos da correção anterior) ---

const startNewRecord = () => {
  editingRecordId.value = null;
  showForm.value = true;
};

const handleEditRecord = (recordId) => {
  editingRecordId.value = recordId;
  showForm.value = true;
};

const handleRecordSaved = () => {
  fetchData(); 
  showForm.value = false; 
  editingRecordId.value = null; 
};

onMounted(() => {
  // Buscas separadas para garantir que o clima não bloqueie os dados
  fetchData(); 
  fetchWeather(); 
});
</script>