// /pages/editor/[id].vue - V1.23 - Roteamento de Retorno Dinâmico Corrigido
<template>
<NuxtLayout>
 <div>
  <Header pageTitle="Editor de Imagens" />

  <div class="min-h-screen bg-gray-100 p-4 sm:p-8">
   <div class="max-w-7xl mx-auto bg-white shadow-xl rounded-lg p-6">
        <NuxtLink
     :to="returnPath"
     class="text-indigo-600 hover:text-indigo-800 mb-6 inline-block font-semibold"
    >
          ← Voltar para {{ returnPathDisplay }}
    </NuxtLink>

    <div v-if="error" class="text-red-600 p-4 border border-red-200 rounded bg-red-50">
     <i class="fas fa-exclamation-triangle mr-2"></i> {{ error }}
    </div>

    <div v-else-if="isLoading" class="text-center p-10">
     <i class="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
     <p class="mt-2 text-gray-600">Carregando imagem e ferramentas...</p>
    </div>

    <ClientOnly v-else>
     <ImageEditorComponent 
      :initial-image-url="image.url"
      :image-type="imageType"
      :initial-is-private="image.isPrivate"
      @saveEditedImage="handleSaveEditedExistingImage"
      @error="handleEditorError"
     />
    </ClientOnly>
   </div>
  </div>

  <Teleport to="body">
   <div
    v-if="saveSuccess"
    class="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg transition-opacity duration-300"
   >
    Alterações salvas com sucesso!
   </div>
  </Teleport>
 </div>
</NuxtLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Header from '~/components/Header.vue'
import ImageEditorComponent from '~/components/ImageEditorComponent.vue'
import { useAuthStore } from '~/stores/auth'
import { useRoute, useRouter, useRuntimeConfig } from '#app'

definePageMeta({ middleware: ['auth'] })

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const image = ref(null)
const isLoading = ref(true)
const error = ref(null)
const isSaving = ref(false)
const saveSuccess = ref(false)

const imageId = route.params.id
const imageType = route.query.type
const recordId = route.query.recordId 
// 🚨 NOVO: Obtém a origem (from=profile, from=dashboard, ou undefined)
const origin = ref(route.query.from) 

// 🛑 CORREÇÃO: Propriedades computadas que definem o caminho e o texto
const returnPath = computed(() => {
    // Se a origem for 'profile', retorna /profile. Caso contrário, retorna /dashboard.
    return origin.value === 'profile' ? '/profile' : '/dashboard'
})

const returnPathDisplay = computed(() => {
    // Define o texto do link
    return origin.value === 'profile' ? 'o Perfil' : 'o Dashboard'
})


const fetchImage = async () => {
    // ... (função inalterada) ...
    const token = authStore.token
    if (!token) {
        error.value = 'Token ausente.'
        isLoading.value = false
        return
    }
    try {
        const resp = await $fetch(`/api/records/image/${imageId}`, {
            baseURL: config.public.apiBaseUrl,
            query: { 
                type: imageType,
                recordId: recordId 
            },
            headers: { Authorization: `Bearer ${token}` }
        })
        image.value = resp
    } catch (e) {
        error.value = e?.data?.message || e?.message || 'Erro ao carregar imagem.'
    } finally {
        isLoading.value = false
    }
}

const handleEditorError = (msg) => {
    error.value = `Erro no editor: ${msg}`
}

const handleSaveEditedExistingImage = async ({ editedBlob, originalBlob, isPrivate, type, isEdited }) => {
  try {
    isSaving.value = true
    const token = authStore.token
    if (!token) throw new Error('Token ausente.')

    const formData = new FormData()
    
    formData.append('recordId', image.value?.recordId || '') 
    formData.append('fileId', image.value?.fileId || '')
    formData.append('originalUrl', image.value?.url || '')
    
    formData.append('isPrivate', isPrivate ? 'true' : 'false')
    formData.append('isEdited', isEdited ? 'true' : 'false') 
    formData.append('imageType', type) 
    
    formData.append('editedFile', editedBlob, 'edited.png') 
    formData.append('originalFile', originalBlob, 'original.png') 


    await $fetch('/api/images/edit_upload', {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
      baseURL: config.public.apiBaseUrl
    })

    saveSuccess.value = true
    error.value = null; 
    // ✅ CORREÇÃO: Usando a propriedade computada returnPath para redirecionamento
    setTimeout(() => router.push(returnPath.value), 1000) 

  } catch (err) {
    console.error("Erro ao salvar edição:", err);
    error.value = err?.data?.message || err.message || 'Erro ao salvar edição.'
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  await fetchImage()
})
</script>