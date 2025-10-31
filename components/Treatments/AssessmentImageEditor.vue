// /components/Treatments/AssessmentImageEditor.vue - V2.7 - CORREÇÃO DE ERRO: Alterado o texto do commit na linha 1. Removida menção literal à tag de fechamento para evitar erro de `Invalid end tag`.
<template>
<div class="space-y-6">
<h3 class="text-xl font-bold text-gray-800 flex items-center mb-4">
<i class="fas fa-camera-retro mr-2 text-indigo-600"></i> Avaliação
</h3>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div class="bg-white p-6 rounded-lg shadow-lg border space-y-4 h-full relative md:col-span-2 lg:col-span-1">
<h4 class="text-lg font-semibold text-gray-700 mb-4">Dados da Imagem</h4>

<button 
  @click="isConsiderationVisible = !isConsiderationVisible"
  :class="[
   'absolute top-6 right-6 p-2 rounded-full transition duration-150 z-10', 
   isConsiderationVisible 
    ? 'bg-red-500 text-white hover:bg-red-600' // Estado ATIVO: vermelho
    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' // Estado INATIVO: azul/indigo
  ]"
  title="Adicionar / Ocultar Considerações Internas"
>
  <i class="fas fa-pencil-alt"></i>
</button>

 <div>
 <label for="treatment-type" class="block text-sm font-medium text-gray-700">
 Tipo de Tratamento <span class="text-red-500">*</span>
 </label>
 <select
 id="treatment-type"
 v-model="selectedTreatmentId"  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
 >
 <option :value="null" disabled>-- Selecione o Tipo de Tratamento --</option>
 
 <option 
  v-for="treatment in availableTreatments" 
  :key="treatment.id" 
  :value="treatment.id"
 >
  {{ treatment.name }}
 </option>
 </select>
 <p v-if="!availableTreatments || availableTreatments.length === 0" class="mt-1 text-xs text-red-500">
 ⚠️ Nenhuma opção de tratamento disponível.
 </p>
 </div>

<div>
<label for="photo-type" class="block text-sm font-medium text-gray-700">
Local / Posição <span class="text-red-500">*</span>
</label>
<input 
id="photo-type"
v-model="photoType"
type="text"
placeholder="Ex: lateral direita, Costas, Frente"
class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
/>
</div>

 <div>
 <label for="photo-description" class="block text-sm font-medium text-gray-700">
 Observações / Descrição (Opcional)
 </label>
 <textarea
 id="photo-description"
 v-model="photoDescription"
 rows="3"
 placeholder="Anotações sobre a condição do local, métricas ou outros detalhes."
 class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
 ></textarea>
 </div>
 
  <Transition name="slide-fade">
  <div v-if="isConsiderationVisible" class="border-t pt-4">
   <label for="photo-consideration" class="block text-sm font-medium text-gray-700">
   Considerações (Notas Internas)
   </label>
   <textarea
    id="photo-consideration"
    v-model="photoConsideration"
    rows="3"
    placeholder="Notas adicionais de tratamento ou considerações internas para uso do profissional."
    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
   ></textarea>
  </div>
 </Transition>

 
<div>
<label class="block text-sm font-medium text-gray-700">
Imagem <span class="text-red-500">*</span>
</label>
<div class="mt-1 flex items-center space-x-3">
<input 
ref="fileInputRef" 
type="file" 
accept="image/*" 
@change="handleFileChange" 
class="hidden"
/>
<button 
@click="fileInputRef.click()"
:disabled="isUploading"
class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
>
<i class="fas fa-camera mr-2"></i> 
Escolher Arquivo
</button>

<span v-if="selectedFileName" class="text-sm text-gray-500 truncate">
{{ selectedFileName }}
</span>
</div>
<p v-if="uploadError" class="mt-2 text-sm text-red-600">{{ uploadError }}</p>
</div>

<div v-if="currentImageUrl" class="pt-4 border-t">
  <div class="p-3 bg-indigo-50 rounded-lg flex items-center justify-between">
   <p class="text-indigo-700 text-sm font-medium">
    Anotar: <span class="text-gray-800">{{ annotationDataJson ? 'Anotações existentes.' : 'Nenhuma anotação.' }}</span>
   </p>
   <button
    @click="openAnnotationModal"
    :disabled="isUploading"
    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
   >
    <i class="fas fa-expand-alt mr-2"></i> Abrir Anotação
   </button>
  </div>
</div>


<button 
@click="uploadPhoto"
:disabled="!isReadyForUpload"
class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
>
<i v-if="isUploading" class="fas fa-spinner fa-spin mr-2"></i>
{{ isUploading ? 'Enviando...' : 'Salvar Nova Avaliação' }}
</button>

