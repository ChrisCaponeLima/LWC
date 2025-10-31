// /pages/professional/user_search.vue - V2.3 - Correção final de caracteres invisíveis (Non-Breaking Space ou similar) nos nós de texto da coluna de Ações, eliminando o erro de parser do Vue/Vite.
<template>
<div>
<Header pageTitle="Buscar Paciente" />

<div class="container mx-auto px-4 my-8">

<div class="flex justify-center md:justify-start gap-4 mb-6">
<input
type="text"
v-model="searchQuery"
placeholder="Buscar pacientes por nome ou email..."
class="p-3 border border-gray-300 rounded-lg w-full md:w-1/2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition"
/>
</div>

<div v-if="isLoading" class="text-center p-8">
<i class="fas fa-spinner fa-spin text-3xl text-indigo-500"></i>
<p class="text-indigo-500 mt-2">Carregando lista de pacientes...</p>
</div>

<div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
<strong class="font-bold">Erro:</strong>
<span class="block sm:inline"> {{ error }}</span>
<button @click="fetchUsers" class="ml-4 underline font-semibold">Tentar Novamente</button>
</div>

<div v-else class="bg-white shadow-xl rounded-xl overflow-hidden">
<div class="overflow-x-auto">
<table class="min-w-full divide-y divide-gray-200">
<thead class="bg-gray-50">
<tr>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome de Usuário</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
<th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
</tr>
</thead>
<tbody class="divide-y divide-gray-200">
<template v-for="(user, index) in filteredUsers" :key="user.id">
<tr
@click="selectUser(user)"
:class="[
'cursor-pointer hover:bg-gray-100 transition',
index % 2 === 0 ? 'bg-white' : 'bg-[#F9F9F9]',
selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-indigo-500' : ''
]"
>
<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.id }}</td>
<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{{ user.username }}</td>
<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.email }}</td>
 <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex items-center justify-center">
 <button
@click.stop="openRecordCreationModal(user)"
title="Criar Novo Registro de Acompanhamento"
class="p-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition w-8 h-8 flex items-center justify-center"
>
<i class="fas fa-plus"></i>
</button>
<button
@click.stop="goToTreatments(user.id)"
title="Gerenciar Tratamento"
class="p-2 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition w-8 h-8 flex items-center justify-center"
>
<i class="fas fa-notes-medical"></i>
</button>
</td>
</tr>

<tr v-if="selectedUser?.id === user.id">
<td :colspan="4" class="p-6 bg-gray-50 border-t border-b border-gray-200"> <div class="p-4 bg-white rounded-lg shadow-xl">
<h4 class="text-xl font-bold mb-4 border-b pb-2 text-gray-700">Detalhes de: {{ selectedUser.username }}</h4>

<div class="flex flex-col md:flex-row gap-6">

<div class="flex-shrink-0 w-full md:w-64 flex flex-col items-center">
<p class="font-medium text-gray-600 mb-2">Foto de Perfil:</p>
<img
:src="selectedUser.photo_perfil_url || '/default-profile.png'"
alt="Foto de Perfil"
class="w-32 h-32 rounded-full object-cover border-2 border-indigo-500"
/>
<button 
@click="openUserEditModal(user)" 
class="mt-4 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
>
<i class="fas fa-pencil-alt mr-1"></i> Editar Dados Pessoais
</button>
</div>

<div class="flex-grow">
<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-gray-700">
<p class="col-span-1 sm:col-span-2"><strong>Nome:</strong> {{ selectedUser.username }}</p>
<p class="col-span-1 sm:col-span-2"><strong>E-mail:</strong> {{ selectedUser.email }}</p>

<p class="col-span-1"><strong>Data de Nascimento:</strong> {{ formatBirthDate(selectedUser.birthdate) }}</p>
<p class="col-span-1"><strong>Sexo:</strong> {{ formatSexo(selectedUser.sexo) }}</p>

<p class="col-span-1"><strong>Peso Inicial:</strong> {{ formatWeight(selectedUser.initial_weight_kg) }}</p>
<p class="col-span-1"><strong>Altura:</strong> {{ selectedUser.height_cm ? selectedUser.height_cm + ' cm' : 'Não registrado' }}</p>
</div>

<div class="mt-6 w-full p-3 border rounded-lg bg-indigo-50">
<p class="font-semibold text-indigo-700 mb-1 border-b pb-1">Medidas Corporais Atuais:</p>
<div v-if="selectedUser.latestMeasurements && Object.keys(selectedUser.latestMeasurements).length > 0" class="text-sm">
<p v-for="data in selectedUser.latestMeasurements" :key="data.name" class="flex justify-between items-center">
<span>{{ data.name }}:</span>
<span class="font-medium flex items-center gap-2">
 {{ formatMeasurement(data.value) }} {{ data.unit }}
 <i :class="trendIconClass(data.trend)" :title="trendTooltip(data.trend)"></i>
</span>
</p>
</div>
<p v-else class="text-sm text-gray-500">Nenhuma medida registrada.</p>
</div>
</div>
</div>

