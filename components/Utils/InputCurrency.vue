// /components/Utils/InputCurrency.vue - V1.0 - Componente de Entrada Formatada para Moeda
<template>
    <input
        type="text"
        :value="formattedValue"
        @input="handleInput"
        :placeholder="placeholder"
        :disabled="disabled"
        class="w-full border border-gray-300 p-3 rounded-lg text-right font-mono focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
    >
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

const props = defineProps({
    // Valor recebido pelo v-model (deve ser uma string como "100,00" ou "100")
    modelValue: {
        type: [String, Number],
        default: '0,00'
    },
    placeholder: {
        type: String,
        default: '0,00'
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue']);

// O valor interno formatado que é exibido no input
const formattedValue = computed(() => formatToCurrency(props.modelValue));

// Função que formata uma string numérica para o padrão brasileiro de moeda (vírgula decimal, ponto milhar)
const formatToCurrency = (value: string | number): string => {
    if (value === null || value === undefined) return '';

    // 1. Converte para string e remove tudo que não for dígito
    let stringValue = value.toString().replace(/[^\d]/g, '');

    if (stringValue.length === 0) return '0,00';
    
    // 2. Garante pelo menos 3 dígitos (para o centavo)
    while (stringValue.length < 3) {
        stringValue = '0' + stringValue;
    }

    // 3. Separa os reais dos centavos
    const integerPart = stringValue.slice(0, -2);
    const decimalPart = stringValue.slice(-2);

    // 4. Adiciona ponto milhar
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // 5. Constrói o resultado final
    return `${formattedInteger},${decimalPart}`;
};


// -----------------------------------------------------------------
// Manipulador de Input
// -----------------------------------------------------------------
const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    let rawValue = target.value;

    // Remove todos os caracteres que não sejam dígitos
    const numericValue = rawValue.replace(/[^\d]/g, '');

    // Formata o valor numericamente limpo e aplica de volta no input
    const newFormattedValue = formatToCurrency(numericValue);

    // Atualiza o input DOM diretamente para garantir a posição do cursor (opcional, mas melhora UX)
    target.value = newFormattedValue;
    
    // O valor que será emitido deve ser limpo, ou seja, no padrão do backend (ex: "1234.50")
    // Mas, dado que o `TreatmentForm.vue` espera uma string com vírgula para processamento (ex: "1.234,50"),
    // vamos emitir o valor formatado para que o componente pai o receba exatamente como ele está.
    // O componente pai (TreatmentForm.vue) fará a conversão final para o padrão da API ("1234.50").
    emit('update:modelValue', newFormattedValue); 
};

// Se você precisar que o valor emitido seja o valor "limpo" (com ponto decimal para o backend):
// const getApiValue = (formatted: string): string => {
//     return formatted.replace(/\./g, '').replace(',', '.');
// }
// E emitir: emit('update:modelValue', getApiValue(newFormattedValue));
// Mas, para seguir o que TreatmentForm.vue espera, mantemos a emissão do valor formatado.

</script>

<style scoped>
/* Nenhum estilo específico necessário além do Tailwind */
</style>