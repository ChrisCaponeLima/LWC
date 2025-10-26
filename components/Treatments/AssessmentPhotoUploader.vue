// /components/Treatments/AssessmentPhotoUploader.vue - V1.0 - Componente de Upload e Anotação de Fotos de Avaliação
<template>
    <div class="space-y-6">
        <h3 class="text-xl font-bold text-gray-800 flex items-center">
            <i class="fas fa-camera-retro mr-2 text-indigo-600"></i> Upload de Foto de Avaliação
        </h3>

        <form @submit.prevent="submitAssessmentPhoto" class="bg-white p-6 rounded-lg shadow-lg border space-y-5">

            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label for="treatment-select" class="block text-sm font-medium text-gray-700">Tratamento Associado (Opcional):</label>
                    <select
                        id="treatment-select"
                        v-model="form.userTreatmentId"
                        class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm sm:text-sm"
                    >
                        <option :value="null">Nenhum Tratamento</option>
                        <option 
                            v-for="treatment in activeTreatments" 
                            :key="treatment.id" 
                            :value="treatment.id"
                        >
                            {{ treatment.name }} (Início: {{ treatment.startDate || 'S/D' }})
                        </option>
                    </select>
                </div>
                
                <div class="md:col-span-2">
                    <label for="photo-type" class="block text-sm font-medium text-gray-700">Tipo da Foto (Ex: Frontal, Lateral):</label>
                    <input
                        type="text"
                        id="photo-type"
                        v-model="form.photoType"
                        required
                        placeholder="Ex: Frontal, Lateral Direita, Lesão X"
                        class="mt-1 block w-full pl-3 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm sm:text-sm"
                    />
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Selecione a Foto Original:
                </label>
                <input
                    type="file"
                    ref="fileInputRef"
                    accept="image/*"
                    @change="handleFileChange"
                    required
                    class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                />
            </div>

            <div v-if="previewUrl" class="border border-indigo-300 rounded-lg p-4 bg-gray-50">
                <h4 class="text-md font-semibold mb-3">Pré-visualização e Anotação</h4>
                
                <div class="relative w-full overflow-hidden border border-gray-400">
                    <img :src="previewUrl" alt="Pré-visualização da Foto" class="w-full h-auto max-h-96 object-contain block"/>
                    
                    <div 
                        class="absolute inset-0 cursor-crosshair opacity-80"
                        @mousedown="startDrawing"
                        @mousemove="draw"
                        @mouseup="stopDrawing"
                        @mouseleave="stopDrawing"
                        title="Área onde seria o canvas para desenhar"
                    >
                         <div v-if="form.annotationData" class="p-2 bg-yellow-100/70 border-l-4 border-yellow-500 text-xs italic text-gray-700 absolute bottom-0 w-full">
                            Dados de anotação (JSON) capturados: {{ form.annotationData.length > 50 ? form.annotationData.substring(0, 50) + '...' : form.annotationData }}
                        </div>
                        <span v-else class="text-xs text-gray-500 absolute top-2 right-2 p-1 bg-white rounded shadow-sm">
                            Clique e arraste para simular uma anotação.
                        </span>
                    </div>
                </div>

                <div class="mt-3 flex items-center justify-between">
                    <button type="button" @click="simulateAnnotation" :disabled="isSubmitting"
                        class="px-3 py-1 text-sm text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition disabled:opacity-50">
                        <i class="fas fa-magic mr-1"></i> Simular Anotação JSON
                    </button>
                    <button type="button" @click="resetAnnotation" :disabled="isSubmitting"
                        class="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition disabled:opacity-50">
                        <i class="fas fa-undo-alt mr-1"></i> Limpar Anotação
                    </button>
                </div>
            </div>
            
            <button
                type="submit"
                :disabled="isSubmitting || !form.photoFile || !form.photoType"
                class="w-full justify-center inline-flex items-center px-4 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition"
            >
                <i v-if="isSubmitting" class="fas fa-spinner fa-spin mr-2"></i>
                <i v-else class="fas fa-cloud-upload-alt mr-2"></i>
                Salvar Foto e Anotações
            </button>
        </form>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#app'

