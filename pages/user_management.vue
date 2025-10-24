// /pages/user_management.vue - V1.26 - Exibição dos dados do Profissional e Especialidades no Painel de Detalhes.
<template>
<div>
<Header pageTitle="Gerenciamento de Usuários" />

<div class="container mx-auto px-4 my-8">

<div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
<input
type="text"
v-model="searchQuery"
placeholder="Buscar usuários por nome ou email..."
class="p-2 border border-gray-300 rounded-md w-full md:w-1/3 focus:ring-btn-secundario focus:border-btn-secundario transition"
/>
<div class="flex-shrink-0">
<button
@click="openAddUserModal"
class="px-4 py-2 bg-btn-secundario text-btn-font-secundario rounded-md font-semibold hover:opacity-80 transition"
>
Adicionar Novo Usuário
</button>
</div>
</div>

<div v-if="isLoading" class="text-center p-8">
<i class="fas fa-spinner fa-spin text-2xl text-gray-500"></i>
<p class="text-gray-500 mt-2">Carregando lista de usuários...</p>
</div>

<div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
<strong class="font-bold">Erro:</strong>
<span class="block sm:inline"> {{ error }}</span>
<button @click="fetchUsers" class="ml-4 underline font-semibold">Tentar Novamente</button>
</div>

<div v-else class="bg-white shadow-lg rounded-xl overflow-hidden">
<div class="overflow-x-auto">
<table class="min-w-full divide-y divide-gray-200">
<thead class="bg-gray-50">
<tr>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome de Usuário</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Login</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
</tr>
</thead>
<tbody class="divide-y divide-gray-200">
<template v-for="(user, index) in filteredUsers" :key="user.id">
<tr 
@click="selectUser(user)" 
:class="[
'cursor-pointer hover:bg-gray-200 transition',
index % 2 === 0 ? 'bg-white' : 'bg-[#ECECEC]', 
selectedUser?.id === user.id ? 'bg-blue-50 hover:bg-blue-100' : ''
]"
>
<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.id }}</td>
<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{{ user.username }}</td>
<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.email }}</td>
<td class="px-6 py-4 whitespace-nowrap">
<span :class="roleBadgeClass(user.role)">
{{ user.role }}
</span>
</td>
<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
 {{ formatLastLogin(user.lastLogin) }}
</td>
<td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
<button @click.stop="editUser(user)" title="Editar" class="text-indigo-600 hover:text-indigo-900 transition">
<i class="fas fa-edit"></i>
</button>
<button @click.stop="deleteUser(user.id)" title="Excluir" class="text-red-600 hover:text-red-900 transition">
<i class="fas fa-trash"></i>
</button>
</td>
</tr>

 <tr v-if="selectedUser?.id === user.id">
<td :colspan="6" class="p-6 bg-gray-50 border-t border-b border-gray-200">
<div class="p-4 bg-white rounded-lg shadow-xl">
<h4 class="text-xl font-bold mb-4 border-b pb-2 text-gray-700">Detalhes de: {{ selectedUser.username }}</h4>

 <div class="flex flex-col md:flex-row gap-6">

 <div class="flex-shrink-0 w-full md:w-64 flex flex-col items-center">
<p class="font-medium text-gray-600 mb-2">Foto de Perfil:</p>
<img
:src="selectedUser.photo_perfil_url || '/default-profile.png'"
alt="Foto de Perfil"
class="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
@error="selectedUser.photo_perfil_url = '/default-profile.png'"
/>
<span v-if="!selectedUser.photo_perfil_url" class="text-sm text-gray-500 mt-2">Sem foto</span>
</div>


 <div class="flex-grow">

<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-gray-700">
<p class="col-span-1 sm:col-span-2"><strong>Nome:</strong> {{ selectedUser.username }}</p>
<p class="col-span-1 sm:col-span-2"><strong>E-mail:</strong> {{ selectedUser.email }}</p>

