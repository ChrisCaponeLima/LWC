// /pages/registro/foto-rapida.vue - V1.1 - Integração da função performOcr com simulação de chamada de API para Cloudinary OCR Add-on.
<template>
  <NuxtLayout>
    <div>
      <Header pageTitle="Registro Rápido" />

      <div class="min-h-screen bg-gray-100 p-4 sm:p-8">
        <div class="max-w-7xl mx-auto bg-white shadow-xl rounded-lg p-6">

          <NuxtLink to="/dashboard" class="text-indigo-600 hover:text-indigo-800 mb-6 inline-block font-semibold">
            ← Voltar para o Dashboard
          </NuxtLink>

          <div v-if="error" class="text-red-600 p-4 border border-red-200 rounded bg-red-50">
            <i class="fas fa-exclamation-triangle mr-2"></i> {{ error }}
          </div>

          <ClientOnly>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div class="lg:col-span-2">
                
                <div v-if="!image.url" class="w-full relative p-16 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50 hover:bg-gray-100 transition duration-150">
                  <i class="fas fa-cloud-upload-alt text-6xl text-gray-400"></i>
                  <p class="mt-4 text-gray-700 font-semibold">
                    Selecione uma foto
                  </p>
                  <p class="text-sm text-gray-500">
                    Formatos suportados: JPG, PNG
                  </p>
                  <input 
                    type="file" 
                    @change="handleFileUpload" 
                    accept="image/*" 
                    class="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>
                
                <div v-else>
                    <div class="relative w-full" :style="{ borderLeft: '3px solid rgba(0,0,0,0.08)', borderRight: '3px solid rgba(0,0,0,0.08)' }">
                      <div ref="imageContainer" class="w-full relative">
                        <img
                          ref="baseImage"
                          :src="image.url"
                          :alt="image.description || 'Imagem para edição'"
                          @load="onImageLoad"
                          class="w-full object-contain block"
                          :style="{ maxHeight: '70vh' }"
                        />
                        <canvas ref="overlayCanvas" class="absolute top-0 left-0"></canvas>
                      </div>
                    </div>
                    
                    <div class="text-sm text-gray-500 mt-2 flex items-center gap-2">
                      <i class="fas fa-info-circle text-gray-400"></i>
                      Use as ferramentas ao lado para aplicar tarjas ou embaçamento.
                    </div>
                </div>

              </div>

              <div class="lg:col-span-1 p-4 border rounded-lg bg-gray-50 flex flex-col gap-4">
                
                <div class="p-3 border rounded bg-white">
                    <h3 class="text-md font-semibold text-gray-700 mb-2">Análise de Imagem</h3>
                    
                    <button 
                        @click="detectPeople" 
                        :disabled="!image.url || isAnalyzing"
                        class="w-full py-2 mb-2 bg-yellow-500 text-white rounded-md font-medium hover:bg-yellow-600 transition disabled:opacity-50"
                        title="Identifica e sugere embaçar pessoas"
                    >
                       <i v-if="isAnalyzing && analyzingFeature === 'people'" class="fas fa-spinner fa-spin mr-2"></i>
                       <i v-else class="fas fa-user-secret mr-2"></i>
                        Detectar Pessoas
                    </button>

                    <button 
                        @click="performOcr" 
                        :disabled="!image.url || isAnalyzing"
                        class="w-full py-2 bg-teal-500 text-white rounded-md font-medium hover:bg-teal-600 transition disabled:opacity-50"
                        title="Tenta ler o número da balança digital"
                    >
                       <i v-if="isAnalyzing && analyzingFeature === 'ocr'" class="fas fa-spinner fa-spin mr-2"></i>
                       <i v-else class="fas fa-calculator mr-2"></i>
                        Ler Peso (OCR)
                    </button>
                    <p v-if="ocrResult" class="mt-2 text-sm text-teal-700 font-bold">Peso Detectado: **{{ ocrResult }}**</p>
                    <p v-if="ocrError" class="mt-2 text-sm text-red-500">Falha no OCR: {{ ocrError }}</p>
                </div>
                
                <div>
                  <h3 class="text-lg font-semibold text-gray-700">Ferramentas de Edição</h3>
                  <div class="flex flex-wrap items-center gap-3 mt-3">
                    
                    <button @click="setMode('blur')" :disabled="!image.url" class="p-3 rounded-md hover:bg-gray-200 border" title="Embaçar">
                      <i class="fas fa-mask text-gray-700 w-5 h-5"></i>
                    </button>
                    <button @click="setMode('stripe')" :disabled="!image.url" class="p-3 rounded-md hover:bg-gray-200 border" title="Tarja preta">
                      <i class="fas fa-square text-gray-700 w-5 h-5"></i>
                    </button>
                    <button @click="rotateImage" :disabled="!image.url" class="p-3 rounded-md hover:bg-gray-200 border" title="Girar 90°">
                      <i class="fas fa-redo-alt text-gray-700 w-5 h-5"></i>
                    </button>
                    <button @click="startCrop" :disabled="!image.url" class="p-3 rounded-md hover:bg-gray-200 border" title="Cortar">
                      <i class="fas fa-crop text-gray-700 w-5 h-5"></i>
                    </button>
                    <button @click="clearEffects" :disabled="!image.url" class="p-3 rounded-md hover:bg-gray-200 border" title="Limpar Efeitos">
                      <i class="fas fa-eraser text-gray-700 w-5 h-5"></i>
                    </button>
                    <button @click="resetAll" :disabled="!image.url" class="p-3 rounded-md hover:bg-gray-200 border" title="Resetar Imagem">
                      <i class="fas fa-undo-alt text-gray-700 w-5 h-5"></i>
                    </button>

                  </div>
                </div>

                <div>
                    <h3 class="text-md font-semibold text-gray-700">Efeitos Aplicados ({{ rects.length }})</h3>
                    <ul class="text-sm text-gray-600 mt-2 max-h-24 overflow-y-auto bg-white p-2 rounded">
                      <li v-for="(r, idx) in rects" :key="idx" class="flex justify-between items-center py-1">
                        <span>{{ r.type === 'blur' ? 'Embaçamento' : 'Tarja Preta' }} {{ idx + 1 }}</span>
                        <button @click="removeRect(idx)" class="text-red-500 hover:text-red-700 text-xs">
                          <i class="fas fa-times-circle"></i>
                        </button>
                      </li>
                      <li v-if="rects.length === 0" class="text-gray-400 italic">Nenhum efeito de tarja/blur aplicado.</li>
                    </ul>
                </div>
                
                <div class="mt-auto flex flex-col gap-3">
                  <button @click="downloadImage" :disabled="!image.url" class="w-full py-2 bg-gray-400 text-white rounded-md font-bold hover:bg-gray-500 transition disabled:opacity-50">
                    <i class="fas fa-download mr-2"></i> Baixar (Prévia)
                  </button>
                  
                  <button @click="saveFinalImage" :disabled="!image.url || isSaving" class="w-full py-3 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700 transition duration-150 disabled:opacity-50">
                    <i v-if="isSaving" class="fas fa-spinner fa-spin mr-2"></i>
                    {{ isSaving ? 'Processando e Salvando...' : 'Salvar Imagem e Concluir' }}
                  </button>
                </div>

              </div>
            </div>
          </ClientOnly>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRouter, useRuntimeConfig } from '#app';