const props = defineProps({
    userId: { type: Number, required: true },
    activeTreatments: { type: Array, default: () => [] } // Lista de tratamentos ativos para o select
})

const emit = defineEmits(['uploadSuccess'])

const authStore = useAuthStore()
const config = useRuntimeConfig()

const isSubmitting = ref(false)
const fileInputRef = ref(null)
const previewUrl = ref(null)

const form = ref({
    photoFile: null,
    photoType: '',
    userTreatmentId: null, // ID da associação user_treatments
    annotationData: null, // String JSON
})

// Simulação de anotação
const isDrawing = ref(false);

const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
        form.value.photoFile = file
        previewUrl.value = URL.createObjectURL(file)
        form.value.annotationData = null // Limpar anotação ao trocar de foto
    } else {
        form.value.photoFile = null
        previewUrl.value = null
    }
}

// Simulação das funções de desenho para manter o padrão
const startDrawing = (e) => {
    if (form.value.photoFile) {
        isDrawing.value = true
    }
}
const draw = (e) => {
    if (!isDrawing.value) return
    // Lógica de desenho real seria aqui...
}
const stopDrawing = () => {
    if (isDrawing.value) {
        isDrawing.value = false
        // Após parar de desenhar, você coletaria os dados do canvas
        // Aqui, apenas chamamos a simulação para ter dados para o POST
        if (!form.value.annotationData) {
             simulateAnnotation();
        }
    }
}

// Simula a criação de um JSON de anotação (vetores, linhas, etc.)
const simulateAnnotation = () => {
    const randomId = Math.floor(Math.random() * 1000)
    form.value.annotationData = JSON.stringify({
        version: '1.0',
        tool: 'simulated_pen',
        color: '#FF0000',
        lines: [
            { x1: 10, y1: 20, x2: 50, y2: 60, id: randomId },
            { text: 'Ponto de Avaliação', position: { x: 70, y: 80 } }
        ]
    })
}

const resetAnnotation = () => {
    form.value.annotationData = null
}

const submitAssessmentPhoto = async () => {
    if (isSubmitting.value || !form.value.photoFile || !form.value.photoType) return

    isSubmitting.value = true
    const token = authStore.token

    try {
        // 1. Criar FormData para enviar arquivo e texto juntos
        const formData = new FormData()
        formData.append('photoFile', form.value.photoFile, form.value.photoFile.name)
        formData.append('photoType', form.value.photoType)
        
        // userTreatmentId é opcional
        if (form.value.userTreatmentId) {
            formData.append('userTreatmentId', form.value.userTreatmentId)
        }
        
        // annotationData é opcional
        if (form.value.annotationData) {
            formData.append('annotationData', form.value.annotationData)
        } else {
             // Envia uma string vazia se não houver anotação (o backend trata como null)
             formData.append('annotationData', '')
        }

        // 2. Enviar dados para o backend
        const response = await $fetch(`/api/professional/user/${props.userId}/photos`, {
            baseURL: config.public.apiBaseUrl,
            method: 'POST',
            headers: { 
                Authorization: `Bearer ${token}`,
                // 'Content-Type': 'multipart/form-data' NÃO é necessário ao usar FormData e fetch
            },
            body: formData // o corpo deve ser o objeto FormData
        })

        alert(`Foto de avaliação salva com sucesso! ID: ${response.photo.id}`)
        
        // 3. Limpar formulário e notificar sucesso
        fileInputRef.value.value = '' // Limpa o input de arquivo
        previewUrl.value = null
        form.value.photoFile = null
        form.value.photoType = ''
        form.value.userTreatmentId = null
        form.value.annotationData = null

        emit('uploadSuccess')

    } catch (e) {
        console.error('Erro ao fazer upload da foto de avaliação:', e)
        alert(`Erro ao salvar foto: ${e?.data?.statusMessage || e?.message || 'Falha desconhecida.'}`)
    } finally {
        isSubmitting.value = false
    }
}

// Limpeza de URL de objeto ao desmontar
watch(previewUrl, (newUrl, oldUrl) => {
  if (oldUrl) URL.revokeObjectURL(oldUrl);
});
</script>