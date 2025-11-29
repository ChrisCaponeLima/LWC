// /pages/profile.vue - V1.5 - Adição de Propriedade Computada para Prevenção de Crash (latestMeasurements).
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'; // watch mantido por segurança
import { useAuthStore } from '~/stores/auth';
//import ProfileForm from '~/components/ProfileForm.vue'; 

// 🛑 CORREÇÃO 1: Desativa o layout padrão para esta página. (MANTIDO)
definePageMeta({
 layout: true,
 middleware: ['admin-auth'],
});

const authStore = useAuthStore();
const loading = ref(true);
const error = ref<string | null>(null);
const profileData = ref<any>(null);
const isEditing = ref(false);

// --- 1. FUNÇÕES DE BUSCA DE DADOS ---

const fetchProfileData = async () => {
 loading.value = true;
 error.value = null;

 try {
  const token = authStore.token;
  
  if (!token) {
   error.value = 'Sessão expirada. Faça login novamente.';
   loading.value = false;
   return;
  }

  const response = await fetch('/api/profile', {
   headers: { Authorization: `Bearer ${token}` }
  });

  if (response.ok) {
   const data = await response.json();
   profileData.value = data;
   // Atualiza a store com todos os dados novos (incluindo apelido, etc.)
   authStore.setUser({ ...authStore.user, ...data });
  } else {
   const errorData = await response.json();
   error.value = `Falha ao carregar dados: ${errorData.statusMessage || 'Erro desconhecido.'}`;
  }
 } catch (e: any) {
  console.error("Erro ao buscar perfil:", e);
  error.value = e.message || 'Erro de rede ou servidor.';
 } finally {
  loading.value = false;
 }
};

onMounted(fetchProfileData);

// 🛑 CORREÇÃO 2: Propriedade Computada para garantir que latestMeasurements seja sempre um Array.
// Isso evita qualquer crash de runtime se a propriedade ainda não existir (null) ou estiver indefinida.
const latestMeasurements = computed(() => {
    // Retorna o array de medidas ou um array vazio seguro.
    return profileData.value?.latestMeasurements || [];
});

// --- 2. FUNÇÕES DA TABELA DE MEDIDAS ---

const formatMeasurement = (value: number | string) => { // 🛑 AJUSTE: Permite number ou string
  // Converte para number antes de formatar, garantindo que mesmo strings formatáveis funcionem.
    const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(numValue)) return '---';
    return numValue.toFixed(1).replace('.', ',');
};

// Lógica de ícone de tendência: (MANTIDA)
const trendIconClass = (trend: 'up' | 'down' | 'stable' | 'initial', name: string) => {
 const isWeight = name.toLowerCase() === 'peso';

 // Determina a classe base de cor (invertida para Peso)
 let colorClass = '';
 if (trend === 'down') {
  colorClass = isWeight ? 'text-green-500' : 'text-green-500'; 
 } else if (trend === 'up') {
  colorClass = isWeight ? 'text-red-500' : 'text-red-500';
 } else if (trend === 'stable') {
  colorClass = 'text-gray-400';
 } else {
  colorClass = 'text-gray-400';
 }

 // Determina o ícone
 let iconClass = '';
 if (trend === 'down') {
  iconClass = 'fas fa-arrow-down';
 } else if (trend === 'up') {
  iconClass = 'fas fa-arrow-up';
 } else if (trend === 'stable') {
  iconClass = 'fas fa-equals';
 } else {
  iconClass = 'fas fa-minus'; // initial
 }

 return [iconClass, colorClass];
};

const trendTooltip = (trend: 'up' | 'down' | 'stable' | 'initial', name: string) => {
 if (trend === 'down') return `Diminuição desde o registro anterior. ${name === 'Peso' ? 'Bom!' : 'Ótimo!'}`;
 if (trend === 'up') return `Aumento desde o registro anterior. ${name === 'Peso' ? 'Atenção!' : 'Atenção!'}`;
 if (trend === 'stable') return 'Estável.';
 return 'Primeiro registro ou registro anterior ausente.';
};


// --- 3. FUNÇÕES GERAIS ---

const initials = computed(() => {
 if (profileData.value?.username) {
  // Usa username como fallback se apelido não estiver na store
  return profileData.value.username.charAt(0).toUpperCase();
 }
 return 'U';
});

const handleImgError = () => {
 if (profileData.value) {
  profileData.value.photo_perfil_url = '/default-profile.png';
 }
};

const handleProfileUpdate = () => {
 isEditing.value = false;
 // Recarrega os dados do servidor para obter a última versão e as galerias atualizadas
 fetchProfileData();
};

// --- 4. Componente Reutilizável de Galeria (Mantido aqui, mas idealmente seria um arquivo separado) ---
</script>

