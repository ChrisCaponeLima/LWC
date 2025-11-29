// /components/ProfileForm.vue - V4.2 - Implementação da compressão client-side (imageCompressor) e da funcionalidade de exclusão de foto.
<template>
<div class="bg-white p-6 rounded-lg shadow-xl mt-6">
 <h3 class="text-xl font-bold mb-4 text-gray-800">{{ isEdit ? 'Editar Perfil' : 'Detalhes do Perfil' }}</h3>
 
 <div v-if="isEdit" class="mb-8 p-4 border rounded-lg bg-gray-50 flex flex-col items-center">
 <h4 class="text-lg font-bold mb-3 text-gray-800">Foto de Perfil</h4>
 
 <div class="w-32 h-32 mx-auto rounded-full overflow-hidden border border-gray-300 mb-3 relative">
  <img
  v-if="photoPreviewUrl"
  :src="photoPreviewUrl"
  alt="Foto de Perfil Atual"
  class="w-full h-full object-cover"
  />
    <div v-else class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-3xl font-bold">
        {{ initials }}
    </div>
 </div>

 <input 
  type="file" 
  ref="photoInput"
  @change="handleFileChange"
  accept="image/*"
  class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none p-1 mb-3"
 >

 <div v-if="photoSubmissionError" class="p-2 bg-red-100 text-red-700 border border-red-400 rounded-md w-full text-sm text-center">
  {{ photoSubmissionError }}
 </div>
 <div v-if="photoSubmissionSuccess" class="p-2 bg-green-100 text-green-700 border border-green-400 rounded-md w-full text-sm text-center">
  {{ photoSubmissionSuccess }}
 </div>

    <div class="flex flex-row gap-2 mt-2 w-full">
        <button
            v-if="!selectedFile && props.initialData.photo_perfil_url"
            type="button"
            @click="removePhoto"
            :disabled="isPhotoSubmitting"
            class="px-4 py-2 bg-red-500 text-white rounded-md font-bold hover:bg-red-600 disabled:opacity-50 transition duration-150 flex-1 text-sm"
        >
            <i class="fas fa-trash-alt mr-1"></i> {{ isPhotoSubmitting ? 'Removendo...' : 'Remover Foto' }}
        </button>

        <button
            type="button"
            @click="submitPhotoChange"
            :disabled="isPhotoSubmitting || !selectedFile"
            :class="[
                'px-6 py-2 rounded-md font-bold transition duration-150',
                {
                    'bg-blue-500 text-white hover:bg-blue-600': selectedFile,
                    'bg-gray-300 text-gray-500 cursor-not-allowed': !selectedFile,
                    'flex-1': props.initialData.photo_perfil_url // Ocupa espaço total se não houver botão de remover
                }
            ]"
        >
            {{ isPhotoSubmitting ? 'Enviando...' : 'Salvar Nova Foto' }}
        </button>
    </div>
 </div>
 <form @submit.prevent="submitProfile" class="space-y-4 mb-8">
 
 <div>
  <label for="apelido" class="block text-sm font-medium text-gray-700 mb-1">
  Apelido
  <span 
   @mouseover="showTooltip = true" 
   @mouseleave="showTooltip = false"
   @focus="showTooltip = true"
   @blur="showTooltip = false"
   class="ml-2 text-indigo-500 cursor-help relative"
   tabindex="0"
  >
   <i class="fas fa-info-circle"></i>
   <div 
   v-if="showTooltip" 
   class="absolute z-10 w-64 p-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg top-full right-0 mt-1 pointer-events-none"
   >
   O apelido ajuda a **preservar sua identidade nas postagens públicas**, caso não queira se identificar.
   </div>
  </span>
  </label>
  <input 
  type="text" 
  id="apelido" 
  v-model="formData.apelido" 
  :disabled="isSubmitting || !isEdit"
  placeholder="Seu nome público"
  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
  />
 </div>

 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
  <label for="username" class="block text-sm font-medium text-gray-700">Nome de Usuário</label>
  <input 
   type="text" 
   id="username" 
   v-model="formData.username" 
   required
   :disabled="isSubmitting || !isEdit"
   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
  />
  </div>
  <div>
  <label for="email" class="block text-sm font-medium text-gray-700">E-mail</label>
  <input 
   type="email" 
   id="email" 
   v-model="formData.email" 
   required
   :disabled="isSubmitting || !isEdit"
   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
  />
  </div>
      <div>
  <label for="phone" class="block text-sm font-medium text-gray-700">Telefone</label>
  <input 
   type="tel" 
   id="phone" 
   v-model="formData.phone" 
   placeholder="(xx) xxxxx-xxxx"
   :disabled="isSubmitting || !isEdit"
   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
  />
  </div>
      <div>
  <label for="birthdate" class="block text-sm font-medium text-gray-700">Data de Nascimento</label>
  <input 
   type="date" 
   id="birthdate" 
   v-model="formData.birthdate" 
   :disabled="isSubmitting || !isEdit"
   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
  />
  </div>
  <div>
  <label for="sexo" class="block text-sm font-medium text-gray-700">Sexo</label>
  <select 
   id="sexo" 
   v-model="formData.sexo" 
   :disabled="isSubmitting || !isEdit"
   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
  >
   <option value="M">Masculino</option>
   <option value="F">Feminino</option>
   <option value="O">Outro</option>
  </select>
  </div>
 </div>

 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
  <label for="initialWeight" class="block text-sm font-medium text-gray-700">Peso Inicial (kg)</label>
  <input 
   type="text" 
   id="initialWeight" 
   :value="formData.initialWeight" 
   disabled 
   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-gray-100 cursor-not-allowed"
  />
  </div>
  <div>
  <label for="heightCm" class="block text-sm font-medium text-gray-700">Altura (cm)</label>
  <input 
   type="text" 
   id="heightCm" 
   :value="formData.heightCm" 
   disabled 
   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-gray-100 cursor-not-allowed"
  />
  </div>
 </div>

 <div v-if="submissionError" class="p-3 bg-red-100 text-red-700 border border-red-400 rounded-md">
  {{ submissionError }}
 </div>

 <div class="flex gap-4 pt-2" v-if="isEdit">
  <button 
  type="button" 
  @click="emit('cancel')"
  class="w-1/3 px-4 py-3 bg-gray-300 text-gray-700 rounded-md font-bold hover:bg-gray-400 transition duration-150"
  >
  Cancelar
  </button>
  <button 
  type="submit" 
  :disabled="isSubmitting"
  class="w-2/3 px-4 py-3 bg-btn-principal text-btn-font-principal rounded-md font-bold hover:opacity-80 disabled:opacity-50 transition duration-150"
  >
  {{ isSubmitting ? 'Salvando...' : 'Salvar Alterações Pessoais' }}
  </button>
 </div>
 </form>

 <div v-if="isEdit" class="pt-6 border-t mt-6">
 <h4 class="text-lg font-bold mb-4 text-gray-800">Alterar Senha</h4>
 <form @submit.prevent="submitPasswordChange" class="space-y-4">
  <div>
  <label for="currentPassword" class="block text-sm font-medium text-gray-700">Senha Atual</label>
  <input 
   type="password" 
   id="currentPassword" 
   v-model="passwordForm.currentPassword" 
   required
   :disabled="isPasswordSubmitting"
   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border"
  />
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
   <label for="newPassword" class="block text-sm font-medium text-gray-700">Nova Senha</label>
   <input 
   type="password" 
   id="newPassword" 
   v-model="passwordForm.newPassword" 
   required
   :disabled="isPasswordSubmitting"
   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border"
   />
  </div>
  <div>
   <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
   <input 
   type="password" 
   id="confirmPassword" 
   v-model="passwordForm.confirmPassword" 
   required
   :disabled="isPasswordSubmitting"
   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border"
   />
  </div>
  </div>

  <div v-if="passwordSubmissionError" class="p-3 bg-red-100 text-red-700 border border-red-400 rounded-md">
  {{ passwordSubmissionError }}
  </div>
  <div v-if="passwordSubmissionSuccess" class="p-3 bg-green-100 text-green-700 border border-green-400 rounded-md">
  {{ passwordSubmissionSuccess }}
  </div>

  <button 
  type="submit" 
  :disabled="isPasswordSubmitting"
  class="w-full px-4 py-3 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 disabled:opacity-50 transition duration-150"
  >
  {{ isPasswordSubmitting ? 'Alterando...' : 'Alterar Senha' }}
  </button>
 </form>
 </div>
 </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed, nextTick } from 'vue';
