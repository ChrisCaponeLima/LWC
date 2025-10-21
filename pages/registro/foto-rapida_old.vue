// /pages/registro/foto-rapida.vue - V2.0 - Mostra texto bruto OCR + corrige desenho dos retângulos (DPR-safe)
<template>
  <NuxtLayout>
    <div>
      <Header pageTitle="Adicionar Imagem" />

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
              
              <!-- Area da Imagem (maior coluna) -->
              <div class="lg:col-span-2">
                <!-- Sticky para manter a imagem visível no mobile/scroll -->
                <div class="sticky top-20 max-h-[70vh] overflow-auto">
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
                            draggable="false"
                          />
                          <!-- Canvas sobreposto: ocupa 100% do container, z-index acima da imagem -->
                          <canvas ref="overlayCanvas" class="absolute top-0 left-0 w-full h-full z-20" style="touch-action: none;"></canvas>
                        </div>
                      </div>
                      
                      <div class="text-sm text-gray-500 mt-2 flex items-center gap-2">
                        <i class="fas fa-info-circle text-gray-400"></i>
                        Use as ferramentas ao lado para aplicar tarjas ou embaçamento.
                      </div>
                  </div>
                </div>
              </div>

              <!-- Painel de Ferramentas -->
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

                    <p v-if="ocrResult" class="mt-2 text-sm text-teal-700 font-bold">Peso Detectado: <strong>{{ ocrResult }}</strong></p>
                    <p v-if="ocrError" class="mt-2 text-sm text-red-500">Falha no OCR: {{ ocrError }}</p>

                    <!-- Campo de debug: mostra texto bruto detectado pelo OCR -->
                    <div class="mt-3">
                      <label class="text-sm font-medium text-gray-600">Texto detectado (OCR bruto)</label>
                      <textarea v-model="ocrRaw" rows="5" readonly class="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm font-mono bg-gray-50"></textarea>
                    </div>
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

definePageMeta({ middleware: ['auth'] });

const authStore = useAuthStore();
const router = useRouter();
const config = useRuntimeConfig();

// Estado
const image = ref({ url: null, description: null, originalFile: null });
const error = ref(null);
const isSaving = ref(false);

// Análise / OCR
const isAnalyzing = ref(false);
const analyzingFeature = ref(null);
const ocrResult = ref(null);
const ocrError = ref(null);
// campo solicitado: texto bruto retornado pelo OCR
const ocrRaw = ref('');

// Canvas / imagem
const baseImage = ref(null);
const overlayCanvas = ref(null);
let canvasCtx = null;
let dpr = 1;
let originalImageURL = null;
let rotation = 0;

// Edição
const mode = ref('blur');
const rects = reactive([]);

// Interação
let drawing = false, moving = false, startX = 0, startY = 0, offsetX = 0, offsetY = 0, selected = -1;

// Upload
const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        error.value = null;
        image.value.originalFile = file;
        image.value.description = file.name;
        
        const url = URL.createObjectURL(file);
        image.value.url = url;
        originalImageURL = url;
        
        rotation = 0;
        rects.splice(0, rects.length);
        ocrResult.value = null;
        ocrError.value = null;
        ocrRaw.value = '';
    } else if (file) {
        error.value = 'Por favor, selecione um arquivo de imagem válido.';
    }
};

// -------------------- Canvas helpers --------------------
const onImageLoad = async () => {
    await nextTick();
    resizeCanvasToImage();
};

const resizeCanvasToImage = () => {
    const img = baseImage.value;
    const canvas = overlayCanvas.value;
    if (!img || !canvas) return;

    const rect = img.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;

    // Define tamanho real do canvas (device pixels)
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    // Define estilo CSS igual ao tamanho visual
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Posição
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '20';
    canvas.style.pointerEvents = 'auto';
    canvas.style.touchAction = 'none';

    // Cria contexto e aplica transform para trabalhar em coordenadas CSS
    canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    // Ajuste: reseta transform e aplica escala DPR para que possamos desenhar em CSS pixels
    canvasCtx.setTransform(1,0,0,1,0,0);
    canvasCtx.clearRect(0,0,canvas.width,canvas.height);
    canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    redrawAll();
};