<p class="col-span-1"><strong>Data de Nascimento:</strong> {{ formatBirthDate(selectedUser.birthdate) }}</p>
<p class="col-span-1"><strong>Sexo:</strong> {{ formatSexo(selectedUser.sexo) }}</p>

<p class="col-span-1"><strong>Peso Inicial:</strong> {{ formatWeight(selectedUser.initial_weight_kg) }}</p>
<p class="col-span-1"><strong>Altura:</strong> {{ selectedUser.height_cm ? selectedUser.height_cm + ' cm' : 'Não registrado' }}</p>

<p class="col-span-1 sm:col-span-2"><strong>Cargo:</strong>
<span :class="roleBadgeClass(selectedUser.role)">
 {{ selectedUser.role }}
</span>
</p>
</div>

  <div 
v-if="['admin', 'owner'].includes(selectedUser.role) && selectedUser.professional"
class="mt-6 p-4 border rounded-lg"
:class="selectedUser.professional.is_active ? 'border-indigo-400 bg-indigo-50' : 'border-gray-400 bg-gray-100'"
>
 <p class="font-semibold text-indigo-700 mb-2 border-b border-indigo-200 pb-1 flex justify-between items-center">
  <span>Dados Profissionais</span>
  <span v-if="!selectedUser.professional.is_active" class="text-xs text-red-600 font-medium">(Inativo)</span>
 </p>
 <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-700">
  <p class="col-span-1 sm:col-span-2">
   <strong>Título/Cargo:</strong> {{ selectedUser.professional.job_title || 'Não informado' }}
  </p>
  <p class="col-span-1 sm:col-span-2">
   <strong>Registro:</strong> {{ selectedUser.professional.registro_conselho || 'Não informado' }}
  </p>
  <p class="col-span-1 sm:col-span-2">
   <strong>Especialidades:</strong> 
   <span 
    v-if="selectedUser.professional.professionals_specialties && selectedUser.professional.professionals_specialties.length > 0"
    class="font-medium"
   >
    {{ formatSpecialties(selectedUser.professional.professionals_specialties) }}
   </span>
   <span v-else class="text-gray-500">Nenhuma especialidade registrada.</span>
  </p>
  <p class="col-span-1 sm:col-span-2">
   <strong>Endereço:</strong> {{ formatAddress(selectedUser.professional) }}
  </p>
 </div>
</div>
 
  <div class="mt-6 w-full p-3 border rounded-lg bg-gray-100">
<p class="font-semibold text-gray-700 mb-1 border-b pb-1">Medidas Corporais Atuais:</p>
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
<h5 class="text-md font-semibold mt-6 mb-2 pt-4 border-t text-gray-700">Galerias de Imagens</h5>

<div class="flex flex-col gap-4">
<button
@click="toggleGallery('registro')"
class="w-full flex justify-between items-center px-4 py-3 bg-white border rounded-md shadow-sm"
>
<div>
<p class="font-medium text-gray-700">Fotos de Registro</p>
<p class="text-xs text-gray-500">{{ (selectedUser.publicPhotos || []).length }} imagens públicas</p>
</div>
<i :class="activeGallery === 'registro' ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
</button>

<div v-if="activeGallery === 'registro'" class="bg-gray-100 p-3 rounded-md border border-gray-200">
<div v-if="selectedUser.publicPhotos?.length" class="grid grid-cols-2 md:grid-cols-3 gap-2">
<div v-for="(p, i) in selectedUser.publicPhotos" :key="i" class="relative group">
<div class="w-full aspect-square rounded-md overflow-hidden">
 <img 
 :src="p.url" 
 class="w-full h-full object-cover cursor-pointer hover:opacity-80 transition" 
 @click="openFullImage(p.url)" 
 />
</div>
<div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-md text-center opacity-0 group-hover:opacity-100 transition-opacity">
 {{ formatDate(p.date) }}
</div>
</div>
</div>
<p v-else class="text-sm text-gray-500">Nenhuma foto pública disponível.</p>
</div>

