<template>
  <div :class="['rounded-xl shadow-md p-4 flex items-center justify-center space-x-4', cardClasses]">
    <img :src="iconUrl" :alt="iconAlt" class="w-10 h-10" />
    <div class="flex flex-col items-center justify-center">
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
    validator: (value) => ['terracotta', 'azul', 'roxo', 'amarelo', 'verde', 'rosa', 'gelo', 'laranja'].includes(value),
  },
  iconUrl: {
    type: String,
    required: true,
  },
  iconAlt: {
    type: String,
    default: 'Ícone de KPI',
  },
});

const cardClasses = computed(() => {
  const colorMap = {
    terracotta: 'bg-card-terracota',
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
  const colorMap = {
    terracotta: 'text-font-terracota',
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