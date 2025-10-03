// ~/composables/useKpiData.ts - V1.10 - Adaptação para data de registro (DD/MM/YYYY)

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

 const hasRegistroPhotos = ref<boolean>(false);
 const hasFormaPhotos = ref<boolean>(false);

 const kpiData = reactive({ 
  currentWeight: 0 as number,
  initialWeight: 0 as number,
  totalLoss: 0 as number,
  height: 0 as number,
  imc: 0 as number
 });
 
 const chartData = reactive({
  labels: [] as string[],
  series: {} as Record<string, (number | null)[]>,
  records: [] as Record[] 
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
    record_date: string; // AGORA VEM COMO STRING DD/MM/YYYY
    weight: number;
    event: string | null;
    weekly_action: string | null;
        workout_days: number | null; 
        observations: string | null; 
    photo_url: string | null;
    forma_url: string | null;
        photo_is_private: boolean; 
        forma_is_private: boolean; 
    record_measurements: RecordMeasurement[] | undefined;
   }

   const records = await $fetch<Record[]>(`/api/records?userId=${userId}`, { 
    baseURL: API_BASE_URL,
    method: 'GET' ,
   });

   if (records && records.length > 0) {
            // A ordenação agora precisa lidar com o novo formato DD/MM/YYYY
            records.sort((a, b) => {
                const dateA = a.record_date.split('/').reverse().join('-');
                const dateB = b.record_date.split('/').reverse().join('-');
                return new Date(dateA).getTime() - new Date(dateB).getTime();
            });
    
    hasRegistroPhotos.value = records.some(record => !!record.photo_url);
    hasFormaPhotos.value = records.some(record => !!record.forma_url);
    
    chartData.records = records;

    const latestRecord = records[records.length - 1];

    kpiData.currentWeight = latestRecord.weight;
    kpiData.initialWeight = authStore.user?.initial_weight_kg 
            ? parseFloat(authStore.user.initial_weight_kg.toString())
            : records[0].weight; 
    kpiData.totalLoss = parseFloat((kpiData.initialWeight - latestRecord.weight).toFixed(1));
    kpiData.height = authStore.user?.height_cm || 170;
    kpiData.imc = calculateIMC(latestRecord.weight, kpiData.height);

    chartData.series = {};

    // CORREÇÃO: O label do gráfico AGORA USA DIRETAMENTE a string DD/MM/YYYY
    chartData.labels = records.map(r => r.record_date);
    
    // 2. Inicializa o array de peso
    chartData.series['weight'] = records.map(r => r.weight);
    
    // 3. Processa todas as medidas customizadas (dinâmico)
    const allMeasurementNames = new Set<string>();
    
    records.forEach(r => {
      r.record_measurements?.forEach(m => { 
        allMeasurementNames.add(m.measurements.name.trim());
      });
    });
    
    allMeasurementNames.forEach(name => {
      chartData.series[name.toLowerCase()] = [];
    });

    records.forEach(record => {
      allMeasurementNames.forEach(name => {
        const measurement = record.record_measurements?.find(m => m.measurements.name.trim() === name.trim()); 
        
        chartData.series[name.toLowerCase()].push(measurement ? measurement.value : null as any);
      });
    });

   } else {
    error.value = 'Nenhum registro de evolução encontrado.';
    chartData.records = []; 
    hasRegistroPhotos.value = false;
    hasFormaPhotos.value = false;
    kpiData.currentWeight = authStore.user?.initial_weight_kg ? parseFloat(authStore.user.initial_weight_kg.toString()) : 0;
    kpiData.height = authStore.user?.height_cm || 0;
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
  fetchData,
  hasRegistroPhotos,
  hasFormaPhotos
 };
}