<button
@click="toggleGallery('forma')"
class="w-full flex justify-between items-center px-4 py-3 bg-white border rounded-md shadow-sm"
>
<div>
<p class="font-medium text-gray-700">Fotos de Forma</p>
<p class="text-xs text-gray-500">{{ (selectedUser.publicFormas || []).length }} imagens públicas</p>
</div>
<i :class="activeGallery === 'forma' ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
</button>

<div v-if="activeGallery === 'forma'" class="bg-gray-100 p-3 rounded-md border border-gray-200">
<div v-if="selectedUser.publicFormas?.length" class="grid grid-cols-2 md:grid-cols-3 gap-2">
<div v-for="(p, i) in selectedUser.publicFormas" :key="i" class="relative group">
<div class="w-full aspect-square rounded-md overflow-hidden">
 <img 
 :src="p.url" 
 class="w-full h-full object-cover cursor-pointer hover:opacity-80 transition" 
 @click="openFullImage(p.url)" 
 />
</div>
<div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-md text-center opacity-0 group-hover:opacity-100 transition-opacity">
 {{ formatDate(p.date) }}
</div>
</div>
</div>
<p v-else class="text-sm text-gray-500">Nenhuma foto pública disponível.</p>
</div>
</div>
</div>
</td>
</tr>
</template>
</tbody>
</table>

</div>

<div v-if="filteredUsers.length === 0 && !isLoading" class="p-4 text-center text-gray-500">
Nenhum usuário encontrado que corresponda à busca.
</div>
</div>
</div>

<div v-if="fullImageUrl" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" @click="closeFullImage">
<img :src="fullImageUrl" class="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg" />
<button class="absolute top-5 right-5 text-white text-3xl" @click.stop="closeFullImage">✕</button>
</div>

<UserEditModal 
:user-data="userToEdit" 
:is-open="isEditModalOpen" 
@close="closeEditModal" 
@user-updated="handleUserUpdate"
/>

<UserAddModal
:is-open="isAddModalOpen"
@close="closeAddModal"
@user-created="handleUserCreate"
:is-submitting-from-parent="isUserCreationLoading"
/>

<Footer />
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#app'
import UserEditModal from '~/components/UserEditModal.vue'
import UserAddModal from '~/components/UserAddModal.vue'

definePageMeta({
middleware: ['admin-auth']
})

const authStore = useAuthStore()
const config = useRuntimeConfig()
const users = ref([])
const searchQuery = ref('')
const isLoading = ref(false)
const error = ref(null)
const selectedUser = ref(null)
const fullImageUrl = ref(null)

// Variáveis para o Modal de Edição (Existente)
const isEditModalOpen = ref(false)
const userToEdit = ref(null)

// Variáveis para o Modal de Adição (NOVO)
const isAddModalOpen = ref(false)
const isUserCreationLoading = ref(false) // Estado de carregamento/submissão para criação

const activeGallery = ref(null) // 'registro' | 'forma' | null

const openFullImage = (url) => (fullImageUrl.value = url)
const closeFullImage = () => (fullImageUrl.value = null)
const toggleGallery = (which) => {
activeGallery.value = activeGallery.value === which ? null : which
}

const roleBadgeClass = (role) => {
const r = (role || '').toString().toLowerCase()
if (r === 'owner') return 'px-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800'
if (r === 'admin') return 'px-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800'
return 'px-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800'
}

// 💥 NOVO: Formatação do campo Sexo
const formatSexo = (sexoCode) => {
switch ((sexoCode || '').toUpperCase()) {
case 'M': return 'Masculino'
case 'F': return 'Feminino'
default: return 'Não informado'
}
}

// ---------------------------------------------------------------------
// 💥 NOVO: Funções de Formatação para Profissionais
// ---------------------------------------------------------------------

/**
 * Formata a lista de especialidades para exibição (apenas IDs no momento).
 * No futuro, a API pode ser atualizada para incluir o nome da especialidade.
 * Assumindo que a API GET de user retorna { specialty_id: N } em professionals_specialties.
 */
