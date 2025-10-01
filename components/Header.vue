<template>
  <header class="flex items-center justify-between p-4 shadow-md bg-white relative">
    <h1 class="text-xl font-bold text-gray-800">LWC</h1>

    <div class="flex items-center gap-4 relative">
      <!-- Nome do usuário -->
      <span class="font-medium text-gray-700">
        {{ firstName }}
      </span>

      <!-- Foto de Perfil com Dropdown -->
      <div class="relative">
        <button @click="toggleMenu" class="w-10 h-10 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center bg-gray-200 focus:outline-none">
          <img
            v-if="authStore.user?.photo_perfil_url"
            :src="authStore.user.photo_perfil_url"
            alt="Foto de Perfil"
            class="w-full h-full object-cover"
            @error="handleImgError"
          />
          <span v-else class="text-sm font-bold text-gray-600">{{ initials }}</span>
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="menuOpen"
          class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
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

            <!-- Se for admin, mostra submenu -->
            <li v-if="authStore.user?.role === 'admin'" class="relative group">
              <div
                class="w-full px-4 py-2 flex justify-between items-center hover:bg-gray-100 text-gray-700 cursor-pointer"
              >
                Administrar
                <span class="text-gray-500">▶</span>
              </div>
              <!-- Submenu -->
              <ul
                class="absolute top-0 left-full ml-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block"
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { navigateTo } from '#app'

const authStore = useAuthStore()
const menuOpen = ref(false)

// Somente o primeiro nome
const firstName = computed(() => {
  if (authStore.user?.username) {
    return authStore.user.username.split(' ')[0]
  }
  return 'Usuário'
})

// Iniciais para fallback
const initials = computed(() => {
  if (authStore.user?.username) {
    return authStore.user.username.charAt(0).toUpperCase()
  }
  return 'U'
})

const handleImgError = () => {
  if (authStore.user) {
    authStore.user.photo_perfil_url = ''
  }
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const closeMenu = (event) => {
  if (!event.target.closest('.relative')) {
    menuOpen.value = false
  }
}

// Fecha menu ao clicar fora
onMounted(() => {
  document.addEventListener('click', closeMenu)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenu)
})

// Navegação
const goToProfile = () => {
  menuOpen.value = false
  navigateTo('/profile')
}

const goToUserAdmin = () => {
  menuOpen.value = false
  navigateTo('/admin/users')
}

const logout = () => {
  authStore.logout()
  menuOpen.value = false
  navigateTo('/login')
}
</script>
