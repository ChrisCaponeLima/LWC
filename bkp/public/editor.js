// editor.js V4.0 - Corrige o QuotaExceededError limpando o localStorage antes de salvar.

const imageCanvas = document.getElementById('image-canvas');
const ctx = imageCanvas.getContext('2d');
const selectionBox = document.getElementById('selection-box');
const blurButton = document.getElementById('blur-button');
const censorButton = document.getElementById('censor-button');
const resetButton = document.getElementById('reset-button');
const uploadBtn = document.getElementById('image-upload');

const saveAndReturnBtn = document.getElementById('saveAndReturnBtn');
const downloadImageBtn = document.getElementById('downloadImageBtn');
const saveButtonsContainer = document.getElementById('save-buttons-container');

let isSelecting = false;
let startX, startY;
let selectionCoords = null;
let originalImage = new Image();
let currentImage = new Image();

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Carrega a imagem do localStorage ao invés do input de arquivo
window.addEventListener('load', () => {
    const imageData = localStorage.getItem('imageData');
    if (imageData) {
        originalImage.src = imageData;
        originalImage.onload = () => {
            imageCanvas.width = originalImage.width;
            imageCanvas.height = originalImage.height;
            ctx.drawImage(originalImage, 0, 0);
            currentImage.src = imageCanvas.toDataURL();
            if(uploadBtn) uploadBtn.style.display = 'none';
            selectionBox.style.display = 'none';
        };
    } else if (uploadBtn) {
        uploadBtn.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    originalImage.src = event.target.result;
                    originalImage.onload = () => {
                        imageCanvas.width = originalImage.width;
                        imageCanvas.height = originalImage.height;
                        ctx.drawImage(originalImage, 0, 0);
                        currentImage.src = imageCanvas.toDataURL();
                        selectionBox.style.display = 'none';
                    };
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// FUNÇÕES DE SELEÇÃO
function startSelection(clientX, clientY) {
    if (originalImage.src) {
        isSelecting = true;
        const rect = imageCanvas.getBoundingClientRect();
        startX = clientX - rect.left;
        startY = clientY - rect.top;

        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
    }
}

function updateSelection(clientX, clientY) {
    if (!isSelecting) return;
    const rect = imageCanvas.getBoundingClientRect();
    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    const width = currentX - startX;
    const height = currentY - startY;

    selectionBox.style.left = `${Math.min(startX, currentX)}px`;
    selectionBox.style.top = `${Math.min(startY, currentY)}px`;
    selectionBox.style.width = `${Math.abs(width)}px`;
    selectionBox.style.height = `${Math.abs(height)}px`;
}

function endSelection() {
    isSelecting = false;
    const rect = selectionBox.getBoundingClientRect();
    const canvasRect = imageCanvas.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
        const scaleX = imageCanvas.width / canvasRect.width;
        const scaleY = imageCanvas.height / canvasRect.height;
        selectionCoords = {
            x: (rect.left - canvasRect.left) * scaleX,
            y: (rect.top - canvasRect.top) * scaleY,
            width: rect.width * scaleX,
            height: rect.height * scaleY
        };
    }
}

// Eventos mouse/toque
imageCanvas.addEventListener('mousedown', (e) => startSelection(e.clientX, e.clientY));
imageCanvas.addEventListener('mousemove', (e) => updateSelection(e.clientX, e.clientY));
imageCanvas.addEventListener('mouseup', endSelection);

imageCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startSelection(touch.clientX, touch.clientY);
}, { passive: false });

imageCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    updateSelection(touch.clientX, touch.clientY);
}, { passive: false });

imageCanvas.addEventListener('touchend', endSelection);

// Botões de Efeito
blurButton.addEventListener('click', () => {
    applyEffect('blur');
});
censorButton.addEventListener('click', () => {
    applyEffect('censor');
});
resetButton.addEventListener('click', () => {
    if (originalImage.src) {
        ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        ctx.drawImage(originalImage, 0, 0);
        currentImage.src = imageCanvas.toDataURL();
        saveButtonsContainer.style.display = 'none';
        selectionBox.style.display = 'none';
        selectionCoords = null;
        alert('Imagem redefinida com sucesso.');
    }
});

// Lógica dos Botões de Salvar
saveAndReturnBtn.addEventListener('click', () => {
    localStorage.clear();
    localStorage.setItem('editedImageData', currentImage.src);
    window.location.href = 'index.html';
});

downloadImageBtn.addEventListener('click', () => {
    downloadImageBtn.href = currentImage.src;
    downloadImageBtn.download = 'edited-image.png';
});


// Funções auxiliares
function supportsCanvasFilter() {
    return typeof ctx.filter !== 'undefined';
}

function fallbackDownscaleBlur(srcCanvas, destX, destY, destW, destH, strength = 8) {
    const smallW = Math.max(1, Math.round(destW / strength));
    const smallH = Math.max(1, Math.round(destH / strength));
    const tmp = document.createElement('canvas');
    tmp.width = smallW;
    tmp.height = smallH;
    const tmpCtx = tmp.getContext('2d');

    tmpCtx.drawImage(srcCanvas, destX, destY, destW, destH, 0, 0, smallW, smallH);

    // repete para intensificar
    for (let i = 0; i < 2; i++) {
        tmpCtx.drawImage(tmp, 0, 0, smallW, smallH, 0, 0, smallW, smallH);
    }

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tmp, 0, 0, smallW, smallH, destX, destY, destW, destH);
    ctx.restore();
}

// Aplica efeitos
function applyEffect(effectType) {
    if (!selectionCoords) {
        alert('Por favor, selecione uma área na imagem primeiro.');
        return;
    }

    const { x, y, width, height } = selectionCoords;
    const tempImage = new Image();
    tempImage.src = currentImage.src;

    tempImage.onload = () => {
        ctx.drawImage(tempImage, 0, 0);

        if (effectType === 'blur') {
            const blurAmount = 50; // ajuste aqui
            if (!supportsCanvasFilter() || isMobile) {
                const strength = Math.max(6, Math.round(blurAmount / 3));
                fallbackDownscaleBlur(imageCanvas, x, y, width, height, strength);
            } else {
                ctx.save();
                ctx.filter = `blur(${blurAmount}px)`;
                ctx.drawImage(imageCanvas, x, y, width, height, x, y, width, height);
                ctx.restore();
            }
        } else if (effectType === 'censor') {
            ctx.fillStyle = 'black';
            ctx.fillRect(x, y, width, height);
        }

        currentImage.src = imageCanvas.toDataURL();
        
        // Agora, mostra o contêiner com os dois botões
        saveButtonsContainer.style.display = 'flex';
        selectionBox.style.display = 'none';
        selectionCoords = null;
    };
}