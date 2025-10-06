// /server/utils/measurementUtils.ts - V1.1 - CORREÇÃO: Garante que todas as medidas, incluindo o Peso, sejam mapeadas e incluídas no retorno.
import { Decimal } from '@prisma/client/runtime/library';

// Define a estrutura de dados esperada dos records vindos do Prisma
interface RecordPrisma {
    id: number;
    record_date: Date;
    weight: Decimal | null; // Campo weight está fora da relação record_measurements
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
 * Processa a lista de records (já ordenados do mais novo para o mais antigo) 
 * para extrair as últimas medidas e calcular a tendência (up/down/stable).
 * @param records Lista de records ordenados por data (DESC) do Prisma
 * @returns Um objeto mapeado com o nome da medida e seus detalhes, incluindo a tendência.
 */
export function calculateLatestMeasurementsWithTrend(records: RecordPrisma[]): Record<string, LatestMeasurementData> {
    const latestMeasurements: Record<string, LatestMeasurementData> = {};

    if (records.length === 0) {
        return {};
    }

    const latestRecord = records[0];
    const previousRecord = records.length > 1 ? records[1] : null;

    // 1. Mapear os valores do último registro (Medidas Corporais)
    // Inicializa a estrutura de dados de retorno com o último valor
    latestRecord.record_measurements
        .filter(rm => rm.measurements && rm.value !== null)
        .forEach(rm => {
            const name = rm.measurements!.name;
            const value = (rm.value as Decimal).toNumber(); 
            
            latestMeasurements[name] = {
                value: value,
                name: name,
                unit: rm.measurements!.unit,
                trend: 'initial', // Será atualizado mais tarde
            };
        });

    // 2. Mapear os valores do último registro (Peso) - TRATAMENTO ESPECIAL
    const weightKey = 'Peso'; // Chave padronizada para o peso no frontend
    const latestWeight = latestRecord.weight ? (latestRecord.weight as Decimal).toNumber() : null;
    
    if (latestWeight !== null) {
        latestMeasurements[weightKey] = {
            value: latestWeight,
            name: weightKey,
            unit: 'kg', // Unidade hardcoded para peso
            trend: 'initial', 
        };
    }
    
    // 3. Se não houver registro anterior, retorna o último com 'initial'
    if (!previousRecord) {
        return latestMeasurements;
    }

    // 4. Mapear os valores do penúltimo registro (para comparação)
    const previousValues: Record<string, number> = {};

    // 4a. Medidas Corporais
    previousRecord.record_measurements
        .filter(rm => rm.measurements && rm.value !== null)
        .forEach(rm => {
            previousValues[rm.measurements!.name] = (rm.value as Decimal).toNumber();
        });

    // 4b. Peso
    const previousWeight = previousRecord.weight ? (previousRecord.weight as Decimal).toNumber() : null;
    if (previousWeight !== null) {
        previousValues[weightKey] = previousWeight;
    }

    // 5. Calcular a tendência para TODAS as medidas mapeadas
    for (const name in latestMeasurements) {
        const latestValue = latestMeasurements[name].value;
        const previousValue = previousValues[name];

        if (previousValue === undefined) {
            // Medida só existe no último registro, mantém 'initial'
            continue; 
        }

        // Determina a tendência: 'down' é geralmente positivo (perda de medidas)
        if (latestValue < previousValue) {
            latestMeasurements[name].trend = 'down'; // Melhora (verde)
        } else if (latestValue > previousValue) {
            latestMeasurements[name].trend = 'up'; // Piora (vermelho)
        } else {
            latestMeasurements[name].trend = 'stable'; // Estável (cinza)
        }
    }

    return latestMeasurements;
}