const redrawAll = () => {
    if (!canvasCtx) return;
    const canvas = canvasCtx.canvas;

    // Limpa em device pixels de forma segura:
    canvasCtx.save();
    canvasCtx.setTransform(1,0,0,1,0,0);
    canvasCtx.clearRect(0,0,canvas.width,canvas.height);
    canvasCtx.restore();

    // Reaplica escala DPR (para desenhar em CSS coords)
    canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Desenha os retângulos (usando coordenadas CSS, porque ctx está escalado)
    rects.forEach(r => {
        if (r.type === 'stripe') {
            canvasCtx.fillStyle = 'rgba(0,0,0,0.95)';
            canvasCtx.fillRect(r.x, r.y, r.w, r.h);
        } else if (r.type === 'blur') {
            canvasCtx.save();
            canvasCtx.filter = 'blur(6px)';
            // desenha um overlay sem cobrir totalmente a imagem (visual)
            canvasCtx.fillStyle = 'rgba(255,255,255,0.7)';
            canvasCtx.fillRect(r.x, r.y, r.w, r.h);
            canvasCtx.restore();
        }
    });
};

// -------------------- Modos / utilidades --------------------
const setMode = (newMode) => { mode.value = newMode };
const clearEffects = () => { rects.splice(0, rects.length); redrawAll(); };
const removeRect = (idx) => { rects.splice(idx, 1); redrawAll(); };
const resetAll = () => {
    if (image.value.originalFile) {
        const url = URL.createObjectURL(image.value.originalFile);
        image.value.url = url;
        originalImageURL = url;
        rotation = 0;
        clearEffects();
        ocrResult.value = null;
        ocrError.value = null;
        ocrRaw.value = '';
    }
};
const rotateImage = () => {
    rotation = (rotation + 90) % 360;
    if (baseImage.value) {
        baseImage.value.style.transform = `rotate(${rotation}deg)`;
        baseImage.value.style.transformOrigin = 'center center';
    }
    resizeCanvasToImage();
};
const startCrop = () => { alert('Funcionalidade de Crop deve ser implementada com biblioteca (ex: cropperjs).'); };

// -------------------- Detect People (simulação) --------------------
const detectPeople = async () => {
    if (!image.value.originalFile) return;
    isAnalyzing.value = true;
    analyzingFeature.value = 'people';

    try {
        console.log("Chamando API de detecção de pessoas (simulada)...");
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Coordenadas em CSS pixels (exemplo)
        rects.push({ x: 20, y: 20, w: 120, h: 160, type: 'blur' });
        redrawAll();
        alert('Detecção simulada: Um retângulo de blur foi adicionado no canto superior esquerdo.');
    } catch (e) {
        console.error('Erro na detecção de pessoas:', e);
        error.value = 'Falha ao tentar detectar pessoas.';
    } finally {
        isAnalyzing.value = false;
        analyzingFeature.value = null;
    }
};

// -------------------- OCR (melhor handling) --------------------
const performOcr = async () => {
    if (!image.value.originalFile) return;
    isAnalyzing.value = true;
    analyzingFeature.value = 'ocr';
    ocrResult.value = null;
    ocrError.value = null;
    ocrRaw.value = '';

    const token = authStore.token;
    if (!token) {
        ocrError.value = 'Autenticação necessária.';
        isAnalyzing.value = false;
        analyzingFeature.value = null;
        return;
    }

    try {
        const fd = new FormData();
        fd.append('file', image.value.originalFile);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000); // 20s

        const base = config.public.apiBaseUrl ? config.public.apiBaseUrl.replace(/\/$/, '') : '';
        const url = `${base}/api/ocr/peso-balanca`;

        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: fd,
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!resp.ok) {
            let bodyText = '';
            try { bodyText = await resp.text(); } catch(e) { /* noop */ }
            ocrError.value = `Serviço OCR retornou erro ${resp.status}. ${bodyText ? `Resposta: ${bodyText}` : ''}`;
            console.error('OCR erro response:', resp.status, bodyText);
            return;
        }

        const data = await resp.json();

        // Preenche texto bruto (se disponível) — campo solicitado
        if (data?.parsedText) {
            ocrRaw.value = data.parsedText;
        } else if (data?.parsedTextRaw) {
            ocrRaw.value = data.parsedTextRaw;
        } else if (typeof data === 'string') {
            ocrRaw.value = data;
        }

        if (data?.pesoDetectado) {
            ocrResult.value = String(data.pesoDetectado);
            console.log(`OCR Concluído. Peso detectado: ${ocrResult.value}`);
        } else {
            ocrError.value = data?.message || 'Texto detectado, mas nenhum peso válido encontrado.';
            console.warn('OCR sem peso detectado. Response payload:', data);
        }
    } catch (e) {
        if (e.name === 'AbortError') {
            ocrError.value = 'Timeout: o serviço OCR demorou muito para responder.';
        } else {
            ocrError.value = e?.message || 'Erro de comunicação com o serviço OCR.';
        }
        console.error('Erro no OCR (cliente):', e);
    } finally {
        isAnalyzing.value = false;
        analyzingFeature.value = null;
    }
};

