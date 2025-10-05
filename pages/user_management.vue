// /pages/user_management.vue - V1.21 - Implementação da lógica do Modal de Adição de Usuário.
<template>
<div>
 <Header />

 <div class="container mx-auto px-4 my-8">
 <h2 class="text-3xl font-bold text-gray-800 mb-6">Gerenciamento de Usuários</h2>

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
     {{ formatLastLogin(user.last_login) }}
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
       <p class="col-span-1"><strong>Sexo:</strong> {{ selectedUser.sexo || 'Não informado' }}</p>

       <p class="col-span-1"><strong>Peso Inicial:</strong> {{ formatWeight(selectedUser.initial_weight_kg) }}</p>
       <p class="col-span-1"><strong>Altura:</strong> {{ selectedUser.height_cm ? selectedUser.height_cm + ' cm' : 'Não registrado' }}</p>

       <p class="col-span-1 sm:col-span-2"><strong>Cargo:</strong>
       <span :class="roleBadgeClass(selectedUser.role)">
        {{ selectedUser.role }}
       </span>
       </p>
      </div>
              
                    <div class="mt-6 w-full p-3 border rounded-lg bg-gray-100">
       <p class="font-semibold text-gray-700 mb-1 border-b pb-1">Medidas Corporais Atuais:</p>
       <div v-if="selectedUser.latestMeasurements && Object.keys(selectedUser.latestMeasurements).length > 0" class="text-sm">
       <p v-for="(value, name) in selectedUser.latestMeasurements" :key="name" class="flex justify-between">
        <span>{{ name }}:</span>
        <span class="font-medium">{{ formatMeasurement(value) }} {{ measurementUnit(name) }}</span>
       </p>
       </div>
       <p v-else class="text-sm text-gray-500">Nenhuma medida registrada.</p>
      </div>
      </div>
     </div>            <h5 class="text-md font-semibold mt-6 mb-2 pt-4 border-t text-gray-700">Galerias de Imagens</h5>

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
 />

 <Footer />
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig, navigateTo } from '#app'

// Adicionado o novo componente de modal de Adição
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

const formatWeight = (weightString) => {
if (!weightString) return 'Não registrado'
try {
 const weight = parseFloat(weightString)
 return isNaN(weight) ? 'Inválido' : `${weight.toFixed(2)} kg`
} catch {
 return 'Inválido'
}
}

const formatMeasurement = (valueString) => {
if (!valueString) return '0.00'
try {
 const value = parseFloat(valueString)
 return isNaN(value) ? 'Inválido' : value.toFixed(2)
} catch {
 return 'Inválido'
}
}

const measurementUnit = (_name) => 'cm'

const formatBirthDate = (dateString) => {
if (!dateString) return 'Não informado'
try {
 // Tenta normalizar se for um objeto Date completo
 if (dateString instanceof Date) {
  return dateString.toLocaleDateString('pt-BR')
 }
 // Se for string, tenta formato ISO 'YYYY-MM-DDTHH:mm:ss'
 if (typeof dateString === 'string' && dateString.includes('T')) {
  return new Date(dateString).toLocaleDateString('pt-BR')
 }
 // Se for 'YYYY-MM-DD'
 const parts = dateString.split('-')
 if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
} catch { }
return dateString
}

const formatLastLogin = (dateString) => {
if (!dateString) return 'Nunca'
try {
 const d = new Date(dateString)
 if (isNaN(d.getTime())) return dateString
 // Retorna data e hora
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

const fetchUsers = async () => {
isLoading.value = true
error.value = null
try {
 // garante a inicialização da store para evitar perda de sessão no refresh
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

 // garante estrutura mínima
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

// Lógica de Adição (NOVO)
const openAddUserModal = () => { isAddModalOpen.value = true }
const closeAddModal = () => { isAddModalOpen.value = false }
const handleUserCreate = (newUser) => {
// Adiciona o novo usuário à lista e fecha o modal
users.value.unshift(newUser)
closeAddModal()
}


// Lógica de edição (Existente)
const editUser = (user) => { 
userToEdit.value = { ...user }
isEditModalOpen.value = true
}

const closeEditModal = () => {
isEditModalOpen.value = false
userToEdit.value = null
}

const handleUserUpdate = (updatedUser) => {
// Atualiza o usuário na lista principal
const index = users.value.findIndex(u => u.id === updatedUser.id)
if (index !== -1) {
 // Usamos Object.assign para manter a reatividade e mergear as propriedades
 users.value[index] = Object.assign(users.value[index], updatedUser)
}
// Se o usuário selecionado for o editado, atualiza também
if (selectedUser.value && selectedUser.value.id === updatedUser.id) {
 selectedUser.value = Object.assign(selectedUser.value, updatedUser)
}
closeEditModal()
}


// Lógica de exclusão (Existente)
const deleteUser = async (userId) => {
if (confirm('Tem certeza de que deseja excluir este usuário? Esta ação é irreversível.')) {
 
 // TODO: Implementar a chamada de API DELETE real aqui

 // SIMULAÇÃO DE SUCESSO DE EXCLUSÃO
 console.log(`Simulação: Chamada de API DELETE para excluir usuário ${userId} realizada com sucesso.`)
 users.value = users.value.filter(u => u.id !== userId)
 if (selectedUser.value?.id === userId) selectedUser.value = null
}
}

onMounted(() => { fetchUsers() })
</script>