// NOTA: Header e NuxtLayout são assumidos como globais ou importados de '~/components'

definePageMeta({ middleware: ['auth'] });

const authStore = useAuthStore();
const router = useRouter();
const config = useRuntimeConfig();

// Variáveis de Estado
const image = ref({ url: null, description: null, originalFile: null }); // Armazena URL e o File original
const error = ref(null);
const isSaving = ref(false);

// Variáveis de Análise
const isAnalyzing = ref(false);
const analyzingFeature = ref(null); // Para mostrar qual análise está rodando (people ou ocr)
const ocrResult = ref(null); // Resultado do OCR (string do peso)
const ocrError = ref(null); // Erro do OCR

// Variáveis do Canvas
const baseImage = ref(null);
const overlayCanvas = ref(null);
let canvasCtx = null;
let originalImageURL = null; // Para o Reset All
let rotation = 0; // 0, 90, 180, 270

// Variáveis de Edição
const mode = ref('blur'); // blur, stripe
const rects = reactive([]); // Efeitos de tarja/blur

// Variáveis de Interação do Canvas
let drawing = false, moving = false, startX = 0, startY = 0, offsetX = 0, offsetY = 0, selected = -1;


// =======================================================
// FUNÇÕES DE UPLOAD
// =======================================================

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        error.value = null;
        image.value.originalFile = file;
        image.value.description = file.name;
        
        // Cria URL local para visualização
        const url = URL.createObjectURL(file);
        image.value.url = url;
        originalImageURL = url; // Guarda para resetar
        
        // Limpa estados de análise e edição
        rotation = 0;
        rects.splice(0, rects.length);
        ocrResult.value = null;
        ocrError.value = null;

        // O 'onImageLoad' é chamado após a imagem ser carregada no elemento <img>
    } else if (file) {
        error.value = 'Por favor, selecione um arquivo de imagem válido.';
    }
};