<p v-if="uploadSuccess" class="mt-2 text-sm text-green-600 font-medium">
<i class="fas fa-check-circle mr-1"></i> Foto enviada com sucesso!
</p>
</div> <div class="hidden lg:block">
<div v-if="!currentImageUrl" class="h-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded">
 <p class="text-gray-500"><i class="fas fa-image mr-2"></i> Selecione uma imagem para a avaliação</p>
</div>
<div v-else class="h-full flex items-center justify-center bg-gray-100 border border-gray-300 rounded relative">
  <img :src="currentImageUrl" alt="Pré-visualização" class="max-h-full max-w-full object-contain p-2"/>
 <p class="absolute bottom-2 left-2 text-xs text-gray-500 bg-white bg-opacity-70 p-1 rounded">
  {{ selectedFileName }}
 </p>
</div>
</div> </div> <Transition name="modal-fade">
<div v-if="isAnnotationModalOpen" class="fixed inset-0 z-50 bg-white p-4 sm:p-6 overflow-y-auto">
 <div class="flex flex-col h-full w-full">
   <div class="flex justify-between items-center mb-4 border-b pb-3 sticky top-0 bg-white z-10">
    <h3 class="text-xl font-bold text-gray-800">
     <i class="fas fa-paint-brush mr-2 text-indigo-600"></i> Editor de Anotações em Tela Cheia
    </h3>
    <button 
     @click="isAnnotationModalOpen = false"
     class="text-gray-400 hover:text-gray-600 p-2 transition"
    >
     <i class="fas fa-times text-2xl"></i>
    </button>
   </div>

      <div v-if="currentImageUrl" class="flex flex-wrap items-center space-x-4 mb-4">
    <button @click="currentTool = 'pen'" :class="toolClass('pen')">
     <i class="fas fa-pencil-alt"></i> Caneta
    </button>
    <button @click="currentTool = 'text'" :class="toolClass('text')">
     <i class="fas fa-font"></i> Texto
    </button>
    <input type="color" v-model="penColor" class="w-8 h-8 rounded-full border-2 border-gray-300"/>
    <input type="range" v-model.number="penSize" min="1" max="50" class="w-24 h-8"/>
    <span class="text-sm text-gray-600">{{ penSize }}px</span>
    <button 
     @click="clearAnnotations"
     :disabled="isUploading"
     class="text-red-500 hover:text-red-700 text-sm disabled:opacity-50 ml-auto"
     title="Limpar todos os desenhos"
    >
     <i class="fas fa-trash-alt mr-1"></i> Limpar
    </button>
   </div>

      <div v-if="currentImageUrl" class="flex-grow min-h-0 w-full relative border rounded-lg overflow-hidden"> 
    <AnnotationEditor
     ref="annotationEditorRef"
     :key="imageKey"
     :image-url="currentImageUrl"
     :tool="currentTool"
     :pen-color="penColor"
     :text-color="penColor" 
     :pen-size="penSize"
     :text-size="penSize * 3" 
     :initial-annotation-data="annotationDataJson"
     @update:annotation-data="handleAnnotationUpdate"
     class="w-full h-full"
    />
   </div>

  </div>
</div>
</Transition>
</div>
</template>

<script setup>
// /components/Treatments/AssessmentImageEditor.vue - V2.7 - Correção do erro de sintaxe. Alterado texto do cabeçalho.
import { ref, computed, watch, nextTick } from "vue";
import { useAuthStore } from "~/stores/auth";
import AnnotationEditor from "~/components/Shared/AnnotationEditor.vue"; 

// Propriedades para comunicação
const props = defineProps({
userId: { type: Number, required: true },
availableTreatments: {
 type: Array,
 default: () => [],
}
});

// Emits para notificar o componente pai (que geralmente é a página [id].vue)
const emit = defineEmits(['evaluationSaved']);

const authStore = useAuthStore();
const fileInputRef = ref(null);
const annotationEditorRef = ref(null);

// --- Estado de Upload ---
const photoType = ref('');
const selectedFile = ref(null);
const selectedFileName = ref('');

const selectedTreatmentId = ref(null); 
const photoDescription = ref(''); 
const photoConsideration = ref(''); 
const isConsiderationVisible = ref(false); 

// --- Estado de Anotação ---
const annotationDataJson = ref(null); 
const currentTool = ref('pen'); 
const penColor = ref('#FF0000');
const penSize = ref(15);
const isAnnotationModalOpen = ref(false); 

// --- Estado da Imagem e Processo ---
const currentImageUrl = ref(null); 
const imageKey = ref(0); 
const isUploading = ref(false);
const uploadSuccess = ref(false);
const uploadError = ref('');

