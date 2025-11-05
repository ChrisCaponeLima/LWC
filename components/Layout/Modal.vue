// /components/Layout/Modal.vue - V1.1 - Adiciona proteção 'process.client' para o DOM (Correção SSR)
<template>
    <Transition name="modal-fade">
        <div 
            v-if="isOpen" 
            class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 transition-opacity"
            @click.self="$emit('close')"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div class="max-h-full overflow-y-auto">
                <slot></slot>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true,
    },
});

const emit = defineEmits(['close']);

// -----------------------------------------------------------------
// LÓGICA DE EXECUÇÃO SOMENTE NO CLIENTE (process.client)
// -----------------------------------------------------------------

if (process.client) {
    
    // Lógica de Fechamento por Tecla ESC
    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            emit('close');
        }
    };

    // Manipulação do Body Scroll
    watch(() => props.isOpen, (newVal) => {
        if (newVal) {
            // Impede scroll do corpo da página quando o modal está aberto
            document.body.style.overflow = 'hidden';
        } else {
            // Restaura scroll
            document.body.style.overflow = '';
        }
    }, { immediate: true });

    // Adiciona/Remove listener de teclado (DOM interaction)
    onMounted(() => {
        document.addEventListener('keydown', handleKeydown);
    });

    onUnmounted(() => {
        document.removeEventListener('keydown', handleKeydown);
        // Garante que o scroll é restaurado se o componente for destruído
        document.body.style.overflow = '';
    });
}
</script>

<style>
/* Estilos para animação de fade */
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>