// /pages/registro/imagem.vue - V1.3 - Gerenciamento de múltiplos uploads temporários com edição individual e seletor de tipo.
<template>
  <NuxtLayout>
    <div>
      <Header pageTitle="Imagem" />

      <div class="min-h-screen bg-gray-100 p-4 sm:p-8">
        <div class="max-w-7xl mx-auto bg-white shadow-xl rounded-lg p-6">
          <NuxtLink
            to="/dashboard"
            class="text-gray-600 hover:text-gray-800 mb-6 inline-block font-semibold"
          >
            ← Voltar
          </NuxtLink>

          <div v-if="uploadError" class="p-3 bg-red-100 text-red-700 border border-red-400 rounded-md mb-4">
              {{ uploadError }}
          </div>
          
          <div v-if="!isEditing" class="max-w-4xl mx-auto space-y-6">

            <div class="border p-4 rounded-md bg-gray-50">
                <label for="imageFile" class="block text-sm font-medium text-gray-700 mb-2">Selecione uma Imagem</label>
                <input
                  type="file"
                  id="imageFile"
                  ref="fileInput"
                  @change="handleFileSelect"
                  accept="image/*"
                  class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
            </div>
            
            <div class="flex justify-center">
              <div class="inline-flex rounded-full bg-gray-200 p-1 text-sm font-medium">
                  <button
                      @click="imageType = 'photo'"
                      :class="[imageType === 'photo' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-700']"
                      class="px-4 py-2 rounded-full transition-colors duration-200"
                  >
                      Evolução
                  </button>
                  <button
                      @click="imageType = 'forma'"
                      :class="[imageType === 'forma' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-700']"
                      class="px-4 py-2 rounded-full transition-colors duration-200"
                  >
                      Forma
                  </button>
              </div>
            </div>

            <h4 class="text-lg font-semibold text-gray-800 border-b pb-2">Imagens Prontas para o Registro ({{ allTempFiles.length }})</h4>
            <ul class="space-y-3">
              <li 
                v-for="file in allTempFiles" 
                :key="file.tempId"
                class="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm"
              >
                <div class="flex items-center space-x-3">
                  <span 
                    :class="file.type === 'photo' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'"
                    class="px-3 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ file.type === 'photo' ? 'Evolução' : 'Forma' }}
                  </span>
                  <span class="text-sm text-gray-600 truncate max-w-xs">
                    ID: {{ file.tempId.substring(0, 8) }}...
                  </span>
                  <span v-if="file.isPrivate" class="text-xs text-red-500">
                    <i class="fas fa-lock"></i> Privada
                  </span>
                </div>
                
                <button
                  type="button"
                  @click="removeTempFile(file.tempId, file.type)"
                  class="p-2 text-red-600 hover:text-red-800 transition rounded-md"
                  title="Remover"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </li>
            </ul>
            <p v-if="allTempFiles.length === 0" class="text-center text-gray-400">Nenhuma imagem temporária. Adicione uma acima.</p>

          </div>

          <div v-else>
            <button
                type="button"
                @click="cancelEdit"
                class="text-red-600 hover:text-red-800 mb-6 inline-block font-semibold"
            >
                ← Cancelar Edição
            </button>
            <ImageEditorComponent 
                :initial-image-url="editingFileUrl"
                :image-type="imageType"
                :initial-is-private="false" 
                @saveEditedImage="handleSaveEditedNewImage"
                @error="handleEditorError"
            />
          </div>
          
        </div>
      </div>

      <Teleport to="body">
        <div
          v-if="saveSuccess"
          class="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg transition-opacity duration-300"
        >
            <i class="fas fa-check-circle mr-2"></i> Imagem salva temporariamente!
        </div>
      </Teleport>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from '#app';
import { useAuthStore } from '~/stores/auth';
import { useRuntimeConfig } from '#app';
import Header from '~/components/Header.vue';
import ImageEditorComponent from '~/components/ImageEditorComponent.vue';

definePageMeta({ middleware: ['auth'] });

const router = useRouter();
const authStore = useAuthStore();
const config = useRuntimeConfig();

// Estado de Edição
const isEditing = ref(false);
const editingFile = ref(null); // O arquivo Blob/File original
const editingFileUrl = ref(null); // URL Blob para o editor
const uploadError = ref(null);
const saveSuccess = ref(false);

// Estado de Tipo (Controlado pelo seletor)
const imageType = ref('photo'); // 'photo' ou 'forma'

// Armazenamento Temporário de Arquivos (Refs)
const tempPhotoFiles = ref([]); // { tempId: string, isPrivate: boolean, type: 'photo' }
const tempFormaFiles = ref([]); // { tempId: string, isPrivate: boolean, type: 'forma' }

// Computed para a lista consolidada
const allTempFiles = computed(() => [
    ...tempPhotoFiles.value,
    ...tempFormaFiles.value
]);

