// /components/UserEditModal.vue - V6.2 - Correção de Sintaxe no Bloco Catch (Remoção da anotação de tipo ': any').
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
Editar Usuário: {{ localUser.username }}
</h3>
</div>

<div class="flex items-center space-x-3 absolute right-6 top-6 z-10">
<div class="inline-flex rounded-full bg-gray-200 p-1 text-sm font-medium">
 <button
@click.prevent="viewMode = 'user'"
:disabled="isSubmitting"
:class="[
'px-4 py-2 rounded-full transition-colors duration-200 disabled:opacity-50',
viewMode === 'user' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-700'
]"
>
Usuário
</button>
<button
@click.prevent="viewMode = 'profissional'"
:disabled="isSubmitting"
:class="[
'px-4 py-2 rounded-full transition-colors duration-200 disabled:opacity-50',
viewMode === 'profissional' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-700'
]"
>
Profissional
</button>
</div>
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
v-show="viewMode === 'user'"
>
<legend class="text-sm font-medium px-1 text-gray-500">Dados do Usuário</legend>

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
:disabled="isSubmitting" 
class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
>
<option value="user">User (Padrão)</option>
<option v-if="authStore.isAdmin || authStore.isOwner" value="admin">Admin</option>
<option v-if="authStore.isOwner" value="owner">Owner (Máximo)</option>
</select>
 <p class="mt-1 text-xs text-gray-500">O status de Profissional é controlado pelo seletor acima. Altere o cargo para Admin/Owner se necessário.</p>
</div>

</div>
</fieldset>

 <fieldset 
key="professional-data" 
:class="[
'border p-4 rounded-md transition duration-300',
localUser.role !== 'user' ? 'border-indigo-400' : 'border-gray-200'
]"
v-show="viewMode === 'profissional'"
>
<legend class="text-sm font-medium px-1 text-indigo-600">Dados do Profissional</legend>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">

<div class="md:col-span-2">
<label for="registro_conselho" class="block text-sm font-medium text-gray-700">Registro no Conselho</label>
<input
id="registro_conselho"
v-model="localUser.professionalData.registro_conselho"
type="text"
:disabled="isSubmitting"
class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
placeholder="Ex: CRM-SP 123456"
/>
<p class="mt-1 text-xs text-gray-500">Ex: CRM, CREF, etc. Opcional.</p>
</div>

<div class="md:col-span-2">
<label for="job_title" class="block text-sm font-medium text-gray-700">Cargo / Título *</label>
<input
id="job_title"
v-model="localUser.professionalData.job_title"
type="text"
:disabled="isSubmitting"
class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
placeholder="Ex: Nutricionista Clínica"
/>
</div>

 <div class="md:col-span-2">
<label for="specialties" class="block text-sm font-medium text-gray-700">Especialidades (Múltipla Seleção)</label>
<select
id="specialties"
multiple
v-model="selectedSpecialtyIds"
:disabled="isSubmitting || loadingSpecialties"
class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 h-32"
>
<option disabled v-if="loadingSpecialties">Carregando especialidades...</option>
<option 
 v-for="specialty in availableSpecialties"
 :key="specialty.id"
 :value="specialty.id"
 >
 {{ specialty.name }}
 </option>
</select>
<p v-if="specialtyError" class="mt-1 text-xs text-red-500">Erro ao carregar especialidades: {{ specialtyError }}</p>
</div>

 <div class="md:col-span-2">
<label for="cpf" class="block text-sm font-medium text-gray-700">CPF (apenas números)</label>
<input
id="cpf"
v-model="localUser.professionalData.cpf"
type="text"
:disabled="isSubmitting"
class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
placeholder="Ex: 12345678900"
/>
</div>

<div class="md:col-span-2">
<label for="address_street" class="block text-sm font-medium text-gray-700">Endereço (Rua e Número)</label>
<input
id="address_street"
v-model="localUser.professionalData.address_street"
type="text"
:disabled="isSubmitting"
class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
placeholder="Ex: Rua das Flores, 123"
/>
</div>

<div>
<label for="address_city" class="block text-sm font-medium text-gray-700">Cidade</label>
<input
id="address_city"
v-model="localUser.professionalData.address_city"
type="text"
:disabled="isSubmitting"
class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
placeholder="Ex: São Paulo"
/>
</div>

<div>
<label for="address_state" class="block text-sm font-medium text-gray-700">Estado</label>
<input
id="address_state"
v-model="localUser.professionalData.address_state"
type="text"
:disabled="isSubmitting"
class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
placeholder="Ex: SP"
/>
</div>

<div class="md:col-span-2">
<label for="address_zipcode" class="block text-sm font-medium text-gray-700">CEP</label>
<input
id="address_zipcode"
v-model="localUser.professionalData.address_zipcode"
type="text"
:disabled="isSubmitting"
class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
placeholder="Ex: 01000-000"
/>
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
import { ref, watch, onMounted } from 'vue'
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
const viewMode = ref('user') 

// NOVO ESTADO para Especialidades
const availableSpecialties = ref([])
const selectedSpecialtyIds = ref([])
const loadingSpecialties = ref(false)
const specialtyError = ref(null)

