<template>
    <div class="p-4 bg-white rounded-xl shadow-md">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue';
  import { Chart, registerables } from 'chart.js';
  
  // Registra todos os módulos do Chart.js
  Chart.register(...registerables);
  
  const props = defineProps({
    chartData: {
      type: Object,
      required: true
    },
    chartOptions: {
      type: Object,
      default: () => ({})
    }
  });
  
  const chartCanvas = ref(null);
  let chartInstance = null;
  
  const renderChart = () => {
    if (chartInstance) {
      chartInstance.destroy(); // Destrói o gráfico anterior antes de renderizar o novo
    }
    
    // Cria a nova instância do gráfico
    chartInstance = new Chart(chartCanvas.value, {
      type: 'line', // Tipo de gráfico de linha, comum para evolução de peso
      data: props.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...props.chartOptions,
      }
    });
  };
  
  onMounted(() => {
    renderChart();
  });
  
  // Re-renderiza o gráfico se os dados mudarem (para filtros como 3m/6m/All)
  watch(() => props.chartData, () => {
    renderChart();
  }, { deep: true });
  </script>
  
  <style scoped>
  /* Define uma altura mínima para os gráficos */
  div {
    height: 300px; /* Altura padrão para um bom visual */
  }
  </style>