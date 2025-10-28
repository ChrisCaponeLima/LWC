// /pages/dashboard.vue - V1.15 - Revertendo a lógica de remontagem do DataForm para preservar o estado do formulário preenchido.
<template>
<div>
<Header pageTitle="Dashboard" />

<div class="container mx-auto px-4 my-8">

<RegistroImageEditor 
v-if="showImageEditor" 
@close="showImageEditor = false" 
class="fixed inset-0 z-50 bg-white overflow-y-auto" 
/>
<div>
<div class="my-8">
<ClientOnly>
<h2 class="text-3xl font-bold text-gray-800">
{{ greetingMessage }}, {{ userNameForGreeting }}!
</h2>
<p v-if="isLoading" class="text-gray-500">carregando seus dados...</p>
<p v-else-if="error" class="text-red-500">{{ error }}</p>
</ClientOnly>
</div>

<div class="mb-4">
<KpiCard
label="Clima Atual"
:value="weatherData.value"
color="terracota"
:icon-url="weatherData.iconUrl"
icon-alt="Ícone de Clima"
:weather-code="weatherData.code"
/>
<p v-if="isWeatherLoading" class="text-sm text-gray-500 mt-1">Carregando clima em **{{ weatherData.city || 'localização padrão' }}**...</p>
<p v-else-if="weatherError" class="text-sm text-red-500 mt-1">Erro ao carregar clima: {{ weatherError || 'verifique o console' }}.</p>
</div>

<div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
<KpiCard
label="Peso Atual"
:value="`${kpiData.currentWeight} kg`"
color="azul"
icon-url="https://api.iconify.design/solar:scale-bold-duotone.svg"
icon-alt="Ícone de Escala"
/>

<KpiCard
label="Perda Total"
:value="`${kpiData.totalLoss} kg`"
color="roxo"
icon-url="https://api.iconify.design/solar:minus-square-bold-duotone.svg"
icon-alt="Ícone de Perda"
/>

<KpiCard
label="Status Semanal"
value="Estável"
color="amarelo"
icon-url="https://api.iconify.design/solar:calendar-bold-duotone.svg"
icon-alt="Ícone de Calendário"
/>

<KpiCard
label="IMC"
:value="kpiData.imc?.toFixed(2) || '---'" 
color="verde"
icon-url="https://api.iconify.design/solar:ruler-bold-duotone.svg"
icon-alt="Ícone de Régua"
/>
</div>

<div class="mt-8 text-center">
<div class="flex justify-center space-x-4"> 
<button
 @click="startNewRecord"
 class="px-6 py-3 bg-btn-principal text-btn-font-principal rounded-md font-bold hover:opacity-80 transition duration-150 shadow-md flex items-center"
>
 <i class="fas fa-plus-circle mr-2"></i> Novo Registro
</button>
</div>
</div>

<DataForm 
v-if="showForm" 
:record-id="editingRecordId" 
@recordSaved="handleRecordSaved" 
@cancel="handleRecordSaved" 
@openImageEditor="handleOpenImageEditor"
/>

<div v-if="showForm && (tempPhotoFilesCount > 0 || tempFormaFilesCount > 0)" class="mt-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700" role="alert">
<p class="font-bold">Fotos Anexadas</p>
<p>Há **{{ tempPhotoFilesCount }}** foto(s) de Evolução e **{{ tempFormaFilesCount }}** foto(s) de Forma prontas para serem anexadas no seu registro.</p>
</div>

<DataDisplay 
:raw-chart-data="chartData" 
:has-registro-photos="hasRegistroPhotos" 
:has-forma-photos="hasFormaPhotos" 
@editRecord="handleEditRecord"
/>
</div>

</div>

<Footer />
</div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'; 
import { useRouter } from '#app'; 
import { useAuthStore } from '~/stores/auth';
import { useKpiData } from '~/composables/useKpiData';
import RegistroImageEditor from '~/components/Registro/ImageEditor.vue'; 
import { useTempFiles } from '~/composables/useTempFiles'; 

const router = useRouter();

definePageMeta({
middleware: ['auth'] 
});

const authStore = useAuthStore();
const showForm = ref(false);
const editingRecordId = ref(null); 
const showImageEditor = ref(false); 