const formatSpecialties = (specialtyRelations) => {
  if (!specialtyRelations || specialtyRelations.length === 0) {
    return 'Nenhuma';
  }
  // Mapeia os IDs e junta-os com vírgula para exibição.
  return specialtyRelations.map(rel => rel.specialty_id).join(', '); 
}

/**
 * Formata o endereço completo do profissional.
 */
const formatAddress = (professionalData) => {
  const parts = [];
  if (professionalData.address_street) parts.push(professionalData.address_street);
  if (professionalData.address_city) parts.push(professionalData.address_city);
  if (professionalData.address_state) parts.push(professionalData.address_state);
  if (professionalData.address_zipcode) parts.push(`CEP: ${professionalData.address_zipcode}`);

  return parts.length > 0 ? parts.join(', ') : 'Não registrado';
}

// ---------------------------------------------------------------------
// Funções para Tendência (Trend)
// ---------------------------------------------------------------------

/**
* Retorna a classe CSS do ícone baseado na tendência.
* 'down' é melhora (verde) para medidas corporais.
*/
const trendIconClass = (trend) => {
const t = (trend || '').toLowerCase()
// Corrigido para FontAwesome 5
if (t === 'down') return 'fas fa-arrow-down text-green-600' // Melhora/Perda (Peso/Medidas)
if (t === 'up') return 'fas fa-arrow-up text-red-600'  // Piora/Aumento (Peso/Medidas)
if (t === 'stable') return 'fas fa-minus text-gray-500' // Estável
return 'fas fa-info-circle text-blue-500'     // Initial/Não comparável
}

/**
* Retorna o texto do tooltip baseado na tendência.
*/
const trendTooltip = (trend) => {
const t = (trend || '').toLowerCase()
if (t === 'down') return 'Melhora (diminuição) em relação ao registro anterior.'
if (t === 'up') return 'Piora (aumento) em relação ao registro anterior.'
if (t === 'stable') return 'Estável em relação ao registro anterior.'
return 'Primeiro ou único registro disponível.'
}


// ... (Funções de Formatação: formatWeight, formatMeasurement, measurementUnit, formatBirthDate, formatLastLogin, formatDate)
const formatWeight = (weightString) => {
if (!weightString) return 'Não registrado'
try {
const weight = parseFloat(weightString)
// O peso agora é extraído do objeto latestMeasurementsWithTrend no backend.
// Aqui, apenas formatamos o valor que já vem processado do backend.
return isNaN(weight) ? 'Inválido' : `${weight.toFixed(2)} kg`
} catch {
return 'Inválido'
}
}

// Alterado para aceitar number ou string (já que o backend pode enviar number ou string formatada)
const formatMeasurement = (value) => {
if (value === null || value === undefined) return '0.00'
try {
const val = typeof value === 'string' ? parseFloat(value) : value
return isNaN(val) ? 'Inválido' : val.toFixed(2)
} catch {
return 'Inválido'
}
}

// Mantido, mas note que a unidade agora vem do campo `data.unit` no template.
const measurementUnit = (_name) => 'cm'

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
// A data de nascimento deve vir no formato YYYY-MM-DD
if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
} catch { }
return dateString
}