// =======================================================
// FUNÇÕES DE EDIÇÃO E CANVAS (Não alteradas)
// =======================================================

const onImageLoad = () => {
    resizeCanvasToImage();
};

const resizeCanvasToImage = () => {
    const img = baseImage.value;
    const canvas = overlayCanvas.value;
    if (!img || !canvas) return;

    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    // Adiciona transformação de rotação se necessário
    canvas.style.transform = `rotate(${rotation}deg)`;
    canvas.style.transformOrigin = 'center center';
    
    canvasCtx = canvas.getContext('2d');
    redrawAll();
};

const redrawAll = () => {
    if (!canvasCtx) return;
    canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
    
    rects.forEach(r => {
        if (r.type === 'stripe') {
            canvasCtx.fillStyle = 'rgba(0,0,0,0.95)';
            canvasCtx.fillRect(r.x, r.y, r.w, r.h);
        } else if (r.type === 'blur') {
            canvasCtx.save();
            canvasCtx.filter = 'blur(8px)';
            canvasCtx.fillRect(r.x, r.y, r.w, r.h);
            canvasCtx.restore();
        }
    });
};

const setMode = (newMode) => { mode.value = newMode };
const clearEffects = () => { rects.splice(0, rects.length); redrawAll() };
const removeRect = (idx) => { rects.splice(idx, 1); redrawAll() };

const resetAll = () => { 
    if (image.value.originalFile) {
        const url = URL.createObjectURL(image.value.originalFile);
        image.value.url = url;
        originalImageURL = url; 
        rotation = 0;
        clearEffects();
        ocrResult.value = null;
        ocrError.value = null;
    }
};

const rotateImage = () => {
    rotation = (rotation + 90) % 360;
    resizeCanvasToImage(); 
};

const startCrop = () => { 
    alert('Funcionalidade de Crop deve ser implementada, geralmente com uma biblioteca externa.'); 
};


// =======================================================
// FUNÇÕES DE ANÁLISE (ATUALIZADAS)
// =======================================================

const detectPeople = async () => {
    if (!image.value.originalFile) return;
    isAnalyzing.value = true;
    analyzingFeature.value = 'people';

    // Simulação: A API deveria retornar coordenadas para blur/tarja
    console.log("Chamando API de detecção de pessoas...");
    await new Promise(resolve => setTimeout(resolve, 1500));

    rects.push({ x: 10, y: 10, w: 100, h: 150, type: 'blur' });
    redrawAll();
    
    alert('Detecção simulada: Um retângulo de blur foi adicionado no canto superior esquerdo.');
    isAnalyzing.value = false;
    analyzingFeature.value = null;
};

const performOcr = async () => {
    if (!image.value.originalFile) return;
    isAnalyzing.value = true;
    analyzingFeature.value = 'ocr';
    ocrResult.value = null;
    ocrError.value = null;
    
    const token = authStore.token;
    if (!token) {
        ocrError.value = 'Autenticação necessária.';
        isAnalyzing.value = false;
        analyzingFeature.value = null;
        return;
    }

    try {
        // 1. Cria um FormData para enviar o arquivo e o token
        const formData = new FormData();
        formData.append('file', image.value.originalFile);
        
        // 2. Chama o endpoint de API interno (server/api/ocr)
        // Este endpoint é responsável por: a) Fazer o upload temporário no Cloudinary;
        // b) Chamar a API de OCR do Cloudinary; c) Processar o JSON e extrair o peso.
        const response = await $fetch('/api/ocr/peso-balanca', {
            method: 'POST',
            baseURL: config.public.apiBaseUrl, // Assumindo que a API é interna ou baseada no mesmo domínio
            body: formData,
            headers: { Authorization: `Bearer ${token}` }
        });

        // Simulação do resultado (o backend faria a filtragem do JSON)
        if (response.pesoDetectado) {
            ocrResult.value = response.pesoDetectado;
            console.log(`OCR Concluído. Peso detectado: ${ocrResult.value}`);
        } else {
            ocrError.value = response.message || 'Nenhum número de balança detectado.';
        }

    } catch (e) {
        // Trata erros de rede ou de API
        ocrError.value = e?.data?.message || e?.message || 'Erro de comunicação com o serviço OCR.';
        console.error("Erro no OCR:", e);
    } finally {
        isAnalyzing.value = false;
        analyzingFeature.value = null;
    }
};


