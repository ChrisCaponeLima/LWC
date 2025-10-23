// /components/Registro/ImageEditor.vue - V2.6 - Garante o envio de Blob com tamanho > 0 e resolve 404.
<template>
<div class="min-h-screen bg-gray-100 p-4 sm:p-8">
<div class="max-w-7xl mx-auto bg-white shadow-xl rounded-lg p-6">

<button
 @click="handleClose"
 class="text-gray-600 hover:text-gray-800 mb-6 inline-block font-semibold"
>
 ← Voltar ao Formulário
</button>

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
 @click="removeTempFileHandler(file.tempId, file.type)"
 class="p-2 text-red-600 hover:text-red-800 transition rounded-md"
 title="Remover"
 >
 <i class="fas fa-trash-alt"></i>
 </button>
 </li>
 </ul>
 <p v-if="allTempFiles.length === 0" class="text-center text-gray-400">Nenhuma imagem temporária. Adicione uma acima.</p>

 <div class="flex justify-end mt-6">
 <button
 type="button"
 @click="handleClose"
 class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors duration-200 flex items-center"
 >
 <i class="fas fa-arrow-right mr-2"></i> Continuar
 </button>
 </div>

</div>

<div v-else>
 
 <div class="flex justify-between items-center mb-6">
 <button
 type="button"
 @click="cancelEdit"
 class="text-red-600 hover:text-red-800 font-semibold"
 >
 ← Cancelar Edição
 </button>

 <button
 type="button"
 @click="handleDownloadImage"
 class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200 flex items-center shadow"
 >
 <i class="fas fa-download mr-2"></i> Baixar Imagem
 </button>
 </div>

 <ClientOnly>
 <ImageEditorComponent 
 ref="imageEditorRef"
 :initial-image-url="editingFileUrl"
 :image-type="imageType"
 :initial-is-private="false" 
 @saveEditedImage="handleSaveEditedNewImage"
 @error="handleEditorError"
 @rotate="handleImageRotate"
 />
 </ClientOnly>
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
// NÃO NECESSÁRIO, REMOVIDO PARA EVITAR BUGS DE CONFIGURAÇÃO: import { useRuntimeConfig } from '#app';
import ImageEditorComponent from '~/components/ImageEditorComponent.vue';
import { useTempFiles, addTempFile, removeTempFile } from '~/composables/useTempFiles';

const emit = defineEmits(['close']);

const authStore = useAuthStore();

// MUDANÇA: USAR COMPOSABLE PARA GERENCIAR O ESTADO DA SESSÃO
const { allTempFiles, syncFromSession } = useTempFiles();

const imageEditorRef = ref<any>(null); 
const fileInput = ref<HTMLInputElement | null>(null); 

// Estado de Edição
const isEditing = ref(false);
const editingFile = ref<File | null>(null); 
const editingFileUrl = ref<string | null>(null); 
const uploadError = ref<string | null>(null);
const saveSuccess = ref<boolean>(false);
const imageType = ref<'photo' | 'forma'>('photo'); 


// Inicia o processo de edição
const handleFileSelect = (event: Event) => {
  uploadError.value = null;
  const target = event.target as HTMLInputElement;
  const file = target.files ? target.files[0] : null;

  if (!file) return;

  // 1. Guarda o arquivo original
  editingFile.value = file;
  // 2. Cria URL para o editor
  editingFileUrl.value = URL.createObjectURL(file);
  // 3. Entra no modo de edição
  isEditing.value = true;

  // Limpa o input file para permitir a seleção do mesmo arquivo novamente
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const cancelEdit = () => {
  if (editingFileUrl.value) {
    URL.revokeObjectURL(editingFileUrl.value);
  }
  editingFile.value = null;
  editingFileUrl.value = null;
  isEditing.value = false;
};

// Função para chamar o método de download do componente filho
const handleDownloadImage = () => {
  if (imageEditorRef.value && imageEditorRef.value.downloadImage) {
    imageEditorRef.value.downloadImage();
  } else {
    uploadError.value = 'O editor de imagens não está pronto para download. Tente novamente.';
  }
};

const handleEditorError = (msg: string) => {
  uploadError.value = `Erro no editor: ${msg}`;
  cancelEdit();
};

const handleImageRotate = (newRotation: number) => {
  console.log('Imagem rotacionada para:', newRotation, 'graus');
};

// Lógica de salvamento para NOVA IMAGEM (PRÉ-UPLOAD)
const handleSaveEditedNewImage = async ({ blob, isPrivate, type }: { blob: Blob, isPrivate: boolean, type: 'photo' | 'forma' }) => {
  try {
        // 🚨 VERIFICAÇÃO CRÍTICA: Se o Blob não existir ou tiver tamanho zero, aborta e mostra erro.
        if (!blob || blob.size === 0) {
            uploadError.value = 'Erro: O editor não gerou um arquivo de imagem (Blob vazio). Por favor, tente novamente.';
            cancelEdit();
            return;
        }

    if (isEditing.value) {
      uploadError.value = null;

      const token = authStore.token;
      if (!token) throw new Error('Token ausente.');

      const formData = new FormData();

      // Mantendo o camelCase padrão do frontend para consistência
      formData.append('type', type); 
      formData.append('isPrivate', isPrivate ? 'true' : 'false');
      formData.append('editedFile', blob, 'edited.png');

      // Chama diretamente a rota do Nuxt Server: /api/images/pre_upload
      const response = await $fetch<{ fileId: string, type: string }>('/api/images/pre_upload', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      // O backend deve retornar o ID temporário
      const tempFileId = response.fileId; 

      const newFileObject = { 
        tempId: tempFileId, 
        isPrivate: isPrivate, 
        type: type 
      };

      // Usa a função atômica do composável para adicionar e salvar na sessão
      addTempFile(newFileObject);
      syncFromSession();

      saveSuccess.value = true;
      setTimeout(() => saveSuccess.value = false, 2000);
    }
  } catch (err: any) {
    const errorMessage = err?.response?._data?.details || err?.message || 'Erro desconhecido ao salvar a imagem temporária (Pré-Upload).';
    uploadError.value = `Falha no Pré-Upload (Erro de rede ou servidor): ${errorMessage}`;
  } finally {
    cancelEdit(); 
  }
};

const removeTempFileHandler = (tempId: string, type: 'photo' | 'forma') => {
  // Usa a função atômica do composável para remover e salvar na sessão
  removeTempFile(tempId, type);
  syncFromSession();
};

const handleClose = () => {
  emit('close'); 
};

onMounted(() => {
  // Força a sincronização na montagem
  syncFromSession();
});
</script>