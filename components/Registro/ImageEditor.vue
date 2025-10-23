// /components/Registro/ImageEditor.vue - V2.10 - Implementa salvamento temporario de imagem original e 'Baixar Imagem'.
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

<h4 class="text-lg font-semibold text-gray-800 border-b pb-2">Imagens Prontas para envio ({{ allTempFiles.length }})</h4>
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
<i class="fas fa-check-circle mr-2"></i>  
</div>

<div
v-if="downloadSuccess"
class="fixed bottom-4 right-4 bg-yellow-500 text-white p-4 rounded shadow-lg transition-opacity duration-300"
>
<i class="fas fa-save mr-2"></i> download iniciado
</div>
</Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import ImageEditorComponent from '~/components/ImageEditorComponent.vue';
import { useTempFiles, addTempFile, removeTempFile } from '~/composables/useTempFiles';

const emit = defineEmits(['close']);

const authStore = useAuthStore();

// Usando o composable para gerenciar o estado da sessão
const { allTempFiles, syncFromSession } = useTempFiles();

const imageEditorRef = ref<any>(null); 
const fileInput = ref<HTMLInputElement | null>(null); 

// Estado de Edição
const isEditing = ref(false);
const editingFile = ref<File | null>(null); 
const editingFileUrl = ref<string | null>(null); 
const uploadError = ref<string | null>(null);
const saveSuccess = ref<boolean>(false); // Para o botão "Continuar"
const downloadSuccess = ref<boolean>(false); // Para o botão "Baixar Imagem"
const imageType = ref<'photo' | 'forma'>('photo'); 

/**
 * Função utilitária para chamar a API de salvamento permanente.
 * @param editedBlob Blob da imagem editada.
 * @param originalBlob Blob da imagem original (rotacionada).
 * @param isPrivate Se a imagem é privada.
 * @param type Tipo da imagem ('photo' ou 'forma').
 * @returns Retorna o ID do registro salvo (ID da tabela `edited`).
 */
const permanentSaveApiCall = async (editedBlob: Blob, originalBlob: Blob, isPrivate: boolean, type: 'photo' | 'forma'): Promise<{ id: string, type: string, fileId: string }> => {
    const token = authStore.token;
    if (!token) throw new Error('Token de autenticação ausente.');

    const formData = new FormData();
    formData.append('type', type); 
    formData.append('isPrivate', isPrivate ? 'true' : 'false');
    // Renomeando para corresponder aos campos da tabela edited (edited_url e original_url)
    formData.append('editedFile', editedBlob, 'edited.png');
    formData.append('originalFile', originalBlob, 'original.png');

    // Endpoint simulado para salvar permanentemente e retornar o ID da tabela `edited`
    // No seu backend, esta rota deve: salvar os blobs no storage e registrar edited_url, original_url na tabela `edited`.
    const response = await $fetch<{ id: string, type: string, fileId: string }>('/api/images/permanent_save', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
    });

    return response;
};


const handleFileSelect = (event: Event) => {
 uploadError.value = null;
 const target = event.target as HTMLInputElement;
 const file = target.files ? target.files[0] : null;

 if (!file) return;

 editingFile.value = file;
 editingFileUrl.value = URL.createObjectURL(file);
 isEditing.value = true;

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

// **FLUXO 2: "Baixar Imagem" (Salva Permanentemente e Faz o Download)**
const handleDownloadImage = async () => {
 uploadError.value = null;
 if (!imageEditorRef.value || !imageEditorRef.value.generateBlobs) {
  uploadError.value = 'O editor de imagens não está pronto. Tente novamente.';
  return;
 }

 try {
  // 1. Gera os blobs necessários
  const { editedBlob, originalBlob } = await imageEditorRef.value.generateBlobs();
    // Acessa o ref exposto 'isPrivateLocal' do componente filho
    const isPrivate = imageEditorRef.value.isPrivateLocal.value; 

  // 2. SALVAMENTO PERMANENTE na tabela 'edited' (não adiciona à lista temporária)
  await permanentSaveApiCall(editedBlob, originalBlob, isPrivate, imageType.value);

  // 3. Executa o download local
  imageEditorRef.value.downloadEditedImage();

  // 4. Feedback visual
  downloadSuccess.value = true;
  setTimeout(() => downloadSuccess.value = false, 3000);

 } catch (err: any) {
  const errorMessage = err?.response?._data?.details || err?.message || 'Erro desconhecido ao executar o download.';
  uploadError.value = `Falha no Download: ${errorMessage}`;
 }
};

const handleEditorError = (msg: string) => {
 uploadError.value = `Erro no editor: ${msg}`;
 cancelEdit();
};

const handleImageRotate = (newRotation: number) => {
 console.log('Imagem rotacionada para:', newRotation, 'graus');
};

// **FLUXO 1: "Continuar" (Salva Permanentemente e Adiciona à Lista Temporária)**
const handleSaveEditedNewImage = async ({ editedBlob, originalBlob, isPrivate, type }: { editedBlob: Blob, originalBlob: Blob, isPrivate: boolean, type: 'photo' | 'forma' }) => {
 try {
    if (!editedBlob || editedBlob.size === 0 || !originalBlob || originalBlob.size === 0) {
      uploadError.value = 'Erro: O editor não gerou os arquivos de imagem (Blob vazio). Por favor, tente novamente.';
      cancelEdit();
      return;
    }

  if (isEditing.value) {
   uploadError.value = null;

   // 1. SALVAMENTO PERMANENTE na tabela 'edited'
   const response = await permanentSaveApiCall(editedBlob, originalBlob, isPrivate, type);

   // 2. Adiciona o ID do registro permanente à lista temporária (allTempFiles)
   // O ID temporário agora é o ID do registro na tabela `edited`
   const tempFileId = response.id; 

   const newFileObject = { 
    tempId: tempFileId.toString(), 
    isPrivate: isPrivate, 
    type: type 
   };

   addTempFile(newFileObject);
   syncFromSession(); 

   saveSuccess.value = true;
   setTimeout(() => saveSuccess.value = false, 2000);
  }
 } catch (err: any) {
  const errorMessage = err?.response?._data?.details || err?.message || 'Erro desconhecido ao executar a ação (Continuar).';
  uploadError.value = `Falha adicionando efeitos: ${errorMessage}`;
 } finally {
  cancelEdit(); 
 }
};

const removeTempFileHandler = (tempId: string, type: 'photo' | 'forma') => {
 removeTempFile(tempId, type);
 syncFromSession();
};

const handleClose = () => {
  syncFromSession(); 
 emit('close'); 
};

onMounted(() => {
 syncFromSession();
});
</script>