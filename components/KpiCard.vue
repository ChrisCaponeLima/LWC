// components/KpiCard.vue - V1.1 - Adiciona lógica de estilização dinâmica para o clima e alinhamento à esquerda
<template>
  <div :class="['rounded-xl shadow-md p-4 flex items-center space-x-4', isWeatherCard ? 'justify-start' : 'justify-center', cardClasses]">
    <img :src="iconUrl" :alt="iconAlt" class="w-10 h-10" />
    <div :class="['flex flex-col', isWeatherCard ? 'items-start' : 'items-center', 'justify-center']">
      <span :class="['text-sm font-semibold', fontClasses]">{{ label }}</span>
      <span :class="['text-lg font-bold', fontClasses]">{{ value }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  color: {
    type: String,
    required: true,
    validator: (value) => ['terracota', 'azul', 'roxo', 'amarelo', 'verde', 'rosa', 'gelo', 'laranja'].includes(value),
  },
  iconUrl: {
    type: String,
    required: true,
  },
  iconAlt: {
    type: String,
    default: 'Ícone de KPI',
  },
  // 🚨 NOVO: Propriedade para receber o código do clima
  weatherCode: {
    type: String,
    default: null,
  }
});

// Checa se este card é o card do clima (que usa 'terracota' no pages/index.vue)
const isWeatherCard = computed(() => props.color === 'terracota');

// 🚨 Mapeamento de códigos do OpenWeatherMap para classes Tailwind de Fundo
const weatherBgMap = {
  '01d': 'bg-card-weather-sun', '02d': 'bg-card-weather-sun',
  '03d': 'bg-card-weather-cloudy', '04d': 'bg-card-weather-cloudy',
  '09d': 'bg-card-weather-rain', '10d': 'bg-card-weather-rain',
  '11d': 'bg-card-weather-thunder',
  '13d': 'bg-card-weather-snow',
  '50d': 'bg-card-weather-mist',
  '01n': 'bg-card-weather-night', '02n': 'bg-card-weather-night',
  '03n': 'bg-card-weather-cloudy', '04n': 'bg-card-weather-cloudy',
  '09n': 'bg-card-weather-rain', '10n': 'bg-card-weather-rain',
  '11n': 'bg-card-weather-thunder',
  '13n': 'bg-card-weather-snow',
  '50n': 'bg-card-weather-mist',
  'error': 'bg-card-weather-error', // Fallback para erro
  'default': 'bg-card-terracota'
};

// 🚨 Mapeamento de códigos do OpenWeatherMap para classes Tailwind de Fonte
const weatherFontMap = {
  '01d': 'text-font-weather-sun', '02d': 'text-font-weather-sun',
  '03d': 'text-font-weather-cloudy', '04d': 'text-font-weather-cloudy',
  '09d': 'text-font-weather-rain', '10d': 'text-font-weather-rain',
  '11d': 'text-font-weather-thunder',
  '13d': 'text-font-weather-snow',
  '50d': 'text-font-weather-mist',
  '01n': 'text-font-weather-night', '02n': 'text-font-weather-night',
  '03n': 'text-font-weather-cloudy', '04n': 'text-font-weather-cloudy',
  '09n': 'text-font-weather-rain', '10n': 'text-font-weather-rain',
  '11n': 'text-font-weather-thunder',
  '13n': 'text-font-weather-snow',
  '50n': 'text-font-weather-mist',
  'error': 'text-font-weather-error',
  'default': 'text-font-terracota'
};


const cardClasses = computed(() => {
  // 1. Lógica para o card do clima (terracota)
  if (isWeatherCard.value && props.weatherCode) {
    const code = props.weatherCode in weatherBgMap ? props.weatherCode : 'default';
    return weatherBgMap[code];
  }
  
  // 2. Lógica padrão para outros cards
  const colorMap = {
    terracota: 'bg-card-terracota', // Fallback se não for clima, mas for 'terracota'
    azul: 'bg-card-azul',
    roxo: 'bg-card-roxo',
    amarelo: 'bg-card-amarelo',
    verde: 'bg-card-verde',
    rosa: 'bg-card-rosa',
    gelo: 'bg-card-gelo',
    laranja: 'bg-card-laranja',
  };
  return colorMap[props.color];
});

const fontClasses = computed(() => {
  // 1. Lógica para o card do clima (terracota)
  if (isWeatherCard.value && props.weatherCode) {
    const code = props.weatherCode in weatherFontMap ? props.weatherCode : 'default';
    return weatherFontMap[code];
  }

  // 2. Lógica padrão para outros cards
  const colorMap = {
    terracota: 'text-font-terracota', // Fallback se não for clima, mas for 'terracota'
    azul: 'text-font-azul',
    roxo: 'text-font-roxo',
    amarelo: 'text-font-amarelo',
    verde: 'text-font-verde',
    rosa: 'text-font-rosa',
    gelo: 'text-font-gelo',
    laranja: 'text-font-laranja',
  };
  return colorMap[props.color];
});
</script>

<style scoped>
/* Nenhum estilo necessário aqui, pois estamos usando classes do Tailwind */
</style>