// Obtém o estado reativo do composable
const { allTempFiles } = useTempFiles();

// --- Lógica de Scroll Lock (Mantida) ---
watch(showImageEditor, (isEditorOpen) => {
if (process.client) {
 if (isEditorOpen) {
 // Bloqueia a rolagem do corpo da página
 document.body.classList.add('overflow-hidden');
 } else {
 // Reativa a rolagem
 document.body.classList.remove('overflow-hidden');
 }
}
});

// --- Lógica KPI (Mantida) ---
const { 
kpiData, 
chartData, 
isLoading, 
error, 
fetchData,
hasRegistroPhotos, 
hasFormaPhotos 
} = useKpiData();

// --- Contadores de fotos (REATIVOS) ---
const tempPhotoFilesCount = computed(() => allTempFiles.value.filter(f => f.type === 'photo').length);
const tempFormaFilesCount = computed(() => allTempFiles.value.filter(f => f.type === 'forma').length);

// --- Nome e Saudação (Mantido) ---
const userNameForGreeting = computed(() => {
if (authStore.user?.apelido) return authStore.user.apelido;
const username = authStore.user?.username;
return username ? username.split(' ')[0] : 'Usuário';
});

const greetingMessage = computed(() => {
const hour = new Date().getHours();
if (hour >= 5 && hour < 12) return ["Bom dia", "Lindo dia", "Excelente manhã"][Math.floor(Math.random()*3)];
if (hour >= 12 && hour < 18) return ["Boa tarde","Excelente dia","Que tarde agradável"][Math.floor(Math.random()*3)];
return ["Boa noite","Bom te ver","Esperamos que tenha tido um bom dia"][Math.floor(Math.random()*3)];
});

// --- Clima (Mantido) ---
const weatherData = ref({ value: '---', iconUrl: 'https://api.iconify.design/solar:sun-bold-duotone.svg', description:'', city:'N/A', code:null });
const isWeatherLoading = ref(false);
const weatherError = ref(null);

const fetchWeather = () => {
isWeatherLoading.value=true;
weatherError.value=null;
if(process.client && navigator.geolocation){
navigator.geolocation.getCurrentPosition(
(pos)=>callWeatherApi(pos.coords.latitude,pos.coords.longitude),
()=>callWeatherApi()
);
}else callWeatherApi();
};

const callWeatherApi = async (lat=null,lon=null)=>{
try{
const params={};
if(lat&&lon) params.lat=lat;
const response=await $fetch('/api/weather',{params});
weatherData.value.value=`${response.temperature} - ${response.description}`;
weatherData.value.iconUrl=`https://openweathermap.org/img/wn/${response.iconCode}@2x.png`;
weatherData.value.description=response.description;
weatherData.value.city=response.city;
weatherData.value.code=response.iconCode;
}catch(e){
weatherError.value=e.statusMessage||e.message||'Falha na comunicação com o serviço de clima.';
weatherData.value.value='N/A';
weatherData.value.iconUrl='https://api.iconify.design/solar:cloud-snow-bold-duotone.svg';
weatherData.value.city='Localização Desconhecida';
weatherData.value.code='error';
}finally{isWeatherLoading.value=false;}
};

// --- Handlers (Corrigido para evitar a perda de estado) ---
const handleOpenImageEditor = () => {
    // Garante que o DataForm esteja aberto (se não estiver) e depois abre o editor.
    if(!showForm.value) startNewRecord(); 

    // Abre o editor e bloqueia a tela (via watch)
    showImageEditor.value = true;
    
    // Adiciona o scroll silencioso de volta
    if(process.client) window.scrollTo({ top: 0, behavior: 'instant' }); 
};

const startPhotoRecord = () => handleOpenImageEditor();

// Lógica padrão: abre o formulário e fecha o editor
const startNewRecord = () => { editingRecordId.value=null; showForm.value=true; showImageEditor.value=false; };
const handleEditRecord = (id) => { editingRecordId.value=id; showForm.value=true; showImageEditor.value=false; };

const handleRecordSaved = () => { fetchData(); showForm.value=false; editingRecordId.value=null; showImageEditor.value=false; };

onMounted(()=>{ fetchData(); fetchWeather(); });
</script>