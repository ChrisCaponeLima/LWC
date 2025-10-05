// /components/UserEditModal.vue - V1.0 - Componente modal para edição de dados básicos de usuário (Nome, Email, Função, Apelido, Sexo e Data de Nascimento).
<template>
<div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
 <div class="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
  <div class="p-6 border-b flex justify-between items-center">
   <h3 class="text-xl font-bold text-gray-800">Editar Usuário: {{ localUser.username }}</h3>
   <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
    <i class="fas fa-times text-2xl"></i>
   </button>
  </div>

  <div class="p-6">
   <form @submit.prevent="saveChanges">
    <div class="space-y-4">

          <div>
      <label for="username" class="block text-sm font-medium text-gray-700">Nome de Usuário</label>
      <input
       id="username"
       v-model="localUser.username"
       type="text"
       required
       class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
     </div>

          <div>
      <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
      <input
       id="email"
       v-model="localUser.email"
       type="email"
       required
       class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
     </div>

          <div>
      <label for="role" class="block text-sm font-medium text-gray-700">Cargo</label>
      <select
       id="role"
       v-model="localUser.role"
       class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
              <option value="owner" :disabled="!authStore.isOwner">Owner (Máximo)</option>
       <option value="admin" :disabled="!authStore.isOwner && !authStore.isAdmin">Admin</option>
       <option value="user">User (Padrão)</option>
      </select>
     </div>

          <div class="grid grid-cols-2 gap-4">
      <div>
       <label for="birthdate" class="block text-sm font-medium text-gray-700">Data de Nascimento</label>
       <input
        id="birthdate"
        v-model="localUser.birthdate"
        type="date"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
       />
      </div>
      <div>
       <label for="sexo" class="block text-sm font-medium text-gray-700">Sexo</label>
       <select
        id="sexo"
        v-model="localUser.sexo"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
       >
        <option value="">Não Informado</option>
        <option value="Masculino">Masculino</option>
        <option value="Feminino">Feminino</option>
        <option value="Outro">Outro</option>
       </select>
      </div>
     </div>

          <div class="grid grid-cols-2 gap-4">
      <div>
       <label for="height_cm" class="block text-sm font-medium text-gray-700">Altura (cm)</label>
       <input
        id="height_cm"
        v-model.number="localUser.height_cm"
        type="number"
        step="1"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
       />
      </div>
      <div>
       <label for="initial_weight_kg" class="block text-sm font-medium text-gray-700">Peso Inicial (kg)</label>
       <input
        id="initial_weight_kg"
        v-model.number="localUser.initial_weight_kg"
        type="number"
        step="0.01"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
       />
      </div>
     </div>
     
          <div class="pt-4 flex justify-end space-x-3">
      <button 
       type="button" 
       @click="$emit('close')"
       class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md font-semibold hover:bg-gray-400 transition"
      >
       Cancelar
      </button>
      <button 
       type="submit"
       :disabled="isSaving"
       class="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
      >
       <i v-if="isSaving" class="fas fa-spinner fa-spin mr-2"></i>
       Salvar Alterações
      </button>
     </div>

    </div>
   </form>
  </div>
 </div>
</div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
// import { useRuntimeConfig } from '#app' // Comentei o useRuntimeConfig pois não é necessário para a simulação

const props = defineProps({
isOpen: {
 type: Boolean,
 default: false,
},
userData: {
 type: Object,
 default: () => null,
},
})

const emit = defineEmits(['close', 'user-updated'])
const authStore = useAuthStore()
// const config = useRuntimeConfig() // Comentei o useRuntimeConfig pois não é necessário para a simulação

const isSaving = ref(false)
const localUser = ref({})

// Observa 'userData' para inicializar 'localUser' sempre que o modal for aberto com novos dados
watch(() => props.userData, (newUser) => {
if (newUser) {
 // Garante que o birthdate esteja no formato 'YYYY-MM-DD' para o input type="date"
 const birthdate = newUser.birthdate ? newUser.birthdate.split('T')[0] : null
 localUser.value = { ...newUser, birthdate }
}
}, { immediate: true })

const saveChanges = async () => {
isSaving.value = true

// 1. Preparar os dados para a API
const dataToUpdate = { ...localUser.value }
delete dataToUpdate.password_hash // Nunca enviar hash de senha
delete dataToUpdate.created_at
delete dataToUpdate.last_login

try {
 // TODO: Implementar a chamada de API PATCH/PUT real aqui. Exemplo:
 // const token = authStore.token
 // const updatedUser = await $fetch(`/api/users/${dataToUpdate.id}`, {
 // baseURL: config.public.apiBaseUrl,
 // method: 'PATCH',
 // headers: { Authorization: `Bearer ${token}` },
 // body: dataToUpdate
 // })

 // SIMULAÇÃO DE SUCESSO
 console.log('Simulação: Dados enviados para a API:', dataToUpdate)
 
 // 2. Emitir o evento de atualização (usa os dados locais como sucesso simulado)
 emit('user-updated', localUser.value)

} catch (e) {
 console.error('Erro ao salvar as alterações do usuário:', e)
 alert('Falha ao salvar. Verifique o console para detalhes.')
} finally {
 isSaving.value = false
}
}
</script>