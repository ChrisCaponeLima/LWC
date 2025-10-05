// /components/UserAddModal.vue - V1.0 - Componente modal para adicionar um novo usuário.
<template>
<div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
 <div class="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
  <div class="p-6 border-b flex justify-between items-center">
   <h3 class="text-xl font-bold text-gray-800">Adicionar Novo Usuário</h3>
   <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
    <i class="fas fa-times text-2xl"></i>
   </button>
  </div>

  <div class="p-6">
   <form @submit.prevent="createUser">
    <div class="space-y-4">
     <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-3" role="alert">
      <p class="font-bold">Erro de Cadastro</p>
      <p class="text-sm">{{ error }}</p>
     </div>

          <div>
      <label for="username" class="block text-sm font-medium text-gray-700">Nome de Usuário</label>
      <input
       id="username"
       v-model="newUser.username"
       type="text"
       required
       class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
     </div>

          <div>
      <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
      <input
       id="email"
       v-model="newUser.email"
       type="email"
       required
       class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
     </div>

          <div>
      <label for="password" class="block text-sm font-medium text-gray-700">Senha Inicial (padrão: 123456)</label>
      <input
       id="password"
       v-model="newUser.password"
       type="password"
       required
       minlength="6"
       class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
      <p class="mt-1 text-xs text-gray-500">O usuário deverá mudar a senha no primeiro login.</p>
     </div>

          <div>
      <label for="role" class="block text-sm font-medium text-gray-700">Cargo</label>
      <select
       id="role"
       v-model="newUser.role"
       class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
       <option value="user">User (Padrão)</option>
       <option v-if="authStore.isAdmin || authStore.isOwner" value="admin">Admin</option>
       <option v-if="authStore.isOwner" value="owner">Owner (Máximo)</option>
      </select>
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
       :disabled="isCreating"
       class="px-4 py-2 bg-btn-secundario text-btn-font-secundario rounded-md font-semibold hover:opacity-80 transition disabled:opacity-50"
      >
       <i v-if="isCreating" class="fas fa-spinner fa-spin mr-2"></i>
       Criar Usuário
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

const props = defineProps({
isOpen: {
 type: Boolean,
 default: false,
},
})

const emit = defineEmits(['close', 'user-created'])
const authStore = useAuthStore()

const isCreating = ref(false)
const error = ref(null)

const defaultNewUser = {
username: '',
email: '',
password: '123456', // Sugere uma senha inicial
role: 'user',
}

const newUser = ref({ ...defaultNewUser })

// Reseta o formulário ao abrir o modal
watch(() => props.isOpen, (isOpen) => {
if (isOpen) {
 newUser.value = { ...defaultNewUser }
 error.value = null
}
})

const createUser = async () => {
isCreating.value = true
error.value = null

// 1. Validação simples
if (newUser.value.password.length < 6) {
 error.value = "A senha deve ter pelo menos 6 caracteres."
 isCreating.value = false
 return
}

const dataToCreate = {
 username: newUser.value.username,
 email: newUser.value.email,
 password: newUser.value.password,
 role: newUser.value.role,
 // Os outros campos (birthdate, height_cm, etc.) serão null ou definidos pelo backend
}

try {
 // TODO: Implementar a chamada de API POST real aqui. 
 // O endpoint /api/users para criar um novo usuário deve ser protegido por autenticação de Admin/Owner.

 // SIMULAÇÃO DE SUCESSO
 console.log('Simulação: Dados enviados para a API de Cadastro:', dataToCreate)

 // Simulação de resposta da API (ID gerado e hash de senha removido)
 const simulatedUser = {
  ...dataToCreate,
  id: Math.floor(Math.random() * 1000) + 10, // ID aleatório para simulação
  password_hash: 'SIMULATED_HASH',
  created_at: new Date().toISOString(),
  last_login: null,
 }
 delete simulatedUser.password

 // 2. Emitir o evento de criação
 emit('user-created', simulatedUser)

} catch (e) {
 console.error('Erro ao criar o usuário:', e)
 error.value = e?.message || 'Falha desconhecida ao criar o usuário.'
} finally {
 isCreating.value = false
}
}
</script>