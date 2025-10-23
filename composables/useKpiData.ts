// /composables/useKpiData.ts - V1.11 - Corrige cálculo de initialWeight lendo múltiplas propriedades possíveis do authStore.user e fallback seguro

import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#app'

/**
 * Composable para carregar todos os dados de KPI e Gráfico.
 */
export function useKpiData() {
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  const isLoading = ref<boolean>(true)
  const error = ref<string | null>(null)

  const hasRegistroPhotos = ref<boolean>(false)
  const hasFormaPhotos = ref<boolean>(false)

  const kpiData = reactive({
    currentWeight: 0 as number,
    initialWeight: 0 as number,
    totalLoss: 0 as number,
    height: 0 as number,
    imc: 0 as number
  })

  const chartData = reactive({
    labels: [] as string[],
    series: {} as Record<string, (number | null)[]>,
    records: [] as Record<string, any>[]
  })

  const calculateIMC = (weight: number, heightCm: number) => {
    if (!heightCm || heightCm === 0) return 0
    const heightM = heightCm / 100
    return weight / (heightM * heightM)
  }

  const fetchData = async () => {
    isLoading.value = true
    error.value = null

    const userId = authStore.user?.userId

    if (!userId) {
      error.value = 'Usuário não autenticado ou dados da sessão não carregados.'
      isLoading.value = false
      return
    }

    try {
      const API_BASE_URL = config.public.apiBaseUrl

      interface MeasurementDetail {
        name: string
        unit: string
      }

      interface RecordMeasurement {
        value: number
        measurements: MeasurementDetail
      }

      interface Record {
        id: number
        record_date: string // formato DD/MM/YYYY
        weight: number
        event: string | null
        weekly_action: string | null
        workout_days: number | null
        observations: string | null
        photo_url: string | null
        forma_url: string | null
        photo_is_private: boolean
        forma_is_private: boolean
        record_measurements?: RecordMeasurement[]
      }

      const records = await $fetch<Record[]>(`/api/records?userId=${userId}`, {
        baseURL: API_BASE_URL,
        method: 'GET'
      })

      if (records && records.length > 0) {
        // Ordenação por data (DD/MM/YYYY → YYYY-MM-DD)
        records.sort((a, b) => {
          const dateA = a.record_date.split('/').reverse().join('-')
          const dateB = b.record_date.split('/').reverse().join('-')
          return new Date(dateA).getTime() - new Date(dateB).getTime()
        })

        hasRegistroPhotos.value = records.some(record => !!record.photo_url)
        hasFormaPhotos.value = records.some(record => !!record.forma_url)

        chartData.records = records

        const latestRecord = records[records.length - 1]
        const user = authStore.user || {}

        // Tentativas múltiplas para achar peso inicial
        const possibleInitials = [
          user.initial_weight_kg,
          user.initialWeight,
          user.initialWeightKg,
          user.initial_weight,
          user.initial_weightKg
        ]

        let parsedInitial: number | null = null
        for (const v of possibleInitials) {
          if (v !== undefined && v !== null && v !== '') {
            const num = Number(String(v))
            if (!isNaN(num)) {
              parsedInitial = num
              break
            }
          }
        }

        kpiData.currentWeight =
          typeof latestRecord.weight === 'number'
            ? latestRecord.weight
            : latestRecord.weight
            ? Number(latestRecord.weight)
            : 0

        // Se não achou no usuário, tenta usar o primeiro registro
        if (parsedInitial !== null) {
          kpiData.initialWeight = parsedInitial
        } else {
          const firstRecordWeight =
            records[0] && typeof records[0].weight === 'number'
              ? records[0].weight
              : records[0] && records[0].weight
              ? Number(records[0].weight)
              : kpiData.currentWeight

          kpiData.initialWeight = firstRecordWeight
        }

        // Garantias contra NaN
        if (isNaN(kpiData.initialWeight)) kpiData.initialWeight = kpiData.currentWeight || 0
        if (isNaN(kpiData.currentWeight)) kpiData.currentWeight = kpiData.initialWeight || 0

        // Diferença absoluta, sem sinal negativo
        kpiData.totalLoss = parseFloat(
          Math.abs(Number(kpiData.initialWeight) - Number(kpiData.currentWeight)).toFixed(1)
        )

        kpiData.height = authStore.user?.height_cm || 170
        kpiData.imc = calculateIMC(kpiData.currentWeight, kpiData.height)

        chartData.series = {}

        chartData.labels = records.map(r => r.record_date)
        chartData.series['weight'] = records.map(r => r.weight)

        const allMeasurementNames = new Set<string>()

        records.forEach(r => {
          r.record_measurements?.forEach(m => {
            allMeasurementNames.add(m.measurements.name.trim())
          })
        })

        allMeasurementNames.forEach(name => {
          chartData.series[name.toLowerCase()] = []
        })

        records.forEach(record => {
          allMeasurementNames.forEach(name => {
            const measurement = record.record_measurements?.find(
              m => m.measurements.name.trim() === name.trim()
            )
            chartData.series[name.toLowerCase()].push(measurement ? measurement.value : null)
          })
        })
      } else {
        // Nenhum registro encontrado
        error.value = 'Nenhum registro de evolução encontrado.'
        chartData.records = []
        hasRegistroPhotos.value = false
        hasFormaPhotos.value = false
        kpiData.currentWeight = authStore.user?.initial_weight_kg
          ? parseFloat(String(authStore.user.initial_weight_kg))
          : 0
        kpiData.height = authStore.user?.height_cm || 0
        kpiData.imc = calculateIMC(kpiData.currentWeight, kpiData.height)
        kpiData.initialWeight = authStore.user?.initial_weight_kg
          ? parseFloat(String(authStore.user.initial_weight_kg))
          : kpiData.currentWeight
        kpiData.totalLoss = parseFloat(
          Math.abs(Number(kpiData.initialWeight) - Number(kpiData.currentWeight)).toFixed(1)
        )
      }
    } catch (e: any) {
      console.error('Erro ao carregar dados de KPI:', e)
      error.value = `Falha ao carregar dados: ${e.message || 'Erro de servidor.'}`
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    fetchData()
  })

  return {
    kpiData,
    chartData,
    isLoading,
    error,
    fetchData,
    hasRegistroPhotos,
    hasFormaPhotos
  }
}
