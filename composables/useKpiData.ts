// ~/composables/useKpiData.ts

import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRuntimeConfig } from '#app'; 

/**
 * Composable para carregar todos os dados de KPI e Gráfico.
 */
export function useKpiData() {
  const authStore = useAuthStore();
  const config = useRuntimeConfig();
  
  const isLoading = ref<boolean>(true);
  const error = ref<string | null>(null);

  // Tipagem simples para os dados reativos
  const kpiData = reactive({ 
    currentWeight: 0 as number,
    initialWeight: 0 as number,
    totalLoss: 0 as number,
    height: 0 as number,
    imc: 0 as number
  });
  
  // Refatorado para armazenar todas as séries de dados dinamicamente
  const chartData = reactive({
    labels: [] as string[],
    // Usaremos um objeto dinâmico para as séries de dados
    series: {} as Record<string, (number | null)[]> 
  });
  
  const calculateIMC = (weight: number, heightCm: number) => {
    if (!heightCm || heightCm === 0) return 0;
    const heightM = heightCm / 100;
    return weight / (heightM * heightM);
  };

  const fetchData = async () => {
    isLoading.value = true;
    error.value = null;

    const userId = authStore.user?.userId;

    if (!userId) {
        error.value = 'Usuário não autenticado ou dados da sessão não carregados.';
        isLoading.value = false;
        return;
    }
    
    try {
      const API_BASE_URL = config.public.apiBaseUrl;
      
      // Tipagem esperada do retorno da API (Records)
      interface MeasurementDetail {
        name: string;
        unit: string;
      }

      interface RecordMeasurement {
        value: number;
        measurements: MeasurementDetail;
      }
      
      interface Record {
        id: number;
        record_date: string; // Vem como string 'YYYY-MM-DD'
        weight: number;
        event: string | null;
        weekly_action: string | null;
        record_measurements: RecordMeasurement[]; // Array de medidas extras
      }

      const records = await $fetch<Record[]>(`/api/records/user/${userId}`, { 
        baseURL: API_BASE_URL,
        method: 'GET' ,
      });

      if (records && records.length > 0) {
        records.sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime());
        
        const latestRecord = records[records.length - 1];

        // Processa KPIs
        kpiData.currentWeight = latestRecord.weight;
        kpiData.initialWeight = authStore.user?.initialWeight || records[0].weight; 
        kpiData.totalLoss = parseFloat((kpiData.initialWeight - latestRecord.weight).toFixed(1));
        kpiData.height = authStore.user?.heightCm || 170;
        kpiData.imc = calculateIMC(latestRecord.weight, kpiData.height);

        // Processa Gráficos
        
        // 1. Processa os labels de data (CORREÇÃO FINAL ROBUSTA PARA INVALID DATE)
        chartData.labels = records.map(r => {
            
            const parts = r.record_date.split('-'); // [YYYY, MM, DD]
            
            if (parts.length === 3) {
                // Cria a data usando Date.UTC para evitar problemas de fuso horário
                // Mês é base 0, então MM - 1
                const date = new Date(Date.UTC(
                    parseInt(parts[0]), // Ano
                    parseInt(parts[1]) - 1, // Mês (0-11)
                    parseInt(parts[2]) // Dia
                ));
                
                if (!isNaN(date.getTime())) {
                    // Retorna a data formatada, garantindo que seja no fuso horário do usuário
                    return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                }
            }
            
            console.warn(`Data inválida encontrada: ${r.record_date}`);
            return 'Data Inválida'; 
        });
        
        // 2. Inicializa o array de peso
        chartData.series['weight'] = records.map(r => r.weight);
        
        // 3. Processa todas as medidas customizadas (dinâmico)
        const allMeasurementNames = new Set<string>();
        
        // Coleta todos os nomes de medidas existentes para inicializar as séries
        records.forEach(r => {
            r.record_measurements.forEach(m => {
                // Remove espaços e converte para minúsculas para padronizar as chaves
                allMeasurementNames.add(m.measurements.name.trim());
            });
        });
        
        // Inicializa séries vazias para cada nome de medida
        allMeasurementNames.forEach(name => {
            chartData.series[name.toLowerCase()] = [];
        });

        // Preenche as séries de dados
        records.forEach(record => {
            allMeasurementNames.forEach(name => {
                const measurement = record.record_measurements.find(m => m.measurements.name.trim() === name.trim());
                
                // Adiciona o valor se existir, senão adiciona null (para pular o ponto no gráfico)
                chartData.series[name.toLowerCase()].push(measurement ? measurement.value : null as any);
            });
        });

      } else {
        error.value = 'Nenhum registro de evolução encontrado.';
        kpiData.currentWeight = authStore.user?.initialWeight || 0;
        kpiData.height = authStore.user?.heightCm || 0;
        kpiData.imc = calculateIMC(kpiData.currentWeight, kpiData.height);
      }
      
    } catch (e) {
      console.error('Erro ao carregar dados de KPI:', e);
      const fetchError = e as { message?: string, status?: number };
      error.value = `Falha ao carregar dados: ${fetchError.message || 'Erro de servidor.'}`;
    } finally {
      isLoading.value = false;
    }
  };
  
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