import { useAuthStore } from '~/stores/auth';
// A função compressImage é auto-importada de ~/utils/imageCompressor.ts
// Não é necessário importá-la explicitamente aqui.

const emit = defineEmits(['profileUpdated', 'cancel']);

// Define uma interface para tipar os dados iniciais
interface UserProfileData {
 username: string;
 apelido: string | null;
 email: string;
 birthdate: string | null;
 sexo: 'M' | 'F' | 'O';
 initialWeight: number | null;
 heightCm: number | null;
 photo_perfil_url: string | null;
 phone: string | null; 
}

const props = defineProps<{
initialData: UserProfileData; 
isEdit: boolean;
}>();

const authStore = useAuthStore();

// --- ESTADO DA FOTO DE PERFIL ---
const photoInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isPhotoSubmitting = ref(false);
const photoSubmissionError = ref<string | null>(null);
const photoSubmissionSuccess = ref<string | null>(null);
const photoPreviewUrl = ref<string | null>(props.initialData.photo_perfil_url);

const initials = computed(() => {
    const name = props.initialData.apelido || props.initialData.username;
    if (name) {
        return name.charAt(0).toUpperCase();
    }
    return 'U';
});

watch(() => props.initialData.photo_perfil_url, (newUrl) => {
// Mantém a foto de perfil do estado inicial como fallback
photoPreviewUrl.value = newUrl;
});