<UserTreatmentGalleryWrapper :user-id="selectedUser.id" />
</div>
</td>
</tr>
</template>
</tbody>
</table>
</div>

<div v-if="filteredUsers.length === 0 && !isLoading" class="p-6 text-center text-gray-500">
Nenhum paciente encontrado que corresponda à busca.
<button 
v-if="searchQuery.length > 0" 
@click="searchQuery = ''" 
class="mt-2 text-indigo-600 hover:text-indigo-800 underline transition"
>
Limpar busca
</button>
</div>
</div>
</div>

<PatientEditModal 
:user-data="userToEdit" 
:is-open="isEditModalOpen" 
@close="closeEditModal" 
@user-updated="handleUserUpdate"
/>

<PatientRecordModal
:user-id="userToCreateRecordId" 
:patient-name="userToCreateRecordName" 
:is-open="isRecordModalOpen"
@close="closeRecordCreationModal"
@record-saved="handleRecordSaved"
/>

<Footer />
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig, useRouter } from '#app'
import PatientEditModal from '~/components/PatientEditModal.vue'
import PatientRecordModal from '~/components/PatientRecordModal.vue'
import UserTreatmentGalleryWrapper from '~/components/UserTreatmentGalleryWrapper.vue' 

// Permissão de acesso: admin, owner, professional
definePageMeta({
middleware: ['professional-auth'],
allowedRoles: ['admin', 'owner', 'profissional']
})

const authStore = useAuthStore()
const config = useRuntimeConfig()
const router = useRouter()
const users = ref([])
const searchQuery = ref('')
const isLoading = ref(false)
const error = ref(null)
const selectedUser = ref(null)

// Variáveis de estado para o PatientEditModal
const isEditModalOpen = ref(false)
const userToEdit = ref(null)

// Variáveis de estado para o PatientRecordModal
const isRecordModalOpen = ref(false)
const userToCreateRecordId = ref(null)
const userToCreateRecordName = ref('') 

// ---------------------------------------------------------------------
// FUNÇÕES DE AÇÃO
// ---------------------------------------------------------------------

/**
* Redireciona para a tela de gerenciamento de tratamentos do usuário.
*/
const goToTreatments = (userId) => {
router.push(`/professional/treatments/${userId}`)
}

// LÓGICA DO MODAL DE EDIÇÃO 
const openUserEditModal = (user) => {
userToEdit.value = { ...user }
isEditModalOpen.value = true
}

const closeEditModal = () => {
isEditModalOpen.value = false
userToEdit.value = null
}

// LÓGICA DO MODAL DE REGISTRO
/**
* Abre o modal para criar um novo registro de acompanhamento.
* @param {object} user - O objeto de paciente.
*/
const openRecordCreationModal = (user) => {
userToCreateRecordId.value = user.id
userToCreateRecordName.value = user.username 
isRecordModalOpen.value = true
}

/**
* Fecha o modal de criação de registro.
*/
const closeRecordCreationModal = () => {
isRecordModalOpen.value = false
userToCreateRecordId.value = null
userToCreateRecordName.value = '' 
}

/**
* Lida com o evento de sucesso após salvar um registro.
* Recarrega apenas o usuário afetado para otimização.
*/
const handleRecordSaved = async () => {
closeRecordCreationModal()
alert('Novo registro de acompanhamento salvo com sucesso!')

// Recarrega APENAS o usuário afetado para otimizar o processo.
if (userToCreateRecordId.value) {
const updatedUser = await fetchUserById(userToCreateRecordId.value)
if (updatedUser) {
// Atualiza a lista de usuários (garantindo reatividade com .map)
users.value = users.value.map(u => 
u.id === updatedUser.id ? updatedUser : u
)
// Atualiza o usuário nos detalhes expandidos, se estiver selecionado
if (selectedUser.value && selectedUser.value.id === updatedUser.id) {
selectedUser.value = updatedUser
}
}
}
}

const handleUserUpdate = async (updatedFields) => {
// Lógica de atualização de usuário (Peso/Altura/Medidas)
const token = authStore.token
if (!token) return alert('Sessão expirada. Faça login novamente.')

try {
const userId = updatedFields.id

// CHAMADA DE API REAL: PUT /api/users/[id]
const updatedUser = await $fetch(`/api/users/${userId}`, {
baseURL: config.public.apiBaseUrl,
method: 'PUT',
headers: { 
'Authorization': `Bearer ${token}`,
'Content-Type': 'application/json' 
},
body: updatedFields
})

// Atualiza o usuário na lista principal, garantindo a reatividade com .map
const index = users.value.findIndex(u => u.id === updatedUser.id)
if (index !== -1) {
users.value = users.value.map(user => 
user.id === updatedUser.id ? Object.assign({}, user, updatedUser) : user
)
}

// Se o usuário selecionado for o editado, atualiza também os detalhes abertos
if (selectedUser.value && selectedUser.value.id === updatedUser.id) {
selectedUser.value = Object.assign({}, selectedUser.value, updatedUser)
}

closeEditModal()
alert('Dados do paciente atualizados com sucesso!')

} catch (e) {
console.error('Erro ao atualizar usuário:', e)
alert(`Erro ao atualizar dados: ${e?.data?.statusMessage || e?.message || 'Falha desconhecida'}`)
}
}

