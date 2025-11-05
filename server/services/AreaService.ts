// /server/services/AreaService.ts - V2.1 - Correção da Posição das Interfaces

import { PrismaClient, treatment_areas, treatment_area_measures, treatment_factors } from '@prisma/client';
import { Prisma } from '@prisma/client'; // Import necessário para Decimal

// Extende treatment_areas para incluir suas relações
type AreaWithDetails = treatment_areas & {
    treatment_area_measures: treatment_area_measures | null;
    treatment_factors: treatment_factors[];
};

// -------------------------------------------------------------------------
// DEFINIÇÕES DE INTERFACE MOVIDAS PARA O ESCOPO DO MÓDULO (FORA DA CLASSE)
// -------------------------------------------------------------------------

/**
 * Interface para dados de Regra de Medida
 */
interface MeasureData {
    area_id: number;
    measure_type: string;
    measure_name: string;
    is_required: boolean;
}

/**
 * Interface para dados de Fator de Tamanho
 */
interface FactorData {
    area_id: number;
    size_key: 'P' | 'M' | 'G' | 'GG'; // Limita as chaves de tamanho
    measure_min: number;
    measure_max: number;
}

const prisma = new PrismaClient();

export class AreaService {
    
    // -------------------------------------------------------------------------
    // 1. Treatment Areas (Áreas de Tratamento) - MÉTODOS EXISTENTES...
    // -------------------------------------------------------------------------

