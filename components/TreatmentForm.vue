<template>
    <form @submit.prevent="submitForm">
      <div class="field-group">
        <label for="name">Nome do Tratamento:</label>
        <input type="text" id="name" v-model="form.treatment_name" required />
      </div>
  
      <fieldset class="price-group">
        <legend>Preços por Tamanho (R$)</legend>
        
        <div class="price-input">
          <label for="precoP">Pequeno (P):</label>
          <input type="number" step="0.01" id="precoP" v-model="form.precoP" placeholder="0.00" />
        </div>
        
        <div class="price-input">
          <label for="precoM">Médio (M):</label>
          <input type="number" step="0.01" id="precoM" v-model="form.precoM" placeholder="0.00" />
        </div>
        
        <div class="price-input">
          <label for="precoG">Grande (G):</label>
          <input type="number" step="0.01" id="precoG" v-model="form.precoG" placeholder="0.00" />
        </div>
        
        <div class="price-input">
          <label for="precoGG">Extra Grande (GG):</label>
          <input type="number" step="0.01" id="precoGG" v-model="form.precoGG" placeholder="0.00" />
        </div>
  
      </fieldset>
      
      <button type="submit">{{ isEdit ? 'Atualizar Tratamento' : 'Criar Tratamento' }}</button>
    </form>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  
  const props = defineProps<{
    initialData?: any; // Dados do tratamento para edição
    isEdit: boolean;
  }>();
  
  const emit = defineEmits(['submitted']);
  
  const form = ref({
    treatment_name: '',
    precoP: null as number | null,
    precoM: null as number | null,
    precoG: null as number | null,
    precoGG: null as number | null,
  });
  
  onMounted(() => {
    if (props.initialData) {
      // Ao montar para edição, preenche o formulário
      form.value.treatment_name = props.initialData.treatment_name;
      // Converte os valores (que chegam como string devido à serialização Decimal) para number
      form.value.precoP = props.initialData.precoP ? parseFloat(props.initialData.precoP) : null;
      form.value.precoM = props.initialData.precoM ? parseFloat(props.initialData.precoM) : null;
      form.value.precoG = props.initialData.precoG ? parseFloat(props.initialData.precoG) : null;
      form.value.precoGG = props.initialData.precoGG ? parseFloat(props.initialData.precoGG) : null;
    }
  });
  
  const submitForm = async () => {
    // O backend espera os valores como string/number ou null
    const payload = {
      ...form.value,
      // Adiciona o ID para a rota de atualização, se for o caso
      ...(props.isEdit && props.initialData?.id && { id: props.initialData.id }),
    };
  
    const endpoint = props.isEdit ? '/api/treatments/update.put' : '/api/treatments/create.post';
    
    // Lógica de chamada API (adaptar ao seu método de fetch ou useFetch)
    try {
      const response = await $fetch(endpoint, {
        method: props.isEdit ? 'PUT' : 'POST',
        body: payload,
      });
      
      emit('submitted', response);
    } catch (error: any) {
      // Tratar erro (ex: exibir toast de erro)
      console.error('Erro ao salvar tratamento:', error);
    }
  };
  </script>
  
  <style scoped>
  /* Estilos básicos para o exemplo */
  .field-group { margin-bottom: 15px; }
  .price-group { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
  .price-group legend { font-weight: bold; padding: 0 10px; }
  .price-input { display: flex; align-items: center; margin-bottom: 10px; }
  .price-input label { flex-basis: 150px; }
  .price-input input { flex-grow: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
  </style>