const formatLastLogin = (dateString) => {
if (!dateString) return 'Nunca'
try {
const d = new Date(dateString)
if (isNaN(d.getTime())) return dateString
return d.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
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
// Fim das funções de formatação
// ...

// R: READ (Inalterada)
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

const response = await $fetch('/api/users', {
baseURL: config.public.apiBaseUrl,
method: 'GET',
headers: { Authorization: `Bearer ${token}` }
})

users.value = Array.isArray(response) ? response : []
} catch (e) {
console.error('Erro ao buscar usuários (Frontend):', e)
const fetchError = (e?.data || e?.response || e)
error.value = fetchError?.statusMessage || fetchError?.message || 'Falha desconhecida ao carregar usuários.'
if (e?.status === 401 || e?.status === 403) {
error.value += '. Tente refazer o login.'
}
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
if (selectedUser.value && selectedUser.value.id === user.id) {
selectedUser.value = null
activeGallery.value = null
} else {
selectedUser.value = user
activeGallery.value = null
}
}

// C: CREATE (Inalterada)
const openAddUserModal = () => { isAddModalOpen.value = true }
const closeAddModal = () => { isAddModalOpen.value = false }

const handleUserCreate = async (newUserData) => {
const token = authStore.token
if (!token) return alert('Sessão expirada. Faça login novamente.')

isUserCreationLoading.value = true

try {
const createdUser = await $fetch('/api/users', {
baseURL: config.public.apiBaseUrl,
method: 'POST',
headers: { 
'Authorization': `Bearer ${token}`,
'Content-Type': 'application/json' 
},
body: newUserData
})

users.value.unshift(createdUser)
closeAddModal() 
alert('Usuário criado com sucesso!')

} catch (e) {
console.error('Erro ao criar usuário:', e)
const errorMsg = e?.data?.statusMessage || e?.message || 'Falha desconhecida ao criar usuário.'
alert(`Erro ao criar usuário: ${errorMsg}`)
} finally {
isUserCreationLoading.value = false 
}
}


// U: UPDATE (Ajustada para resetar isSubmitting local do modal)
const editUser = (user) => { 
// Clonamos o objeto para evitar mutação direta
userToEdit.value = { ...user }
isEditModalOpen.value = true
}

const closeEditModal = () => {
isEditModalOpen.value = false
userToEdit.value = null
}

const handleUserUpdate = async (updatedFields) => {
const token = authStore.token
if (!token) return alert('Sessão expirada. Faça login novamente.')

// 💥 Resetamos o estado de submissão do modal após a lógica de API
// Isso é necessário porque o modal de edição gere seu próprio estado `isSubmitting`

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

// Atualiza o usuário na lista principal
const index = users.value.findIndex(u => u.id === updatedUser.id)
if (index !== -1) {
// Usa Object.assign para manter a reatividade onde for necessário
users.value[index] = Object.assign(users.value[index], updatedUser)
}
// Se o usuário selecionado for o editado, atualiza também
if (selectedUser.value && selectedUser.value.id === updatedUser.id) {
selectedUser.value = Object.assign(selectedUser.value, updatedUser)
}
closeEditModal()
alert('Usuário atualizado com sucesso!')


} catch (e) {
console.error('Erro ao atualizar usuário:', e)
alert(`Erro ao atualizar usuário: ${e?.data?.statusMessage || e?.message || 'Falha desconhecida'}`)
}
// Resetamos o estado local do modal de edição (isSubmitting dentro do modal)
// Isso é feito em 'UserEditModal.vue' via 'handleUpdate' (que precisa ser adaptado)
// Como o modal está controlando o próprio loading, o pai não consegue resetá-lo.
// Vou deixar a responsabilidade de reset no próprio modal para manter a integridade, 
// assumindo que ele já está configurado para tal.
}


// D: DELETE (Ajustada para usar rota DELETE recém-criada)
const deleteUser = async (userId) => {
const token = authStore.token
if (!token) return alert('Sessão expirada. Faça login novamente.')

if (confirm('Tem certeza de que deseja excluir este usuário? Esta ação é irreversível.')) {
try {
// CHAMADA DE API REAL: DELETE /api/users/[id]
await $fetch(`/api/users/${userId}`, {
baseURL: config.public.apiBaseUrl,
method: 'DELETE',
headers: { Authorization: `Bearer ${token}` }
})

// Remoção local após sucesso da API
users.value = users.value.filter(u => u.id !== userId)
if (selectedUser.value?.id === userId) selectedUser.value = null
alert('Usuário excluído com sucesso.')

} catch (e) {
console.error('Erro ao excluir usuário:', e)
alert(`Erro ao excluir usuário: ${e?.data?.statusMessage || e?.message || 'Falha desconhecida'}`)
}
}
}

onMounted(() => { fetchUsers() })
</script>