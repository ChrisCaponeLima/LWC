// /pages/admin/reports/financial.vue - V1.3 - Correção de template, remoção do NuxtLayout e padronização com a estrutura de componentes (Header/Footer) da página user_management.vue.
<template>
  <div>
    <Header page-title="Administração de Relatórios Financeiros" />
    
    <div class="max-w-7xl mx-auto px-4 my-8">
      <div class="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
        <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <i class="fas fa-chart-line mr-3 text-indigo-600"></i>
          Relatórios Financeiros
        </h2>

        <p class="text-lg text-gray-600">
          Esta é a página de administração de relatórios.
        </p>

        <div class="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
          <p class="font-semibold">⚠️ Próxima Implementação:</p>
          <p class="text-sm">Aqui será exibido o componente `PatientFinancialReport` com a lista de tratamentos e a lógica de cálculo de cortesias/descontos.</p>
        </div>
      </div>
    </div>
    
    <Footer /> 
  </div>
</template>

<script setup>
// /pages/admin/reports/financial.vue - V1.3 - Correção de template, remoção do NuxtLayout e padronização com a estrutura de componentes (Header/Footer) da página user_management.vue.

// Define as meta tags da página
definePageMeta({
  middleware: ['professional-auth'],
  // Apenas administradores e proprietários podem acessar esta rota
  allowedRoles: ['admin', 'owner'] 
});

// Importações removidas, pois o padrão é usar o Auto-Import do Nuxt 3 (como em user_management.vue).

// A lógica futura de busca e exibição dos relatórios será adicionada aqui.
</script>