// -------------------- Saída / Salvar --------------------
const downloadImage = () => { alert('Funcionalidade de Download precisa renderizar a imagem + canvas (build final).') };

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
        console.log('Dados a serem salvos:', {
            imageFile: image.value.originalFile?.name || null,
            effects: rects,
            rotation,
            pesoFinal: ocrResult.value || null
        });

        // Simula upload
        await new Promise(resolve => setTimeout(resolve, 1200));

        router.push({ path: '/dashboard', query: { saveSuccess: 'photo' } });
    } catch (e) {
        error.value = e?.message || 'Falha ao processar e salvar o registro rápido.';
    } finally {
        isSaving.value = false;
    }
};

// -------------------- Interação do Canvas (pointer events) --------------------
const getCoords = (e) => {
 const canvas = overlayCanvas.value;
 if (!canvas) return { x: 0, y: 0 };
 const rect = canvas.getBoundingClientRect();
 return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

const onDown = (e) => {
  if (!image.value.url) return;
  e.preventDefault();
  const pos = getCoords(e);
  const idx = rects.findIndex(r => pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h);
  if (idx !== -1) { moving = true; selected = idx; offsetX = pos.x - rects[idx].x; offsetY = pos.y - rects[idx].y; return; }
  drawing = true; startX = pos.x; startY = pos.y;
}

const onMove = (e) => {
  if (!image.value.url) return;
  e.preventDefault();
  const pos = getCoords(e);
  if (moving && selected !== -1) {
    rects[selected].x = pos.x - offsetX;
    rects[selected].y = pos.y - offsetY;
    redrawAll();
    return;
  }
  if (!drawing) return;
  redrawAll();
  const w = pos.x - startX, h = pos.y - startY;
  if (canvasCtx) {
    canvasCtx.save();
    // já estamos com transform DPR no ctx
    canvasCtx.setLineDash([6,3]);
    canvasCtx.strokeStyle = '#38bdf8';
    canvasCtx.strokeRect(startX, startY, w, h);
    canvasCtx.restore();
  }
}

const onUp = (e) => {
  if (!image.value.url) return;
  e.preventDefault();
  if (moving) { moving = false; selected = -1; return; }
  if (!drawing) return;
  drawing = false;
  const pos = getCoords(e);
  const finalX = Math.min(startX, pos.x);
  const finalY = Math.min(startY, pos.y);
  const finalW = Math.abs(pos.x - startX);
  const finalH = Math.abs(pos.y - startY);
  if (finalW > 5 && finalH > 5) {
    rects.push({ x: finalX, y: finalY, w: finalW, h: finalH, type: mode.value });
  }
  redrawAll();
}

// -------------------- Ciclo de vida --------------------
onMounted(() => {
  const canvas = overlayCanvas.value;
  if (!canvas) return;

  canvas.addEventListener('pointerdown', onDown, { passive: false });
  canvas.addEventListener('pointermove', onMove, { passive: false });
  canvas.addEventListener('pointerup', onUp, { passive: false });
  canvas.addEventListener('pointercancel', onUp, { passive: false });

  window.addEventListener('resize', resizeCanvasToImage);
});

onUnmounted(() => {
  const canvas = overlayCanvas.value;
  if (canvas) {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
  }
  window.removeEventListener('resize', resizeCanvasToImage);
});
</script>