const handleFileChange = (event: Event) => {
const target = event.target as HTMLInputElement;
if (target.files && target.files.length > 0) {
 const file = target.files[0];
 selectedFile.value = file;
 
 // Cria a URL de preview para visualização imediata no frontend
 photoPreviewUrl.value = URL.createObjectURL(file); 
 photoSubmissionError.value = null;
 photoSubmissionSuccess.value = null;
} else {
 selectedFile.value = null;
 // Volta para a foto original se o arquivo for cancelado
 photoPreviewUrl.value = props.initialData.photo_perfil_url; 
}
};

const submitPhotoChange = async () => {
    if (!selectedFile.value) {
        photoSubmissionError.value = 'Selecione um arquivo de imagem para enviar.';
        return;
    }
    
    photoSubmissionError.value = null;
    photoSubmissionSuccess.value = null;
    isPhotoSubmitting.value = true;

    try {
        const token = authStore.token;
        if (!token) { throw new Error('Token de autenticação não encontrado.'); }

        // 🟢 NOVIDADE 1: Compressão Client-Side antes do upload
        // Usa a função auto-importada, com dimensão máxima de 1200px e qualidade 75%
        const compressedFile = await compressImage(selectedFile.value, 1200, 0.75); 

        const formData = new FormData();
        // O campo 'profile_photo' deve coincidir com o esperado pela API (photo.put.ts)
        formData.append('profile_photo', compressedFile, compressedFile.name);

        const response = await fetch('/api/profile/photo', { 
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (response.ok) {
            const updatedUser = await response.json();
            authStore.setUser(updatedUser); 
            photoPreviewUrl.value = updatedUser.photo_perfil_url; // Atualiza o preview com a nova URL
            photoSubmissionSuccess.value = 'Foto de perfil atualizada com sucesso!';
            
            // Limpa o estado e o input
            selectedFile.value = null;
            if (photoInput.value) {
                photoInput.value.value = ''; 
            }
            emit('profileUpdated'); 
            
        } else {
            const errorData = await response.json();
            photoSubmissionError.value = errorData.statusMessage || 'Falha ao enviar a foto.';
        }
    } catch (error: any) {
        photoSubmissionError.value = 'Erro ao processar ou enviar a foto: ' + (error.message || 'Falha no upload.');
    } finally {
        isPhotoSubmitting.value = false;
    }
};

// 🟢 NOVIDADE 2: Lógica de Remoção de Foto
const removePhoto = async () => {
    // Confirmação simples antes de deletar
    if (!confirm('Tem certeza que deseja remover sua foto de perfil?')) {
        return;
    }

    photoSubmissionError.value = null;
    photoSubmissionSuccess.value = null;
    isPhotoSubmitting.value = true;

    try {
        const token = authStore.token;
        if (!token) { throw new Error('Token de autenticação não encontrado.'); }

        // Chama o novo endpoint DELETE
        const response = await fetch('/api/profile/photo', { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
            const result = await response.json();
            
            // Força a store a atualizar a URL para null e o preview
            authStore.setUser({ photo_perfil_url: null });
            photoPreviewUrl.value = null; 
            photoSubmissionSuccess.value = result.message || 'Foto de perfil removida.';
            
            // Limpa o input file caso estivesse selecionado
            selectedFile.value = null;
            if (photoInput.value) {
                photoInput.value.value = ''; 
            }
            emit('profileUpdated'); 
        } else {
            const errorData = await response.json();
            photoSubmissionError.value = errorData.statusMessage || 'Falha ao remover a foto.';
        }

    } catch (error: any) {
        photoSubmissionError.value = 'Erro de rede ou servidor ao remover a foto.';
    } finally {
        isPhotoSubmitting.value = false;
    }
};


// --- ESTADO E LÓGICA DE DADOS PESSOAIS ---
const isSubmitting = ref(false);
const submissionError = ref<string | null>(null);
const showTooltip = ref(false); 

const formData = reactive({
username: props.initialData.username || '',
apelido: props.initialData.apelido || '',
email: props.initialData.email || '',
birthdate: props.initialData.birthdate || '',
sexo: props.initialData.sexo || 'O',
initialWeight: props.initialData.initialWeight || '',
heightCm: props.initialData.heightCm || '',
phone: props.initialData.phone || '', 
});

// WATCHER para garantir que formData seja re-sincronizado após um update
watch(() => props.initialData, (newVal) => {
formData.username = newVal.username || '';
formData.apelido = newVal.apelido || '';
formData.email = newVal.email || '';
formData.birthdate = newVal.birthdate || '';
formData.sexo = newVal.sexo || 'O';
formData.phone = newVal.phone || ''; 
formData.initialWeight = newVal.initialWeight || '';
formData.heightCm = newVal.heightCm || '';

// Atualiza o preview de foto caso o initialData mude por fora
photoPreviewUrl.value = newVal.photo_perfil_url; 
}, { deep: true, immediate: true });


const submitProfile = async () => {
if (!props.isEdit) return;

submissionError.value = null;
isSubmitting.value = true;
try {
 const token = authStore.token;
 if (!token) { 
 submissionError.value = 'Erro de Autenticação.';
 authStore.logout();
 return;
 }
 
 const response = await fetch('/api/profile', { 
 method: 'PUT',
 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, },
 body: JSON.stringify({
  username: formData.username,
  apelido: formData.apelido || null,
  email: formData.email,
  birthdate: formData.birthdate,
  sexo: formData.sexo,
  phone: formData.phone || null, // Inclui phone no payload
 }),
 });

 if (response.ok) {
 const updatedUser = await response.json();
 authStore.setUser(updatedUser);
 emit('profileUpdated');
 } else {
 const errorData = await response.json();
 submissionError.value = `Falha ao salvar. Detalhe: ${errorData.statusMessage || 'Erro desconhecido.'}`;
 }
} catch (error) {
 submissionError.value = 'Erro de rede: Não foi possível conectar com o servidor.';
 console.error('Erro de submissão:', error);
} finally {
 isSubmitting.value = false;
}
};

// --- ESTADO E LÓGICA DE SENHA ---
const isPasswordSubmitting = ref(false);
const passwordSubmissionError = ref<string | null>(null);
const passwordSubmissionSuccess = ref<string | null>(null);

const passwordForm = reactive({
currentPassword: '',
newPassword: '',
confirmPassword: '',
});

const submitPasswordChange = async () => {
passwordSubmissionError.value = null;
passwordSubmissionSuccess.value = null;

if (passwordForm.newPassword.length < 6) {
 passwordSubmissionError.value = 'A nova senha deve ter no mínimo 6 caracteres.';
 return;
}

if (passwordForm.newPassword !== passwordForm.confirmPassword) {
 passwordSubmissionError.value = 'A nova senha e a confirmação não coincidem.';
 return;
}

isPasswordSubmitting.value = true;

try {
 const token = authStore.token;
 if (!token) { throw new Error('Token de autenticação não encontrado.'); }

 const response = await fetch('/api/profile/password', { 
 method: 'PUT',
 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, },
 body: JSON.stringify({
  currentPassword: passwordForm.currentPassword,
  newPassword: passwordForm.newPassword,
 }),
 });

 if (response.ok) {
 passwordSubmissionSuccess.value = 'Senha alterada com sucesso! Você pode continuar usando o sistema.';
 passwordForm.currentPassword = '';
 passwordForm.newPassword = '';
 passwordForm.confirmPassword = '';
 } else {
 const errorData = await response.json();
 passwordSubmissionError.value = errorData.statusMessage || 'Falha ao alterar senha. Verifique a senha atual.';
 }
} catch (error) {
 passwordSubmissionError.value = 'Erro de rede: Não foi possível conectar com o servidor.';
 console.error('Erro de submissão de senha:', error);
} finally {
 isPasswordSubmitting.value = false;
}
};
</script>