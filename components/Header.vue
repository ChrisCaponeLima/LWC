// /components/Header.vue - V1.11 - Aumento do tamanho do logotipo (h-8/w-8 para h-10/w-10) e do título (text-xl para text-2xl).
<template>
<header class="flex items-center justify-between p-4 shadow-md bg-[#222B45] relative">
 
  <div class="flex items-center space-x-3">
    <img 
      src="/images/logoWLCb1.png" 
      alt="Logotipo LWC" 
      class="h-12 w-12 object-contain"
    >
    <h1 class="text-2xl font-bold text-white">LWC</h1>
  </div>

 <div class="flex items-center gap-4 relative">
 <span 
  class="font-medium transition-colors duration-300"
  :class="authStore.isOwner ? 'text-red-400' : (authStore.isAdmin ? 'text-yellow-400' : 'text-white')"
 >
  {{ firstName }}
 </span>

 <div class="relative">
  <button @click="toggleMenu"
  :class="[
   'w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 focus:outline-none',
   authStore.isOwner ? 'ring-2 ring-red-400' : (authStore.isAdmin ? 'border-2 border-yellow-400' : 'border border-gray-300')
  ]"
  >
  <img
   v-if="authStore.user?.photo_perfil_url"
   :src="authStore.user.photo_perfil_url"
   alt="Foto de Perfil"
   class="w-full h-full object-cover"
   @error="handleImgError"
  />
  <span v-else class="text-sm font-bold text-gray-600">{{ initials }}</span>
  </button>

  <div
  v-if="menuOpen"
  class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
  @mouseleave="closeAdminMenu"
  >
  <ul class="py-2">
   <li>
   <button
    @click="goToProfile"
    class="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
   >
    Meu Perfil
   </button>
   </li>

   <li v-if="authStore.isAdmin || authStore.isOwner"
    class="relative"
    @mouseenter="openAdminMenu"
    @mouseleave="closeAdminMenu"
   >
   <div
    class="w-full px-4 py-2 flex justify-between items-center hover:bg-gray-100 text-gray-700 cursor-pointer"
   >
    Administrar
    <span class="text-gray-500">▶</span>
   </div>

   <ul
    v-if="adminSubMenuOpen"
    class="absolute top-0 right-full mr-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
   >
    <li>
    <button
     @click="goToUserAdmin"
     class="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
    >
     Administração de Usuários
    </button>
    </li>
   </ul>
   </li>

   <li>
   <button
    @click="logout"
    class="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 font-semibold"
   >
    Sair
   </button>
   </li>
  </ul>
  </div>
 </div>
 </div>
</header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { navigateTo } from '#app'

const authStore = useAuthStore()
const menuOpen = ref(false)
const adminSubMenuOpen = ref(false)

// Lógica de inicialização original V1.8 (AGORA REMOVIDA na V1.9 e V1.10)
// onMounted(async () => { ... })

const firstName = computed(() => {
if (authStore.user?.username) {
 return authStore.user.username.split(' ')[0]
}
return 'Usuário'
})

const initials = computed(() => {
if (authStore.user?.username) {
 return authStore.user.username.charAt(0).toUpperCase()
}
return 'U'
})

const handleImgError = () => {
if (authStore.user) authStore.user.photo_perfil_url = null
}

const toggleMenu = () => {
menuOpen.value = !menuOpen.value
if (!menuOpen.value) adminSubMenuOpen.value = false
}
const openAdminMenu = () => { adminSubMenuOpen.value = true }
const closeAdminMenu = () => { adminSubMenuOpen.value = false }

const closeMenu = (event) => {
const menuContainer = event.target.closest('.relative')
if (!menuContainer || !menuContainer.contains(event.target)) {
 menuOpen.value = false
 adminSubMenuOpen.value = false
}
}

onMounted(() => document.addEventListener('click', closeMenu))
onBeforeUnmount(() => document.removeEventListener('click', closeMenu))

const goToProfile = () => {
menuOpen.value = false
adminSubMenuOpen.value = false
navigateTo('/profile')
}
const goToUserAdmin = () => {
menuOpen.value = false
adminSubMenuOpen.value = false
navigateTo('/user_management')
}
const logout = () => {
authStore.logout()
menuOpen.value = false
adminSubMenuOpen.value = false
navigateTo('/login')
}
</script>