<template>
 <div class="max-w-4xl mx-auto p-4 md:p-8">
  <div v-if="loading" class="text-center py-10">
   <i class="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
   <p class="mt-2 text-gray-600">Carregando dados do perfil...</p>
     </div>
  
  <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
   <strong class="font-bold">Erro:</strong>
   <span class="block sm:inline"> {{ error }}</span>
  </div>

  <div v-else-if="profileData">
   
   <div class="p-6 bg-white text-center relative"> 
    
    <div class="w-40 h-40 mx-auto rounded-full overflow-hidden border-2 border-indigo-500 flex items-center justify-center bg-gray-200">
     <img
      v-if="profileData.photo_perfil_url"
      :src="profileData.photo_perfil_url"
      alt="Foto de Perfil"
      class="w-full h-full object-cover"
      @error="handleImgError"
     />
     <span
      v-else
      class="text-4xl font-bold text-gray-600"
     >
      {{ initials }}
     </span>
    </div>

    <h2 class="mt-4 text-2xl font-semibold text-gray-800">
     {{ profileData.apelido || profileData.username || 'Usuário' }}
    </h2>
    <p class="text-gray-500">{{ profileData.email }}</p>

    <p class="mt-2 text-sm text-gray-500">
     <span class="font-semibold">Apelido:</span> {{ profileData.apelido || profileData.username }} 
     <span class="text-xs italic">(Aparece em posts públicos)</span>
    </p>

    <div class="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
     <div>
      <span class="font-bold">Altura:</span>
      <p>{{ profileData.heightCm || '---' }} cm</p>
     </div>
     <div>
      <span class="font-bold">Peso Inicial:</span>
      <p>{{ profileData.initialWeight || '---' }} kg</p>
     </div>
    </div>

    <button 
     @click="isEditing = true"
     class="absolute top-4 right-4 p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition"
     title="Editar Perfil"
    >
     <i class="fas fa-edit"></i>
    </button>
   </div>

   <ProfileForm 
    v-if="isEditing" 
    :initial-data="profileData"
    :is-edit="true"
    @profile-updated="handleProfileUpdate"
    @cancel="isEditing = false"
   />


   <div class="mt-8 bg-white p-6 shadow-md rounded-lg">
    <h3 class="text-xl font-bold mb-4 text-gray-800">Minhas Últimas Medidas</h3>
    
        <div v-if="latestMeasurements.length > 0" class="grid grid-cols-2 gap-4">
     <p v-for="data in latestMeasurements" :key="data.name" class="flex justify-between items-center text-sm">
      <span class="font-medium">{{ data.name }}:</span>
      <span class="font-semibold flex items-center gap-2">
       {{ formatMeasurement(data.value) }} {{ data.unit }} 
       <i :class="trendIconClass(data.trend, data.name)" :title="trendTooltip(data.trend, data.name)"></i>
      </span>
     </p>
    </div>
    <p v-else class="text-gray-500 italic">Nenhuma medida corporal registrada ainda.</p>
   </div>
   
   <div class="mt-8 flex justify-center">
    <img src="/images/logoWLC.png" alt="WLC" class="max-h-22 h-auto" />
   </div>

   <div class="mt-8 space-y-8">
    <GallerySection 
     title="Fotos de Evolução (Registros)" 
     :photos="profileData.photoGallery || []" 
     type="registro"
    />
    <GallerySection 
     title="Fotos de Forma" 
     :photos="profileData.formaGallery || []" 
     type="forma"
    />
   </div>
   
  </div>
 </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

const GallerySection = defineComponent({
 props: {
  title: { type: String, required: true },
  photos: { type: Array, required: true },
  type: { type: String, required: true }
 },
 methods: {
  formatDate(dateString: string) {
   try {
    // A data já vem como objeto { date: Date, recordId: number, ... } do profile.get.ts
    const dateObject = new Date(dateString); 
    return dateObject.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
   } catch {
    return 'S/D';
   }
  }
 },
 template: `
  <div class="bg-gray-50 p-6 rounded-lg shadow">
   <h3 class="text-xl font-bold mb-4 text-gray-800">{{ title }}</h3>
   <div v-if="photos.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <NuxtLink 
     v-for="photo in photos" 
     :key="photo.url + '-' + photo.recordId" 
     :to="\`/editor/\${photo.recordId}?type=\${photo.type}\`" 
     class="relative pb-[100%] cursor-pointer group block"
    >
     <img 
      :src="photo.url" 
      :alt="\`\${title} (\${formatDate(photo.date)})\`" 
      class="absolute inset-0 w-full h-full object-cover rounded-md shadow-md group-hover:opacity-75 transition-opacity"
     >
     <div v-if="photo.isPrivate" class="absolute top-2 right-2 p-1 bg-black/80 rounded-full text-white text-sm z-50 flex items-center justify-center">
      🔒
     </div>
     <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-md text-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
      {{ formatDate(photo.date) }}<span v-if="photo.isPrivate"> 🔒</span>
     </div>
    </NuxtLink>
   </div>
   <p v-else class="text-gray-500 italic">Nenhuma foto de {{ title.includes('Evolução') ? 'evolução' : 'forma' }} registrada.</p>
  </div>
 `
});
</script>