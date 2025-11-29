// /components/PatientEditModal.vue - V1.3 - Correção do nome da chave ID no payload (id -> userId) para compatibilidade com o backend.

<template>
<div 
v-if="isOpen && localUser" 
class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
@click.self="handleClose"
>
<div class="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
<div class="p-6 border-b flex justify-between items-center relative">

<div>
<h3 class="text-xl font-bold text-gray-800">
<i class="fas fa-user-edit mr-2 text-indigo-500"></i> Editando Paciente: {{ localUser.username }} 
</h3>
</div>

<button @click="handleClose" class="text-gray-400 hover:text-gray-600" :disabled="isSubmitting">
<i class="fas fa-times text-2xl"></i>
</button>
</div>

<div class="p-6">
<form @submit.prevent="submitUpdate">
<div class="space-y-6">
<div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-3" role="alert">
<p class="font-bold">Erro</p>
<p class="text-sm">{{ error }}</p>
</div>

<fieldset 
key="user-data" 
class="border border-gray-200 p-4 rounded-md transition duration-300"
>
<legend class="text-sm font-medium text-gray-700 px-1">Dados Cadastrais e Físicos</legend>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">

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
<label for="phone" class="block text-sm font-medium text-gray-700">Telefone</label>
<input
id="phone"
v-model="localUser.phone"
type="tel"
placeholder="(xx) xxxxx-xxxx"
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
class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:focus:border-indigo-500 disabled:bg-gray-50"
/>
</div>

<div>
<label for="height_cm" class="block text-sm font-medium text-gray-700">Altura (cm)</label>
<input
id="height_cm"
v-model.number="localUser.height_cm"
type="number"
min="50"
step="1"
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

</div>
</fieldset>


<div class="pt-4 flex justify-end space-x-3 border-t">
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
class="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
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

<script setup lang="ts">
import { ref, watch, PropType } from 'vue'
import { useAuthStore } from '~/stores/auth'

// Interface para garantir a tipagem do objeto de usuário, incluindo os novos campos
interface UserData {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  birthdate: string | null;
  sexo: 'M' | 'F' | null;
  role: string;
  // Campos estáticos de paciente
  height_cm: number | null;
  initial_weight_kg: number | null;
}

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  userData: {
    type: Object as PropType<UserData>, // Usamos a nova interface
    default: null,
  }
})

const emit = defineEmits(['close', 'user-updated'])
const authStore = useAuthStore()

const localUser = ref<UserData | null>(null) // Tipagem corrigida
const isSubmitting = ref(false)
const error = ref<string | null>(null) // Tipagem corrigida

// Converte a string de data ISO para o formato 'YYYY-MM-DD'
const formatBirthdateForInput = (dateString: string | null) => {
  if (!dateString) return null
  try {
    if (typeof dateString === 'string' && dateString.includes('T')) {
      return dateString.split('T')[0]
    }
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString
    }
    const d = new Date(dateString)
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0]
    }
  } catch (e) {
    console.error("Erro ao formatar data de nascimento:", e)
  }
  return null
}

// Watcher para carregar e inicializar dados do usuário
watch(() => props.userData, (newUserData) => {
  if (newUserData) {
    // Assegura que todos os campos de paciente sejam inicializados, mesmo que venham como undefined da API
    localUser.value = {
      ...newUserData,
      birthdate: formatBirthdateForInput(newUserData.birthdate),
      sexo: ['M', 'F'].includes(newUserData.sexo) ? newUserData.sexo : null,
      phone: newUserData.phone || null,
      
      // Tratamento de Campos Numéricos de Paciente
      height_cm: newUserData.height_cm === undefined ? null : newUserData.height_cm,
      initial_weight_kg: newUserData.initial_weight_kg === undefined ? null : newUserData.initial_weight_kg,
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

// 🎯 LÓGICA DE SUBMISSÃO
const submitUpdate = async () => {
  error.value = null
  if (isSubmitting.value || !localUser.value) return

  isSubmitting.value = true

  // Garante que os valores numéricos sejam convertidos ou se tornem null se vazios/undefined
  const heightValue = localUser.value.height_cm === '' || localUser.value.height_cm === null ? null : Number(localUser.value.height_cm);
  const weightValue = localUser.value.initial_weight_kg === '' || localUser.value.initial_weight_kg === null ? null : Number(localUser.value.initial_weight_kg);

  const payload = {
    // CORREÇÃO: Alterar 'id' para 'userId' para compatibilidade com o backend /api/users.put.ts
    userId: localUser.value.id,
    username: localUser.value.username,
    email: localUser.value.email,
    birthdate: localUser.value.birthdate || null,
    
    // Campos de Paciente
    height_cm: heightValue, // Uso da variável local garantindo o tipo Number|null
    initial_weight_kg: weightValue, // Uso da variável local garantindo o tipo Number|null
    
    sexo: localUser.value.sexo || null,
    phone: localUser.value.phone || null,
  }

  try {
    const token = authStore.token;
    if (!token) throw new Error('Token de autenticação não encontrado.');

    // Chamada da API PUT
    const updatedUser = await $fetch(`/api/users/${localUser.value.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: payload
    });

    emit('user-updated', updatedUser);
    emit('close');

  } catch (e: any) {
    console.error('Falha ao atualizar paciente:', e);
    const statusMessage = e.data?.statusMessage || 'Erro interno do servidor ao atualizar paciente.';
    error.value = statusMessage;
  } finally {
    isSubmitting.value = false; 
  }
}
</script>