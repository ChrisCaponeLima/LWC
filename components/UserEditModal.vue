// /components/UserEditModal.vue - V1.3 - Adiciona campo 'sexo' e garante que todos os campos de edição sejam incluídos.
<template>
<div 
 v-if="isOpen && localUser" 
 class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
 @click.self="handleClose"
>
 <div class="bg-white rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
  <div class="p-6 border-b flex justify-between items-center">
   <h3 class="text-xl font-bold text-gray-800">Editar Usuário: {{ localUser.username }}</h3>
   <button @click="handleClose" class="text-gray-400 hover:text-gray-600" :disabled="isSubmitting">
    <i class="fas fa-times text-2xl"></i>
   </button>
  </div>

  <div class="p-6">
   <form @submit.prevent="submitUpdate">
    <div class="space-y-4">
     <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-3" role="alert">
      <p class="font-bold">Erro de Validação</p>
      <p class="text-sm">{{ error }}</p>
     </div>
     
     <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      
            <div>
       <label for="username" class="block text-sm font-medium text-gray-700">Nome de Usuário</label>
       <input
        id="username"
        v-model="localUser.username"
        type="text"
        required
        :disabled="isSubmitting"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
       />
      </div>

            <div>
       <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
       <input
        id="email"
        v-model="localUser.email"
        type="email"
        required
        :disabled="isSubmitting"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
       />
      </div>

            <div>
       <label for="birthdate" class="block text-sm font-medium text-gray-700">Nascimento</label>
       <input
        id="birthdate"
        v-model="localUser.birthdate"
        type="date"
        :disabled="isSubmitting"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
       />
      </div>

            <div>
       <label for="height_cm" class="block text-sm font-medium text-gray-700">Altura (cm)</label>
       <input
        id="height_cm"
        v-model.number="localUser.height_cm"
        type="number"
        min="50"
        :disabled="isSubmitting"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
       />
      </div>
      
            <div>
       <label for="initial_weight_kg" class="block text-sm font-medium text-gray-700">Peso Inicial (kg)</label>
       <input
        id="initial_weight_kg"
        v-model.number="localUser.initial_weight_kg"
        type="number"
        step="0.1"
        min="1"
        :disabled="isSubmitting"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
       />
      </div>

            <div>
       <label for="sexo" class="block text-sm font-medium text-gray-700">Sexo</label>
       <select
        id="sexo"
        v-model="localUser.sexo"
        :disabled="isSubmitting"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
       >
        <option :value="null">Não Informado</option>
        <option value="M">Masculino</option>
        <option value="F">Feminino</option>
       </select>
      </div>


            <div class="col-span-1 md:col-span-2">
       <label for="role" class="block text-sm font-medium text-gray-700">Cargo</label>
       <select
        id="role"
        v-model="localUser.role"
        :disabled="isSubmitting || !authStore.isAdminOrOwner"
        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
       >
        <option value="user">User (Padrão)</option>
        <option v-if="authStore.isAdmin || authStore.isOwner" value="admin">Admin</option>
        <option v-if="authStore.isOwner" value="owner">Owner (Máximo)</option>
       </select>
       <p v-if="!authStore.isAdminOrOwner" class="mt-1 text-xs text-red-500">Apenas Administradores podem mudar o cargo.</p>
      </div>

     </div>

          <div class="pt-4 flex justify-end space-x-3">
      <button 
       type="button" 
       @click="handleClose"
       :disabled="isSubmitting"
       class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md font-semibold hover:bg-gray-400 transition disabled:opacity-50"
      >
       Cancelar
      </button>
      <button 
       type="submit"
       :disabled="isSubmitting"
       class="px-4 py-2 bg-btn-secundario text-btn-font-secundario rounded-md font-semibold hover:opacity-80 transition disabled:opacity-50"
      >
       <i v-if="isSubmitting" class="fas fa-spinner fa-spin mr-2"></i>
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

const props = defineProps({
isOpen: {
 type: Boolean,
 default: false,
},
userData: {
 type: Object,
 default: null,
}
})

const emit = defineEmits(['close', 'user-updated'])
const authStore = useAuthStore()

const localUser = ref(null)
const isSubmitting = ref(false)
const error = ref(null)

// Converte a string de data ISO para o formato 'YYYY-MM-DD'
const formatBirthdateForInput = (dateString) => {
if (!dateString) return null
try {
 // Se for ISO completo, pega só a data
 if (typeof dateString === 'string' && dateString.includes('T')) {
  return dateString.split('T')[0]
 }
 // Se já for YYYY-MM-DD
 if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
  return dateString
 }
 // Caso a data venha de uma nova Date() ou objeto, tenta normalizar
 const d = new Date(dateString)
 if (!isNaN(d.getTime())) {
  return d.toISOString().split('T')[0]
 }
} catch (e) {
 console.error("Erro ao formatar data de nascimento:", e)
}
return null
}

watch(() => props.userData, (newUserData) => {
if (newUserData) {
 // Clonar os dados e formatar a data para o input[type="date"]
 localUser.value = {
  ...newUserData,
  // Formata a data de nascimento
  birthdate: formatBirthdateForInput(newUserData.birthdate),
  // Garantir que sexo seja 'M', 'F' ou null
  sexo: ['M', 'F'].includes(newUserData.sexo) ? newUserData.sexo : null
 }
 error.value = null
} else {
 localUser.value = null
}
}, { immediate: true })

const handleClose = () => {
if (isSubmitting.value) return
emit('close')
}

const submitUpdate = () => {
error.value = null
if (isSubmitting.value || !localUser.value) return

// Validação básica
if (!localUser.value.username || !localUser.value.email) {
 error.value = "Nome de usuário e e-mail são obrigatórios."
 return
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localUser.value.email)) {
 error.value = "Formato de e-mail inválido."
 return
}

isSubmitting.value = true

// Filtra apenas campos alterados para o backend
const fieldsToUpdate = {
 id: localUser.value.id,
 username: localUser.value.username,
 email: localUser.value.email,
 role: localUser.value.role,
 
 // Novos campos
 birthdate: localUser.value.birthdate || null,
 height_cm: localUser.value.height_cm === '' || localUser.value.height_cm === null ? null : Number(localUser.value.height_cm),
 initial_weight_kg: localUser.value.initial_weight_kg === '' || localUser.value.initial_weight_kg === null ? null : Number(localUser.value.initial_weight_kg),
 sexo: localUser.value.sexo || null,
 // Adicione outros campos necessários aqui
 }

// Emite para o componente pai para realizar a chamada da API
emit('user-updated', fieldsToUpdate)

// O componente pai (user_management.vue) é responsável por definir isSubmitting = false no finally.
// Por enquanto, o pai cuida da lógica de fechamento e loading:
// isSubmitting.value é redefinido no componente pai (handleUserUpdate)

// Mas para evitar que o usuário clique novamente, mantemos ele em 'true'
// e deixamos o componente pai cuidar do reset e fechamento.
}
</script>