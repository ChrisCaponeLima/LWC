<template>
  <div>
    <Header />

    <div class="container mx-auto px-4 my-8">
      <div class="text-center my-8">
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
          value="25ºC - Ensolarado"
          color="terracota"
          font-color="terracota"
          icon-url="https://api.iconify.design/solar:sun-bold-duotone.svg"
          icon-alt="Ícone de Clima"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Peso Atual"
          :value="`${kpiData.currentWeight} kg`"
          color="azul"
          font-color="azul"
          icon-url="https://api.iconify.design/solar:scale-bold-duotone.svg"
          icon-alt="Ícone de Escala"
        />

        <KpiCard
          label="Perda Total"
          :value="`${kpiData.totalLoss} kg`"
          color="roxo"
          font-color="roxo"
          icon-url="https://api.iconify.design/solar:minus-square-bold-duotone.svg"
          icon-alt="Ícone de Perda"
        />

        <KpiCard
          label="Status Semanal"
          value="Estável"
          color="amarelo"
          font-color="amarelo"
          icon-url="https://api.iconify.design/solar:calendar-bold-duotone.svg"
          icon-alt="Ícone de Calendário"
        />

        <KpiCard
          label="IMC"
          :value="kpiData.imc?.toFixed(2) || '---'" 
          color="verde"
          font-color="verde"
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
      />
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useKpiData } from '~/composables/useKpiData';

definePageMeta({
  middleware: ['auth'] 
});

const authStore = useAuthStore();
const showForm = ref(false);

// Chama o Composable para obter os dados reativos
const { kpiData, chartData, isLoading, error, fetchData } = useKpiData();

// Função que recarrega os dados após o formulário emitir o evento de salvamento
const handleRecordSaved = () => {
  fetchData();
  showForm.value = false; 
};
</script>