// =======================================================
// FUNÇÕES DE SAÍDA (Não alteradas)
// =======================================================

const downloadImage = () => { alert('Funcionalidade de Download precisa renderizar a imagem + canvas.') };

const saveFinalImage = async () => {
    if (!image.value.url) return;

    isSaving.value = true;
    error.value = null;
    
    const token = authStore.token;
    if (!token) {
        error.value = 'Token de autenticação ausente para salvar.';
        isSaving.value = false;
        return;
    }

    try {
        // Aqui, você usaria um FormData similar ao OCR, mas enviando a intenção de salvar permanentemente.
        console.log('Dados a serem salvos:', {
            imageFile: image.value.originalFile.name,
            effects: rects, // Metadados para o backend aplicar tarjas/blurs
            rotation: rotation,
            pesoFinal: ocrResult.value || 'N/A' // O peso detectado
        });
        
        // Simulação de upload do arquivo + metadados
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        router.push({ path: '/dashboard', query: { saveSuccess: 'photo' } });

    } catch (e) {
        error.value = e?.data?.message || e?.message || 'Falha ao processar e salvar o registro rápido.';
    } finally {
        isSaving.value = false;
    }
};


// =======================================================
// INTERAÇÃO DO CANVAS (Não alteradas)
// =======================================================

const getCoords = (e) => {
 const rect = overlayCanvas.value.getBoundingClientRect()
 return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

const onDown = (e) => {
  if (!image.value.url) return;
 const pos = getCoords(e)
 const idx = rects.findIndex(r => pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h)
 if (idx !== -1) { moving = true; selected = idx; offsetX = pos.x - rects[idx].x; offsetY = pos.y - rects[idx].y; return }
 drawing = true; startX = pos.x; startY = pos.y
}

const onMove = (e) => {
  if (!image.value.url) return;
 const pos = getCoords(e)
 if (moving && selected !== -1) {
  rects[selected].x = pos.x - offsetX
  rects[selected].y = pos.y - offsetY
  redrawAll()
  return
 }
 if (!drawing) return
 redrawAll()
 const w = pos.x - startX, h = pos.y - startY
 canvasCtx.setLineDash([6, 3])
 canvasCtx.strokeStyle = '#38bdf8'
 canvasCtx.strokeRect(startX, startY, w, h)
}

const onUp = (e) => {
  if (!image.value.url) return;

 if (moving) { moving = false; selected = -1; return }
 if (!drawing) return
 drawing = false
 const pos = getCoords(e)
 const w = pos.x - startX, h = pos.y - startY
 
 const finalX = Math.min(startX, pos.x);
 const finalY = Math.min(startY, pos.y);
 const finalW = Math.abs(w);
 const finalH = Math.abs(h);

 if (finalW > 5 && finalH > 5) { 
 rects.push({ x: finalX, y: finalY, w: finalW, h: finalH, type: mode.value })
 }
 redrawAll()
}


// =======================================================
// CICLO DE VIDA
// =======================================================

onMounted(() => {
const canvas = overlayCanvas.value
if (!canvas) return

canvas.addEventListener('pointerdown', onDown)
canvas.addEventListener('pointermove', onMove)
canvas.addEventListener('pointerup', onUp)
window.addEventListener('resize', resizeCanvasToImage)
});

onUnmounted(() => {
const canvas = overlayCanvas.value
if (canvas) {
 canvas.removeEventListener('pointerdown', onDown)
 canvas.removeEventListener('pointermove', onMove)
 canvas.removeEventListener('pointerup', onUp)
}
window.removeEventListener('resize', resizeCanvasToImage)
});
</script>