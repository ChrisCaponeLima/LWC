// /server/utils/measurements.ts - V2.2 - CORREÇÃO DE TIPO: Espera String (sanitizado) e usa parseFloat.

// Removendo a importação de 'Decimal' (não é mais necessário para a lógica de cálculo)

// Estrutura de dados simplificada para records vindos da query (AGORA ESPERANDO STRING)
interface RecordPrisma {
  record_date: Date;
  // 🛑 CORREÇÃO: Agora espera string (resultado do .toString() no API handler)
  weight: string | null; 
  record_measurements: Array<{
    // 🛑 CORREÇÃO: Agora espera string
    value: string | null;
    measurements: {
      name: string;
      unit: string;
    } | null;
  }>;
}

// Estrutura de retorno para o frontend (mantida)
export interface LatestMeasurementData {
  value: number; // Último valor
  name: string;
  unit: string;
  trend: 'up' | 'down' | 'stable' | 'initial'; // 'down' é melhora (verde)
}

/**
* Processa a lista COMPLETA de records (já ordenados do mais novo para o mais antigo) 
* para construir uma série para cada tipo de medida, extrair o último/penúltimo valor
* e calcular a tendência.
* @param records Lista de records ordenados por data (DESC) com valores já sanitizados (String)
* @returns Um objeto mapeado com o nome da medida e seus detalhes, incluindo a tendência.
*/
export function calculateLatestMeasurementsWithTrend(records: RecordPrisma[]): Record<string, LatestMeasurementData> {
  if (records.length === 0) {
    return {};
  }

  // Estrutura temporária: Agrupa todos os valores encontrados por nome de medida (série completa)
  const measurementSeries: Record<string, {
    values: number[], 
    unit: string,
    name: string
  }> = {};

  const weightKey = 'Peso';

  // 1. Iterar por TODOS os records (do mais novo para o mais antigo) para construir a série de valores
  for (const record of records) {
    
    // a. Processar Peso
    // 🛑 CORREÇÃO: Usa parseFloat na string e checa por NaN
    const currentWeight = record.weight ? parseFloat(record.weight) : null;
    if (currentWeight !== null && !isNaN(currentWeight)) {
      if (!measurementSeries[weightKey]) {
        measurementSeries[weightKey] = { values: [], unit: 'kg', name: weightKey };
      }
      // Adicionamos o valor no início do array para manter a ordem cronológica (mais novo primeiro)
      measurementSeries[weightKey].values.push(currentWeight); 
    }

    // b. Processar Medidas Corporais
    record.record_measurements
      .filter(rm => rm.measurements && rm.value !== null)
      .forEach(rm => {
        const name = rm.measurements!.name;
        // 🛑 CORREÇÃO: Usa parseFloat na string e checa por NaN
        const value = parseFloat(rm.value!); 
        const unit = rm.measurements!.unit;
        
        if (isNaN(value)) return; // Ignora se a string não for um número válido

        if (!measurementSeries[name]) {
          measurementSeries[name] = { values: [], unit: unit, name: name };
        }
        // Adicionamos o valor no início do array para manter a ordem cronológica (mais novo primeiro)
        measurementSeries[name].values.push(value); 
      });
  }

  // 2. Processar a série para extrair o último valor e calcular a tendência
  const result: Record<string, LatestMeasurementData> = {};

  for (const key in measurementSeries) {
    const series = measurementSeries[key];
    const values = series.values;

    if (values.length === 0) continue;

    // O valor mais novo é o primeiro na série (índice 0)
    const latestValue = values[0]; 
    
    // O valor anterior é o segundo (índice 1)
    const previousValue = values.length > 1 ? values[1] : undefined;

    let trend: LatestMeasurementData['trend'] = 'initial';

    if (previousValue !== undefined) {
      if (latestValue < previousValue) {
        trend = 'down'; // Melhora (verde, geralmente para peso/medidas)
      } else if (latestValue > previousValue) {
        trend = 'up'; // Piora (vermelho)
      } else {
        trend = 'stable'; // Estável (cinza)
      }
    }

    // Adicionamos apenas o último registro ao resultado final
    result[key] = {
      value: latestValue,
      name: series.name,
      unit: series.unit,
      trend: trend,
    };
  }

  return result;
}