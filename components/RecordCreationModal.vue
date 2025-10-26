// /components/RecordCreationModal.vue (Atualizado para usar DataFormV2)

<template>
<div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closeModal">
    <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        
        <div class="sticky top-0 bg-white p-6 border-b flex justify-between items-center z-10">
            <h3 class="text-2xl font-bold text-green-700">
                <i class="fas fa-chart-line mr-2"></i> Novo Registro de Acompanhamento
            </h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition">
                <i class="fas fa-times text-2xl"></i>
            </button>
        </div>

        <div class="p-6">
            <p v-if="userId" class="text-sm text-gray-600 mb-4">Criando novo registro para o Paciente #{{ userId }}.</p>
            
            <DataFormV2 
                v-if="userId"
                :user-id="userId"
                @record-saved="handleRecordSaved"
                @cancel="closeModal"
                @open-image-editor="openImageEditor"
            />
            <div v-else class="text-center p-8 text-red-500">
                <p>Erro: ID do paciente não fornecido.</p>
            </div>
        </div>

    </div>
    
</div>
</template>

<script setup lang="ts">
import DataFormV2 from './DataFormV2.vue'; // IMPORTAÇÃO ALTERADA

const props = defineProps<{
    isOpen: boolean;
    userId: number | null | undefined; 
}>();

const emit = defineEmits(['close', 'recordSaved']);

const closeModal = () => {
    emit('close');
};

const handleRecordSaved = () => {
    emit('recordSaved'); 
};

const openImageEditor = () => {
    // Este é o ponto onde você implementaria um modal/componente de ImageEditor
    // O DataFormV2 emite 'openImageEditor', e o RecordCreationModal deve lidar com isso.
    alert('Ação "openImageEditor" acionada. O componente pai precisa renderizar o editor de imagem.');
};
</script>