// Função auxiliar para garantir que todos os campos do profissional existam
const getInitialProfessionalData = (data) => ({
 // Usa o 'data' da relação 'professional' se existir, caso contrário, inicializa com null
 job_title: data?.job_title || null,
 registro_conselho: data?.registro_conselho || null,
 cpf: data?.cpf || null,
 address_street: data?.address_street || null,
 address_city: data?.address_city || null,
 address_state: data?.address_state || null,
 address_zipcode: data?.address_zipcode || null,
 // Adicionamos 'professionals_specialties' para inicialização, mas não é usado no template
 professionals_specialties: data?.professionals_specialties || []
})

// Converte a string de data ISO para o formato 'YYYY-MM-DD'
const formatBirthdateForInput = (dateString) => {
// ... (função mantida, omitida por brevidade)
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

// NOVO: Função para buscar as especialidades na API
const fetchSpecialties = async () => {
 if (availableSpecialties.value.length > 0 || loadingSpecialties.value) return 
 
 loadingSpecialties.value = true
 specialtyError.value = null

 try {
  const token = authStore.token 
  if (!token) throw new Error("Token de autenticação não encontrado.")

  const data = await $fetch('/api/specialties', {
   method: 'GET',
   headers: {
    'Authorization': `Bearer ${token}`
   }
  })

  availableSpecialties.value = data
 } catch (e) {
  console.error("Falha ao carregar especialidades:", e)
  specialtyError.value = "Falha ao carregar a lista. Verifique a conexão."
 } finally {
  loadingSpecialties.value = false
 }
}

// Watcher para carregar e inicializar dados do usuário
watch(() => props.userData, (newUserData) => {
if (newUserData) {
 // O endpoint GET/PUT agora retorna 'professional' (singular) por convenção da API,
 // apesar do Prisma usar 'professionals' (plural).
 const professionalDataFromApi = newUserData.professional; 

 localUser.value = {
  ...newUserData,
  // Campos de Usuário
  birthdate: formatBirthdateForInput(newUserData.birthdate),
  sexo: ['M', 'F'].includes(newUserData.sexo) ? newUserData.sexo : null,
  phone: newUserData.phone || null,
  // Dados do Profissional, garantindo a estrutura inicial
  professionalData: getInitialProfessionalData(professionalDataFromApi),
 }

 // 🎯 CORREÇÃO: Inicializa as especialidades selecionadas (rel. M:N)
 const currentSpecialties = professionalDataFromApi?.professionals_specialties || [];
 // Mapeia para um array de IDs: [ { specialty_id: 1 }, ... ] -> [ 1, ... ]
 selectedSpecialtyIds.value = currentSpecialties.map(rel => rel.specialty_id);

 error.value = null
 viewMode.value = 'user'
} else {
 localUser.value = null
 selectedSpecialtyIds.value = []
}
}, { immediate: true })

// Busca especialidades quando o modal é montado ou aberto
onMounted(() => {
 fetchSpecialties()
})
watch(() => props.isOpen, (newVal) => {
 if (newVal) {
  fetchSpecialties()
 }
})


const handleClose = () => {
if (isSubmitting.value) return
emit('close')
}

// 🎯 CORREÇÃO DA LÓGICA DE SUBMISSÃO: Centralizar try/catch e o controle de isSubmitting aqui
const submitUpdate = async () => {
error.value = null
if (isSubmitting.value || !localUser.value) return

// ... (Validações de usuário mantidas) ...

isSubmitting.value = true

const fieldsToUpdate = {
id: localUser.value.id,
username: localUser.value.username,
email: localUser.value.email,
role: localUser.value.role,
birthdate: localUser.value.birthdate || null,
height_cm: localUser.value.height_cm === '' || localUser.value.height_cm === null ? null : Number(localUser.value.height_cm),
initial_weight_kg: localUser.value.initial_weight_kg === '' || localUser.value.initial_weight_kg === null ? null : Number(localUser.value.initial_weight_kg),
sexo: localUser.value.sexo || null,
phone: localUser.value.phone || null,
}

const professionalData = localUser.value.professionalData
// Mescla os dados do profissional e as especialidades
const payload = {
 ...fieldsToUpdate,
 professionalData: {
  job_title: professionalData.job_title || null,
  registro_conselho: professionalData.registro_conselho || null,
  cpf: professionalData.cpf || null,
  address_street: professionalData.address_street || null,
  address_city: professionalData.address_city || null,
  address_state: professionalData.address_state || null,
  address_zipcode: professionalData.address_zipcode || null,
  // Envia a lista de IDs de especialidades selecionadas
  specialtyIds: selectedSpecialtyIds.value
 }
}


try {
 const token = authStore.token;
 if (!token) throw new Error('Token de autenticação não encontrado.');

 // 🎯 Faz a chamada da API PUT diretamente
 const updatedUser = await $fetch(`/api/users/${localUser.value.id}`, {
  method: 'PUT',
  headers: {
   'Authorization': `Bearer ${token}`,
   'Content-Type': 'application/json'
  },
  body: payload
 });

 // Sucesso: Emite o evento de atualização, incluindo o objeto de usuário completo retornado pela API
 emit('user-updated', updatedUser);
 emit('close');
 
} catch (e) { // <-- REMOVIDO ': any'
 console.error('Falha ao atualizar usuário:', e);
 // Captura a mensagem de erro do backend (e.g., violação UNIQUE)
 const statusMessage = e.data?.statusMessage || 'Erro interno do servidor ao atualizar usuário.';
 error.value = statusMessage;
} finally {
 // 🎯 ESSENCIAL: Garante que o estado de submissão seja resetado (destravando o botão)
 isSubmitting.value = false; 
}
}
</script>