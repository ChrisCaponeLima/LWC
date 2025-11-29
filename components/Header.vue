// /components/Header.vue - V18.0 - Correção de Alinhamento com Posicionamento Absoluto e Ajuste de Fluxo.
<template>
<header class="flex items-center justify-between p-4 shadow-md bg-[#222B45] relative">
 <div class="flex items-center space-x-3">
 <NuxtLink to="/dashboard" class="focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg">
 <img
 src="/images/logoWLCb1.png"
 alt="Logotipo"
 class="h-12 w-12 object-contain"
 />
 </NuxtLink>
 <h1 v-if="pageTitle" class="text-2xl font-bold text-white">{{ pageTitle }}</h1>
 </div>

 	  <div class="flex items-center gap-4 relative" ref="menuContainerRef">
  
    
        <div class="flex items-center relative h-10"> 
            
            <div class="absolute right-14 top-1/2 -translate-y-1/2 z-10">
        <span
         class="font-medium transition-colors duration-300 whitespace-nowrap" 
         :class="userNameClass" 
        >
         {{ firstName }}
        </span>
            </div>
            
     
          <div class="relative inline-block ml-4">       <button @click="toggleMenu"
       :class="[
        'w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 focus:outline-none',
        userRoleClass 
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
   
            <ClientOnly>
       <div
        v-if="menuOpen"
        class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
        @mouseleave="closeAdminMenu"
        @click.stop
       >
        <ul class="py-2">
         <li>
          <button
           @click="goToProfile"
           class="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
          >
           <i class="fas fa-user mr-2"></i> Meu Perfil
          </button>
         </li>
         
         <li v-if="authStore.isProfessional || authStore.isAdmin || authStore.isOwner">
          <button
           @click="goToProfessionalSearch"
           class="w-full text-left px-4 py-2 hover:bg-gray-100 text-indigo-700 font-semibold border-t border-b my-1 border-gray-100"
          >
           <i class="fas fa-stethoscope mr-2"></i> Atendimento
          </button>
         </li>
   
         <li>
          <button
           @click="goToChat"
           class="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
          >
           <i class="fas fa-comments mr-2"></i> Mensagens
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
           <div>
            <i class="fas fa-cog mr-2"></i> Administrar
           </div>
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
           <li>
            <button
            @click="goToReportAdmin"
            class="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 font-semibold border-t my-1 border-gray-100"
            >
            <i class="fas fa-chart-line mr-2"></i> Relatórios Financeiros
            </button>
           </li>
           <li>
            <button
             @click="goToTreatmentAdmin"
             class="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
            >
             Gerenciar Tratamentos
            </button>
           </li>
           <li>
            <button
             @click="goToProductAdmin"
             class="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
            >
             Gerenciar Produtos
            </button>
           </li>
          </ul>
         </li>
   
         <li>
          <button
           @click="logout"
           class="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 font-semibold border-t mt-1 pt-3"
          >
           <i class="fas fa-sign-out-alt mr-2"></i> Sair
          </button>
         </li>
        </ul>
       </div>
      </ClientOnly>
     </div>
    </div>
 </div>
</header>
</template>

<script setup>
// /components/Header.vue - V18.0 - Correção de Alinhamento com Posicionamento Absoluto e Ajuste de Fluxo.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { navigateTo } from '#app'

const props = defineProps({
pageTitle: { type: String, default: '' }
})

const authStore = useAuthStore()
const menuOpen = ref(false)
const adminSubMenuOpen = ref(false)
const menuContainerRef = ref(null) 

// 1. SSR SAFE: REF PARA O ESTILO DA BORDA
const userRoleClass = ref('border border-gray-300'); 

const computedRoleClass = computed(() => {
    if (authStore.isOwner) return 'ring-2 ring-red-400';
    if (authStore.isAdmin) return 'border-2 border-yellow-400';
    return 'border border-gray-300';
});

// 2. SSR SAFE: REF PARA A COR DO NOME
const userNameClass = ref('text-white'); 

const computedNameClass = computed(() => {
    if (authStore.isOwner) return 'text-red-400';
    if (authStore.isAdmin) return 'text-yellow-400';
    return 'text-white';
});

const firstName = computed(() => {
if (authStore.user?.username) return authStore.user.username.split(' ')[0]
return 'Usuário'
})

const initials = computed(() => {
if (authStore.user?.username) return authStore.user.username.charAt(0).toUpperCase()
return 'U'
})

const handleImgError = () => {
if (authStore.user) authStore.user.photo_perfil_url = null
}

const toggleMenu = () => {
menuOpen.value = !menuOpen.value
if (!menuOpen.value) adminSubMenuOpen.value = false
}
const openAdminMenu = () => (adminSubMenuOpen.value = true)
const closeAdminMenu = () => (adminSubMenuOpen.value = false)

const closeMenu = (event) => {
if (menuOpen.value && menuContainerRef.value && !menuContainerRef.value.contains(event.target)) {
menuOpen.value = false
adminSubMenuOpen.value = false
}
}

onMounted(() => {
    document.addEventListener('click', closeMenu);
    
    // FORÇA A AVALIAÇÃO DAS CLASSES APÓS A HIDRATAÇÃO
    userRoleClass.value = computedRoleClass.value; 
    userNameClass.value = computedNameClass.value; 
});
onBeforeUnmount(() => document.removeEventListener('click', closeMenu))

// --- Funções de Navegação (mantidas) ---
const goToProfile = () => {
menuOpen.value = false
adminSubMenuOpen.value = false
navigateTo('/profile')
}

const goToChat = () => {
menuOpen.value = false
adminSubMenuOpen.value = false
navigateTo('/chat')
}

const goToUserAdmin = () => {
menuOpen.value = false
adminSubMenuOpen.value = false
navigateTo('/user_management')
}

const goToTreatmentAdmin = () => {
menuOpen.value = false
adminSubMenuOpen.value = false
navigateTo('/admin/treatments') 
}

const goToProductAdmin = () => {
menuOpen.value = false
adminSubMenuOpen.value = false
navigateTo('/admin/products') 
}

const goToReportAdmin = () => {
menuOpen.value = false
adminSubMenuOpen.value = false
navigateTo('/admin/reports/financial') 
}

const goToProfessionalSearch = () => {
menuOpen.value = false
adminSubMenuOpen.value = false
navigateTo('/professional/user_search')
}

const logout = () => {
authStore.logout()
menuOpen.value = false
adminSubMenuOpen.value = false
navigateTo('/login')
}
</script>