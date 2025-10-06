// /components/UserAddModal.vue - V1.5 - Correção de erro: Unexpected EOF in tag.
<template>
<div 
 v-if="isOpen" 
 class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
 @click.self="handleClose"
>
 <div class="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
  <div class="p-6 border-b flex justify-between items-center">
   <h3 class="text-xl font-bold text-gray-800">Adicionar Novo Usuário</h3>
      <button @click="handleClose" class="text-gray-400 hover:text-gray-600" :disabled="isSubmittingFromParent">
    <i class="fas fa-times text-2xl"></i>
   </button>
  </div>

  <div class="p-6">
   <form @submit.prevent="submitCreate">
    <div class="space-y-4">
     <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-3" role="alert">
      <p class="font-bold">Erro de Validação</p>
      <p class="text-sm">{{ error }}</p>
     </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      
            <div>
       <label for="username" class="block text-sm font-medium text-gray-700">Nome de Usuário *</label>
       <input
        id="username"
        v-model="newUser.username"
        type="text"
        required
        :disabled="isSubmittingFromParent"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
       />
      </div>

            <div>
       <label for="email" class="block text-sm font-medium text-gray-700">Email *</label>
       <input
        id="email"
        v-model="newUser.email"
        type="email"
        required
        :disabled="isSubmittingFromParent"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
       />
      </div>
      
            <div class="col-span-1 md:col-span-2">
       <label for="password" class="block text-sm font-medium text-gray-700">Senha Inicial *</label>
       <input
        id="password"
        v-model="newUser.password"
        type="password"
        required
        minlength="6"
        :disabled="isSubmittingFromParent"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
       />
       <p class="mt-1 text-xs text-gray-500">Mínimo 6 caracteres.</p>
      </div>
      </div>

          <div class="border-t pt-4 mt-4">
      <p class="text-md font-semibold text-gray-700 mb-3">Informações Opcionais</p>
      
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
       
              <div>
        <label for="birthdate" class="block text-sm font-medium text-gray-700">Nascimento</label>
        <input
         id="birthdate"
         v-model="newUser.birthdate"
         type="date"
         :disabled="isSubmittingFromParent"
         class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
        />
       </div>

              <div>
        <label for="height_cm" class="block text-sm font-medium text-gray-700">Altura (cm)</label>
        <input
         id="height_cm"
         v-model.number="newUser.height_cm"
         type="number"
         min="50"
         :disabled="isSubmittingFromParent"
         class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
        />
       </div>
       
              <div>
        <label for="initial_weight_kg" class="block text-sm font-medium text-gray-700">Peso Inicial (kg)</label>
        <input
         id="initial_weight_kg"
         v-model.number="newUser.initial_weight_kg"
         type="number"
         step="0.1"
         min="1"
         :disabled="isSubmittingFromParent"
         class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
        />
       </div>

              <div class="sm:col-span-3">
        <label for="role" class="block text-sm font-medium text-gray-700">Cargo *</label>
        <select
         id="role"
         v-model="newUser.role"
         :disabled="isSubmittingFromParent"
         class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
        >
         <option value="user">User (Padrão)</option>
         <option v-if="authStore.isAdmin || authStore.isOwner" value="admin">Admin</option>
         <option v-if="authStore.isOwner" value="owner">Owner (Máximo)</option>
        </select>
       </div>
      </div>
     </div>
     
          <div class="pt-4 flex justify-end space-x-3">
            <button 
       type="button" 
       @click="handleClose"
       :disabled="isSubmittingFromParent"
       class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md font-semibold hover:bg-gray-400 transition disabled:opacity-50"
      >
       Cancelar
      </button>
            <button 
       type="submit"
       :disabled="isSubmittingFromParent"
       class="px-4 py-2 bg-btn-secundario text-btn-font-secundario rounded-md font-semibold hover:opacity-80 transition disabled:opacity-50"
      >
       <i v-if="isSubmittingFromParent" class="fas fa-spinner fa-spin mr-2"></i>
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
isSubmittingFromParent: {
 type: Boolean,
 default: false,
}
})

const emit = defineEmits(['close', 'user-created']) 
const authStore = useAuthStore()

const error = ref(null)

const defaultNewUser = {
username: '',
email: '',
password: '123456', 
role: 'user',
// NOVOS CAMPOS
birthdate: null, 
height_cm: null, 
initial_weight_kg: null, 
}

const newUser = ref({ ...defaultNewUser })

// Função centralizada para fechar o modal
const handleClose = () => {
if (props.isSubmittingFromParent) return
emit('close')
}

// Reseta o formulário ao abrir o modal
watch(() => props.isOpen, (isOpen) => {
if (isOpen) {
 newUser.value = { ...defaultNewUser }
 error.value = null
}
})

const submitCreate = () => {
error.value = null

// 1. Validação de Campos Obrigatórios
if (newUser.value.password.length < 6) {
 error.value = "A senha deve ter pelo menos 6 caracteres."
 return
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.value.email)) {
 error.value = "Formato de e-mail inválido."
 return
}
if (!newUser.value.username) {
 error.value = "Nome de usuário é obrigatório."
 return
}

// 2. Coleta os dados, garantindo que números vazios sejam nulos
const dataToCreate = {
 username: newUser.value.username,
 email: newUser.value.email,
 password: newUser.value.password,
 role: newUser.value.role,
 // NOVOS DADOS
 birthdate: newUser.value.birthdate || null,
 // Usa Number() para garantir que o tipo seja numérico ou null
 height_cm: newUser.value.height_cm === '' || newUser.value.height_cm === null ? null : Number(newUser.value.height_cm),
 initial_weight_kg: newUser.value.initial_weight_kg === '' || newUser.value.initial_weight_kg === null ? null : Number(newUser.value.initial_weight_kg),
}

// 3. Emite os dados brutos para o componente pai
emit('user-created', dataToCreate)
}
</script>