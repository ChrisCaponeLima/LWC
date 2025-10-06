// /pages/index.vue - V1.0 - Implementação da Splash Screen e lógica de roteamento inicial.
<template>
    <div class="h-screen w-screen">
        <AppLogoSplash />
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import AppLogoSplash from '~/components/AppLogoSplash.vue';

// Não é necessário definirPageMeta(['auth']) aqui, pois queremos que esta seja 
// a primeira tela a carregar, antes da verificação de login/token.

const router = useRouter();
const authStore = useAuthStore();
const SPLASH_DURATION = 1500; // Tempo reduzido para 1.5s, tempo suficiente para a animação.

onMounted(() => {
    // Definimos o timeout para a duração da Splash Screen
    setTimeout(() => {
        // Verifica o estado de login diretamente da store
        if (authStore.isLoggedIn) {
            // Se logado, redireciona para o novo dashboard
            router.push('/dashboard'); 
        } else {
            // Se não logado, redireciona para a tela de login
            router.push('/login'); 
        }
    }, SPLASH_DURATION);
});
</script>