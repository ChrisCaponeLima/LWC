import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { apiFetch } from '~/utils/api'; // Importa o novo cliente de API

/**
 * Composable para carregar todos os dados de KPI e Gráfico.
 */
export function useKpiData() {
  const authStore = useAuthStore();
  
  const isLoading = ref(true);
  const error = ref(null);

  // ... (kpiData e chartData permanecem iguais)
  const kpiData = reactive({ /* ... */ });
  const chartData = reactive({ /* ... */ });
  
  // (Função calculateIMC permanece igual)
  const calculateIMC = (weight, heightCm) => { /* ... */ };

  // --- Função principal que agora chama o Backend ---
  const fetchData = async () => {
    isLoading.value = true;
    error.value = null;

    // Obtém o ID do usuário logado para buscar APENAS os dados dele
    const userId = authStore.user?.userId;

    if (!userId) {
        error.value = 'Usuário não autenticado. Impossível carregar dados.';
        isLoading.value = false;
        return;
    }
    
    try {
      // 1. CHAMA O BACKEND REAL (substituindo a simulação)
      // Assumindo que sua API tem um endpoint para obter todos os registros de um usuário
      const records = await apiFetch(`/records/user/${userId}`, { 
        method: 'GET' 
      });

      // 2. Processa os Dados (a lógica permanece a mesma, mas os dados vêm da API)
      if (records && records.length > 0) {
        // Ordena por data, se não vier ordenado, para garantir o último registro
        records.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const latestRecord = records[records.length - 1];

        // Processa KPIs
        kpiData.currentWeight = latestRecord.weight;
        kpiData.initialWeight = authStore.user?.initialWeight || records[0].weight; // Usa o primeiro registro se o inicial não estiver no Store
        kpiData.totalLoss = (kpiData.initialWeight - latestRecord.weight).toFixed(1);
        kpiData.height = authStore.user?.heightCm || 170;
        kpiData.imc = calculateIMC(latestRecord.weight, kpiData.height);

        // Processa Gráficos
        chartData.labels = records.map(r => new Date(r.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }));
        chartData.weights = records.map(r => r.weight);
        chartData.waists = records.map(r => r.waist);
        
      } else {
        error.value = 'Nenhum registro de evolução encontrado.';
        // ... (lógica de fallback)
      }
      
    } catch (e) {
      error.value = 'Falha na comunicação com o servidor. Verifique a URL da API.';
      // Lembre-se que o erro já foi logado no apiFetch
    } finally {
      isLoading.value = false;
    }
  };
  
  // ... (onMounted e o return permanecem iguais)
  onMounted(() => {
    fetchData();
  });

  return {
    kpiData,
    chartData,
    isLoading,
    error,
    fetchData
  };
}