    /**
     * Lista todas as áreas de tratamento com seus detalhes de medida e fatores.
     * @returns Promise<AreaWithDetails[]>
     */
    async listAllAreas(): Promise<AreaWithDetails[]> {
        return prisma.treatment_areas.findMany({
            include: {
                treatment_area_measures: true,
                treatment_factors: {
                    orderBy: {
                        measure_min: 'asc' // Ordena os fatores para fácil visualização
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        }) as Promise<AreaWithDetails[]>;
    }

    /**
     * Cria uma nova Área de Tratamento (treatment_areas)
     * @param name Nome da área
     * @returns Promise<treatment_areas>
     */
    async createArea(name: string): Promise<treatment_areas> {
        return prisma.treatment_areas.create({
            data: {
                name,
            },
        });
    }

    /**
     * Atualiza o nome de uma Área de Tratamento (treatment_areas)
     * @param id ID da área
     * @param name Novo nome
     * @returns Promise<treatment_areas>
     */
    async updateArea(id: number, name: string): Promise<treatment_areas> {
        return prisma.treatment_areas.update({
            where: { id },
            data: { name },
        });
    }

    /**
     * Deleta uma Área de Tratamento (treatment_areas)
     * O 'onDelete: Cascade' no schema deve cuidar das medidas e fatores relacionados.
     * @param id ID da área
     * @returns Promise<treatment_areas>
     */
    async deleteArea(id: number): Promise<treatment_areas> {
        return prisma.treatment_areas.delete({
            where: { id },
        });
    }


    // -------------------------------------------------------------------------
    // 2. Treatment Area Measures (Regras de Medida por Área)
    // -------------------------------------------------------------------------

    /**
     * Cria ou atualiza a regra de medida para uma área.
     * @param data Dados da medida.
     * @returns Promise<treatment_area_measures>
     */
    async upsertAreaMeasure(data: MeasureData): Promise<treatment_area_measures> {
        // Usamos upsert ou delete/create porque 'area_id' é @unique no schema.
        
        // 1. Tenta deletar o registro existente (se houver, devido à unique constraint)
        try {
            // Note que se o delete falhar porque o registro não existe, ele lança um erro, mas o try/catch lida com isso.
            await prisma.treatment_area_measures.delete({
                where: { area_id: data.area_id },
            });
        } catch (error: any) {
            // Se não encontrar, continua. Se for outro erro, lança
            if (!error.message.includes('Record to delete does not exist')) {
                 // Aqui usamos o código P2025 (registro não encontrado) do Prisma para ser mais específico
                if (error?.code !== 'P2025') {
                    // Se não for o erro de registro não encontrado, relançamos.
                     throw error; 
                }
            }
        }
        
        // 2. Cria o novo registro
        return prisma.treatment_area_measures.create({
            data: {
                area_id: data.area_id,
                measure_type: data.measure_type,
                measure_name: data.measure_name,
                is_required: data.is_required,
            },
        });
    }

    /**
     * Deleta a regra de medida de uma área.
     * @param areaId ID da área
     * @returns Promise<treatment_area_measures>
     */
    async deleteAreaMeasure(areaId: number): Promise<treatment_area_measures> {
        return prisma.treatment_area_measures.delete({
            where: { area_id: areaId },
        });
    }


    // -------------------------------------------------------------------------
    // 3. Treatment Factors (Fatores de Tamanho para Cálculo)
    // -------------------------------------------------------------------------

    /**
     * Cria ou atualiza um Fator de Tratamento (treatment_factors).
     * @param data Dados do fator.
     * @returns Promise<treatment_factors>
     */
    async upsertTreatmentFactor(data: FactorData): Promise<treatment_factors> {
        // Usamos upsert porque a combinação [area_id, size_key] é @@unique
        return prisma.treatment_factors.upsert({
            where: {
                area_id_size_key: { // Chave de unicidade composta
                    area_id: data.area_id,
                    size_key: data.size_key,
                },
            },
            update: {
                // Prisma Decimal (Decimal do Prisma)
                measure_min: new Prisma.Decimal(data.measure_min), 
                measure_max: new Prisma.Decimal(data.measure_max),
            },
            create: {
                area_id: data.area_id,
                size_key: data.size_key,
                // Prisma Decimal (Decimal do Prisma)
                measure_min: new Prisma.Decimal(data.measure_min),
                measure_max: new Prisma.Decimal(data.measure_max),
            },
        });
    }

    /**
     * Deleta um Fator de Tratamento específico por Área e Chave de Tamanho.
     * @param areaId ID da área
     * @param sizeKey Chave de tamanho ('P', 'M', 'G', 'GG')
     * @returns Promise<treatment_factors>
     */
    async deleteTreatmentFactor(areaId: number, sizeKey: FactorData['size_key']): Promise<treatment_factors> {
        return prisma.treatment_factors.delete({
            where: {
                area_id_size_key: {
                    area_id: areaId,
                    size_key: sizeKey,
                },
            },
        });
    }
    
    // -------------------------------------------------------------------------
    // 4. Lógica de Cálculo de Preço Avançado
    // -------------------------------------------------------------------------

    /**
     * Determina a chave de tamanho (P, M, G, GG) com base na área e na medida real.
     * @param areaId ID da área de tratamento.
     * @param userMeasure Medida real do paciente (ex: 15.5 para 15.5cm).
     * @returns Promise<{ sizeKey: 'P' | 'M' | 'G' | 'GG', factorId: number }>
     */
    async calculateTreatmentSize(areaId: number, userMeasure: number): Promise<{ sizeKey: FactorData['size_key']; factorId: number }> {
        // 1. Buscar todos os fatores para a área, ordenados por medida mínima
        const factors = await prisma.treatment_factors.findMany({
            where: { area_id: areaId },
            orderBy: { measure_min: 'asc' },
        });

        if (factors.length === 0) {
            // Se não há fatores configurados, não é possível calcular
            throw new Error('Nenhum fator de tamanho configurado para esta área.');
        }
        
        // 2. Encontrar o fator que engloba a medida do usuário.
        // O loop verifica se a medida do usuário está entre o min (inclusivo) e o max (exclusivo).
        
        for (const factor of factors) {
            // Usamos parseFloat para garantir a comparação de Number, já que userMeasure é Number.
            const min = parseFloat(factor.measure_min.toString());
            const max = parseFloat(factor.measure_max.toString());

            if (userMeasure >= min && userMeasure < max) {
                return {
                    sizeKey: factor.size_key as FactorData['size_key'],
                    factorId: factor.id
                };
            }
            
            // Tratamento de Borda: Se for o último fator e userMeasure for exatamente igual ao limite máximo
            // Por convenção, o limite máximo do último fator é inclusivo.
            if (factor === factors[factors.length - 1] && userMeasure === max) {
                 return {
                    sizeKey: factor.size_key as FactorData['size_key'],
                    factorId: factor.id
                };
            }
        }

        // 3. Se a medida não se encaixa em nenhum fator
        const maxLimit = factors[factors.length - 1].measure_max;
        
        // Se a medida for menor que o limite mínimo global
        if (userMeasure < parseFloat(factors[0].measure_min.toString())) {
             throw new Error(`A medida (${userMeasure}) está abaixo do limite mínimo configurado (${factors[0].measure_min}).`);
        }
        
        // Se a medida for maior que o limite máximo global
        throw new Error(`A medida (${userMeasure}) excede o limite máximo configurado (${maxLimit}).`);
    }
}