// --- Computeds ---

const isReadyForUpload = computed(() => {
// Pronto se tiver arquivo, local/posição E o TIPO de tratamento selecionado
return selectedFile.value 
&& photoType.value.trim() !== '' 
&& selectedTreatmentId.value !== null // Requer o ID do TIPO de tratamento
&& !isUploading.value;
});

const toolClass = (toolName) => ({
'bg-indigo-600 text-white': currentTool.value === toolName,
'bg-gray-200 text-gray-700 hover:bg-gray-300': currentTool.value !== toolName,
'px-3 py-1 rounded-md text-sm transition': true,
});


// --- Funções de Upload ---
const uploadPhoto = async () => {
if (!isReadyForUpload.value) return;

isUploading.value = true;
uploadError.value = '';
uploadSuccess.value = false;

if (!authStore.initialized) {
await authStore.init();
}
const token = authStore.token;

const targetUserId = props.userId;
const endpointUrl = `/api/professional/user/${targetUserId}/photos`; 

const formData = new FormData();
formData.append('photoFile', selectedFile.value);
formData.append('photoType', photoType.value.trim()); 

if (selectedTreatmentId.value !== null) {
formData.append('treatmentId', selectedTreatmentId.value.toString());
}

if (photoDescription.value.trim() !== '') {
 formData.append('description', photoDescription.value.trim());
}

if (photoConsideration.value.trim() !== '') {
 formData.append('consideration', photoConsideration.value.trim());
}

// Anotações são opcionais
if (annotationDataJson.value) {
formData.append('annotationData', annotationDataJson.value);
}

try {
await $fetch(endpointUrl, {
method: 'POST',
headers: {
Authorization: `Bearer ${token}`,
},
body: formData,
});

// Limpeza e Sucesso
uploadSuccess.value = true;
emit('evaluationSaved'); 

// Reseta o formulário
selectedFile.value = null;
selectedFileName.value = '';
photoType.value = '';
selectedTreatmentId.value = null; 
photoDescription.value = ''; 
photoConsideration.value = ''; 
isConsiderationVisible.value = false; 
annotationDataJson.value = null;
currentImageUrl.value = null;
if (fileInputRef.value) fileInputRef.value.value = '';

} catch (e) {
console.error('Erro de upload:', e);
uploadError.value = e?.data?.statusMessage || 'Falha no upload da foto. Tente novamente.';
} finally {
isUploading.value = false;
if (uploadSuccess.value) {
setTimeout(() => {
uploadSuccess.value = false;
}, 3000);
}
}
};

// --- Funções de Manipulação de Imagem/Anotação ---

const handleFileChange = (event) => {
uploadError.value = '';
uploadSuccess.value = false;

const file = event.target.files ? event.target.files[0] : null;

if (file) {
selectedFile.value = file;
selectedFileName.value = file.name;

if (currentImageUrl.value) {
URL.revokeObjectURL(currentImageUrl.value);
}
currentImageUrl.value = URL.createObjectURL(file);

nextTick(() => {
imageKey.value++; 
});

annotationDataJson.value = null;
if (isAnnotationModalOpen.value) {
isAnnotationModalOpen.value = false;
}

} else {
selectedFile.value = null;
selectedFileName.value = '';
if (currentImageUrl.value) {
URL.revokeObjectURL(currentImageUrl.value);
currentImageUrl.value = null;
}
isAnnotationModalOpen.value = false; 
}
};

const openAnnotationModal = () => {
if (currentImageUrl.value) {
 isAnnotationModalOpen.value = true;
}
}

watch(currentImageUrl, (newUrl, oldUrl) => {
if (oldUrl && oldUrl.startsWith('blob:')) {
URL.revokeObjectURL(oldUrl);
}
});

const handleAnnotationUpdate = (dataJson) => {
annotationDataJson.value = dataJson;
};

const clearAnnotations = () => {
if (annotationEditorRef.value?.clearAnnotations) {
annotationEditorRef.value.clearAnnotations();
annotationDataJson.value = null; 
}
}
</script>

<style scoped>
/* Estilo para a transição (slide/fade) do campo 'Considerações' */
.slide-fade-enter-active,
.slide-fade-leave-active {
transition: all 0.3s ease-out;
overflow: hidden;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
opacity: 0;
max-height: 0; 
padding-top: 0;
padding-bottom: 0;
}

.slide-fade-enter-active {
 max-height: 500px; 
}

/* Estilo para a transição (fade) do Modal Fullscreen */
.modal-fade-enter-active,
.modal-fade-leave-active {
 transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
 opacity: 0;
}
</style>