// ---------------------------------------------------------------------
// FUNÇÕES DE BUSCA OTIMIZADA
// ---------------------------------------------------------------------

/**
* Busca um único usuário pelo ID.
* @param {number} userId - O ID do paciente.
* @returns {object | null} O objeto de usuário ou null em caso de falha.
*/
const fetchUserById = async (userId) => {
const token = authStore.token
if (!token) return null

try {
// Chamada de API para buscar um único usuário por ID
const user = await $fetch(`/api/users/${userId}`, {
baseURL: config.public.apiBaseUrl,
method: 'GET',
headers: { Authorization: `Bearer ${token}` }
})
return user
} catch (e) {
console.error('Erro ao buscar usuário por ID:', e)
return null
}
}

// ---------------------------------------------------------------------
// FUNÇÕES DE BUSCA E FILTRO
// ---------------------------------------------------------------------

const fetchUsers = async () => {
isLoading.value = true
error.value = null
try {
if (!authStore.initialized) await authStore.init()

const token = authStore.token
if (!token) {
error.value = "Usuário sem token de autenticação. Tente relogar."
return
}

// Chamada de API: /api/users (Busca todos os usuários, a filtragem de ROLE é feita na tela)
const response = await $fetch('/api/users', {
baseURL: config.public.apiBaseUrl,
method: 'GET',
headers: { Authorization: `Bearer ${token}` }
})

// Profissionais buscam APENAS usuários com role 'user' (pacientes).
// Owners e Admins buscam todos.
if (authStore.user?.role === 'profissional') {
users.value = (Array.isArray(response) ? response : []).filter(u => u.role === 'user')
} else {
users.value = Array.isArray(response) ? response : []
}

} catch (e) {
console.error('Erro ao buscar usuários (Frontend):', e)
// Tratamento de erro padronizado para Nuxt3/$fetch
error.value = e?.data?.statusMessage || e?.message || 'Falha desconhecida ao carregar usuários.'
} finally {
isLoading.value = false
}
}

const filteredUsers = computed(() => {
if (!searchQuery.value) return users.value
const query = searchQuery.value.toLowerCase()
return users.value.filter(user =>
(user.username || '').toLowerCase().includes(query) ||
(user.email || '').toLowerCase().includes(query)
)
})

const selectUser = (user) => {
// Lógica de seleção. Variáveis obsoletas removidas.
if (selectedUser.value && selectedUser.value.id === user.id) {
selectedUser.value = null
} else {
selectedUser.value = user
}
}

// ---------------------------------------------------------------------
// FUNÇÕES DE FORMATAÇÃO
// ---------------------------------------------------------------------
const formatSexo = (sexoCode) => {
switch ((sexoCode || '').toUpperCase()) {
case 'M': return 'Masculino'
case 'F': return 'Feminino'
default: return 'Não informado'
}
}
const formatWeight = (weightString) => {
if (!weightString) return 'Não registrado'
try {
const weight = parseFloat(weightString)
return isNaN(weight) ? 'Inválido' : `${weight.toFixed(2)} kg`
} catch {
return 'Inválido'
}
}
const formatMeasurement = (value) => {
if (value === null || value === undefined) return '0.00'
try {
const val = typeof value === 'string' ? parseFloat(value) : value
return isNaN(val) ? 'Inválido' : val.toFixed(2)
} catch {
return 'Inválido'
}
}
const trendIconClass = (trend) => {
const t = (trend || '').toLowerCase()
if (t === 'down') return 'fas fa-arrow-down text-green-600'
if (t === 'up') return 'fas fa-arrow-up text-red-600'
if (t === 'stable') return 'fas fa-minus text-gray-500'
return 'fas fa-info-circle text-blue-500'
}
const trendTooltip = (trend) => {
const t = (trend || '').toLowerCase()
if (t === 'down') return 'Melhora (diminuição) em relação ao registro anterior.'
if (t === 'up') return 'Piora (aumento) em relação ao registro anterior.'
if (t === 'stable') return 'Estável em relação ao registro anterior.'
return 'Primeiro ou único registro disponível.'
}
const formatBirthDate = (dateString) => {
if (!dateString) return 'Não informado'
try {
if (dateString instanceof Date) {
return dateString.toLocaleDateString('pt-BR')
}
if (typeof dateString === 'string' && dateString.includes('T')) {
return new Date(dateString).toLocaleDateString('pt-BR')
}
const parts = dateString.split('-')
if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
} catch { }
return dateString
}
const formatDate = (dateString) => {
if (!dateString) return 'S/D'
try {
const d = new Date(dateString)
if (isNaN(d.getTime())) return dateString
return d.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
} catch {
return dateString
}
}
// ---------------------------------------------------------------------

onMounted(() => { fetchUsers() })
</script>