// Função para ler do sessionStorage e popular os refs
const loadTempFilesFromSession = () => {
    if (process.client) {
        const photoIdsRaw = sessionStorage.getItem('tempPhotoFileIds');
        const formaIdsRaw = sessionStorage.getItem('tempFormaFileIds');
        
        // Assumimos que o sessionStorage armazena uma lista de objetos { tempId, isPrivate, type }
        // Se a estrutura anterior era apenas uma lista de IDs, precisamos adaptar o DataForm.vue.
        // Pelo V2.2.11, o DataForm só enviava o array de IDs. Vamos simplificar o armazenamento aqui:
        
        const photoIds = photoIdsRaw ? JSON.parse(photoIdsRaw) : [];
        const formaIds = formaIdsRaw ? JSON.parse(formaIdsRaw) : [];
        
        // Para manter o estado 'isPrivate' visível na lista, vamos reconstruir a estrutura aqui.
        // Para simplificar a lógica de edição multi-file, o backend DEVE retornar
        // { fileId: '...', isPrivate: false, type: '...' } no pre_upload, 
        // e o DataForm V2.2.12 deve apenas pegar os IDs.
        
        // Para V1.3, vamos reconstruir a lista a partir do JSON complexo que o DataForm agora espera
        // (Lista de objetos { tempId: '...', isPrivate: true })
        
        const photoDataRaw = sessionStorage.getItem('tempPhotoFilesData');
        const formaDataRaw = sessionStorage.getItem('tempFormaFilesData');
        
        tempPhotoFiles.value = photoDataRaw ? JSON.parse(photoDataRaw) : [];
        tempFormaFiles.value = formaDataRaw ? JSON.parse(formDataRaw) : [];
    }
};

// Função para persistir os refs no sessionStorage
const saveTempFilesToSession = () => {
    if (process.client) {
        // Para o DataForm, ele só precisa dos IDs
        const photoIds = tempPhotoFiles.value.map(f => f.tempId);
        const formaIds = tempFormaFiles.value.map(f => f.tempId);
        
        sessionStorage.setItem('tempPhotoFileIds', JSON.stringify(photoIds));
        sessionStorage.setItem('tempFormaFileIds', JSON.stringify(formaIds));
        
        // Também salva a estrutura completa para re-renderização da lista
        sessionStorage.setItem('tempPhotoFilesData', JSON.stringify(tempPhotoFiles.value));
        sessionStorage.setItem('tempFormaFilesData', JSON.stringify(tempFormaFiles.value));
    }
};


// Inicia o processo de edição
const handleFileSelect = (event) => {
    uploadError.value = null;
    const file = event.target.files ? event.target.files[0] : null;

    if (!file) return;

    // 1. Guarda o arquivo original
    editingFile.value = file;
    // 2. Cria URL para o editor
    editingFileUrl.value = URL.createObjectURL(file);
    // 3. Entra no modo de edição
    isEditing.value = true;
    
    // Limpa o input file para permitir a seleção do mesmo arquivo novamente
    event.target.value = ''; 
};

const cancelEdit = () => {
    if (editingFileUrl.value) {
        URL.revokeObjectURL(editingFileUrl.value);
    }
    editingFile.value = null;
    editingFileUrl.value = null;
    isEditing.value = false;
};

const handleEditorError = (msg) => {
    uploadError.value = `Erro no editor: ${msg}`;
    cancelEdit();
};

// Lógica de salvamento para NOVA IMAGEM (PRÉ-UPLOAD)
const handleSaveEditedNewImage = async ({ blob, isPrivate, type }) => {
    try {
        if (isEditing.value) {
            uploadError.value = null;
            
            const token = authStore.token;
            if (!token) throw new Error('Token ausente.');

            const formData = new FormData();
            
            formData.append('type', type); 
            formData.append('isPrivate', isPrivate ? 'true' : 'false');
            formData.append('editedFile', blob, 'edited.png');

            // Endpoint de PRÉ-UPLOAD 
            const response = await $fetch('/api/images/pre_upload', {
                method: 'POST',
                body: formData,
                headers: { Authorization: `Bearer ${token}` },
                baseURL: config.public.apiBaseUrl
            });

            // O backend deve retornar o ID temporário
            const tempFileId = response.fileId; 
            
            const newFileObject = { 
                tempId: tempFileId, 
                isPrivate: isPrivate, 
                type: type 
            };
            
            // Adiciona à lista correta
            if (type === 'photo') {
                tempPhotoFiles.value.push(newFileObject);
            } else if (type === 'forma') {
                tempFormaFiles.value.push(newFileObject);
            }

            // Persiste na sessão e exibe sucesso
            saveTempFilesToSession();
            saveSuccess.value = true;
            setTimeout(() => saveSuccess.value = false, 2000);

        }
    } catch (err) {
        uploadError.value = err?.data?.message || err.message || 'Erro ao salvar a imagem temporária (Pré-Upload).';
    } finally {
        cancelEdit(); // Sai do modo de edição
    }
};

const removeTempFile = (tempId, type) => {
    if (type === 'photo') {
        const index = tempPhotoFiles.value.findIndex(f => f.tempId === tempId);
        if (index !== -1) tempPhotoFiles.value.splice(index, 1);
    } else if (type === 'forma') {
        const index = tempFormaFiles.value.findIndex(f => f.tempId === tempId);
        if (index !== -1) tempFormaFiles.value.splice(index, 1);
    }
    saveTempFilesToSession();
    // NOTA: A exclusão física do arquivo temporário do servidor deve ser tratada
    // por um endpoint de backend (`/api/images/delete_temp`) ou por um cron job
    // no backend que limpa arquivos não referenciados após um período.
};

onMounted(() => {
    loadTempFilesFromSession();
});
</script>