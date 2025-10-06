// /server/utils/measurementUtils.ts - V2.1 - Consolidação e remoção de código duplicado (Mantendo V2.0)
import { Decimal } from '@prisma/client/runtime/library';

// Estrutura de dados simplificada para records vindos da query de users.get.ts
interface RecordPrisma {
    record_date: Date;
    weight: Decimal | null; 
    record_measurements: Array<{
        value: Decimal | null;
        measurements: {
            name: string;
            unit: string;
        } | null;
    }>;
}

// Estrutura de retorno para o frontend
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
 * @param records Lista de records ordenados por data (DESC) do Prisma
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
        const currentWeight = record.weight ? (record.weight as Decimal).toNumber() : null;
        if (currentWeight !== null) {
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
                const value = (rm.value as Decimal).toNumber(); 
                const unit = rm.measurements!.unit;

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
                trend = 'down'; // Melhora (verde)
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