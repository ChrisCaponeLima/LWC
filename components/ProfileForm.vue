// /components/ProfileForm.vue - V4.0 - Inclusão de alteração de Senha e Foto de Perfil
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

            <button
                type="button"
                @click="submitPhotoChange"
                :disabled="isPhotoSubmitting || !selectedFile"
                class="mt-2 px-6 py-2 bg-blue-500 text-white rounded-md font-bold hover:bg-blue-600 disabled:opacity-50 transition duration-150"
            >
                {{ isPhotoSubmitting ? 'Enviando...' : 'Salvar Nova Foto' }}
            </button>
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
                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
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

const emit = defineEmits(['profileUpdated', 'cancel']);

const props = defineProps<{
    initialData: any;
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
        
        const formData = new FormData();
        formData.append('profile_photo', selectedFile.value);

        const response = await fetch('/api/profile/photo', { 
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (response.ok) {
            const updatedUser = await response.json();
            authStore.setUser(updatedUser); 
            photoSubmissionSuccess.value = 'Foto de perfil atualizada com sucesso!';
            
            // Limpa o estado, mas mantém o preview (agora é a nova foto)
            selectedFile.value = null;
            if (photoInput.value) {
                photoInput.value.value = ''; // Reset do input file
            }
            // Força a atualização da foto principal na página
            emit('profileUpdated'); 
            
        } else {
            const errorData = await response.json();
            photoSubmissionError.value = errorData.statusMessage || 'Falha ao enviar a foto.';
        }
    } catch (error: any) {
        photoSubmissionError.value = 'Erro de rede ou servidor: ' + (error.message || 'Falha no upload.');
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
});

// WATCHER para garantir que formData seja re-sincronizado após um update (mantido)
watch(() => props.initialData, (newVal) => {
    formData.username = newVal.username || '';
    formData.apelido = newVal.apelido || '';
    formData.email = newVal.email || '';
    formData.birthdate = newVal.birthdate || '';
    formData.sexo = newVal.sexo || 'O';
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