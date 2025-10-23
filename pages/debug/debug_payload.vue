// /pages/debug/debug.vue - V4.0 - Leitura fixa do arquivo users.get.ts
<template>
  <div class="p-6 max-w-4xl mx-auto bg-white shadow-xl rounded-lg mt-10">
    
    <h1 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">
      Página de Debug: Conteúdo de `users.get.ts`
    </h1>
    
    <p class="text-gray-600 mb-6">
      Esta página exibe o conteúdo do arquivo
      <code class="bg-gray-100 p-1 rounded font-mono text-indigo-700">/server/api/users/get.ts</code> 
      lido diretamente do servidor.
    </p>

    <div class="mt-8">
      <h2 class="text-xl font-semibold text-gray-700 mb-3">
        Conteúdo do Arquivo: <code class="text-indigo-600 font-mono">users.get.ts</code> 
        <span v-if="data && data.type" class="text-sm font-normal text-gray-500">({{ data.type }})</span>
      </h2>

      <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
        <p class="font-bold">Erro ({{ error.statusCode || 'ERR' }})</p>
        <p>{{ error.statusMessage || 'Não foi possível ler o arquivo.' }}</p>
        <p v-if="error.data && error.data.statusMessage" class="mt-2 text-sm">{{ error.data.statusMessage }}</p>
      </div>

      <div v-else-if="pending" class="p-6 text-center text-gray-500">
        <i class="fas fa-spinner fa-spin text-3xl mr-2"></i>
        <p class="mt-2">Lendo arquivo `users.get.ts`...</p>
      </div>

      <div v-else-if="data" class="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm shadow-inner">
        
        <pre v-if="data.type === 'JSON'" class="text-green-400">
          {{ JSON.stringify(data.content, null, 2) }}
        </pre>
        
        <pre v-else-if="data.type === 'CODE'" :class="{'text-blue-300': data.language === 'typescript', 'text-yellow-300': data.language === 'javascript'}">
          {{ data.content }}
        </pre>
        
        <pre v-else-if="data.content" class="text-gray-300">
          {{ data.content }}
        </pre>
        
      </div>

      <div v-else class="p-6 text-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
        <p>Nenhum dado retornado para `users.get.ts`.</p>
      </div>
      
    </div>
  </div>
</template>

<script setup>
// Usa useAsyncData para buscar o conteúdo no carregamento do componente
const { data, pending, error } = await useAsyncData(
  'users-get-ts-content',
  () => $fetch('/api/debug/debug_payload?filename=users.get.ts')
)

// Se quiser testar o que acontece com um arquivo JSON mockado:
// const { data, pending, error } = await useAsyncData(
//   'mock-json-content',
//   () => $fetch('/api/debug/debug_payload?filename=users/list.json')
// )

</script>

<style scoped>
/* Adicione estilos se necessário */
</style>