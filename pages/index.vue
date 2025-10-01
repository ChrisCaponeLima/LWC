// /pages/index.vue - V1.5 - Passa status de fotos para DataDisplay para estilização de botões
<template>
 <div>
  <Header />

  <div class="container mx-auto px-4 my-8">
   <div class="my-8">
    <ClientOnly>
     <h2 class="text-3xl font-bold text-gray-800">
      Olá, {{ authStore.user?.apelido || authStore.user?.username || 'Usuário' }}!
     </h2>
     <p v-if="isLoading" class="text-gray-500">carregando seus dados...</p>
     <p v-else-if="error" class="text-red-500">{{ error }}</p>
     <p v-else class="text-gray-500">Dados atualizados com sucesso.</p>
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
     @click="showForm = !showForm"
     class="px-6 py-3 bg-btn-principal text-btn-font-principal rounded-md font-bold hover:opacity-80"
    >
     <i class="fas fa-plus-circle mr-2"></i> Adicionar Novo Registro
    </button>
   </div>

   <DataForm v-if="showForm" @recordSaved="handleRecordSaved" />

   <DataDisplay 
    :raw-chart-data="chartData" 
    :has-registro-photos="hasRegistroPhotos" 
    :has-forma-photos="hasFormaPhotos" 
   />
  </div>

  <Footer />
 </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useKpiData } from '~/composables/useKpiData';

definePageMeta({
 middleware: ['auth'] 
});

const authStore = useAuthStore();
const showForm = ref(false);

// --- Lógica KPI ---
const { 
  kpiData, 
  chartData, 
  isLoading, 
  error, 
  fetchData,
  hasRegistroPhotos, // << NOVO: Desestruturado
  hasFormaPhotos     // << NOVO: Desestruturado
} = useKpiData();

// --- Lógica Clima (Migrada) ---
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
  isWeatherLoading.value = true;
  weatherError.value = null;
  
  if (process.client && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        callWeatherApi(position.coords.latitude, position.coords.longitude);
      },
      () => {
        callWeatherApi();
      }
    );
  } else {
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
    weatherData.value.code = response.iconCode; // Salva o código para estilização

  } catch (e) {
    weatherError.value = e.statusMessage || 'Falha na comunicação com o serviço de clima.';
    weatherData.value.value = 'N/A';
    weatherData.value.iconUrl = 'https://api.iconify.design/solar:cloud-snow-bold-duotone.svg'; 
    weatherData.value.city = 'Localização Desconhecida';
    weatherData.value.code = 'error'; 
  } finally {
    isWeatherLoading.value = false;
  }
}


const handleRecordSaved = () => {
 fetchData();
 showForm.value = false; 
};

onMounted(() => {
  fetchData(); 
  fetchWeather(); 
});
</script>