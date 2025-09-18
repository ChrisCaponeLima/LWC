// editor.js - V1.5
const imageUpload = document.getElementById('image-upload');
const imageCanvas = document.getElementById('image-canvas');
const ctx = imageCanvas.getContext('2d');
const selectionBox = document.getElementById('selection-box');
const blurButton = document.getElementById('blur-button');
const censorButton = document.getElementById('censor-button');
const downloadButton = document.getElementById('download-button');
const resetButton = document.getElementById('reset-button');

let isSelecting = false;
let startX, startY;
let selectionCoords = null;
let originalImage = new Image();
let currentImage = new Image();

// Carrega a imagem do input de arquivo
imageUpload.addEventListener('change', (e) => {
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
                downloadButton.style.display = 'none';
            };
        };
        reader.readAsDataURL(file);
    }
});

// FUNÇÕES DE MANIPULAÇÃO UNIFICADAS PARA MOUSE E TOQUE
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

// Eventos de MOUSE
imageCanvas.addEventListener('mousedown', (e) => startSelection(e.clientX, e.clientY));
imageCanvas.addEventListener('mousemove', (e) => updateSelection(e.clientX, e.clientY));
imageCanvas.addEventListener('mouseup', endSelection);

// Eventos de TOQUE
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

// Aplica o desfoque na área selecionada
blurButton.addEventListener('click', () => {
    applyEffect('blur');
});

// Aplica a tarja preta na área selecionada
censorButton.addEventListener('click', () => {
    applyEffect('censor');
});

// Reseta a imagem para a versão original
resetButton.addEventListener('click', () => {
    if (originalImage.src) {
        ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        ctx.drawImage(originalImage, 0, 0);
        currentImage.src = imageCanvas.toDataURL();
        downloadButton.style.display = 'none';
        selectionBox.style.display = 'none';
        selectionCoords = null;
        alert('Imagem redefinida com sucesso.');
    }
});

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
            // NOVO ALGORITMO DE DESFOQUE: ROBUSTO E FUNCIONAL EM TODOS OS NAVEGADORES
            
            // 1. Pega os dados da imagem na área selecionada
            const imageData = ctx.getImageData(x, y, width, height);
            const data = imageData.data;
            const originalData = new Uint8ClampedArray(data); // Cria uma cópia dos dados originais
            const radius = 10; // Nível de desfoque
            
            // 2. Aplica o desfoque pixel por pixel
            for (let i = 0; i < data.length; i += 4) {
                let r = 0, g = 0, b = 0, count = 0;
                const px = (i / 4) % width;
                const py = Math.floor((i / 4) / width);

                for (let dx = -radius; dx <= radius; dx++) {
                    for (let dy = -radius; dy <= radius; dy++) {
                        const newX = px + dx;
                        const newY = py + dy;

                        if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                            const newIndex = (newY * width + newX) * 4;
                            r += originalData[newIndex];
                            g += originalData[newIndex + 1];
                            b += originalData[newIndex + 2];
                            count++;
                        }
                    }
                }
                data[i] = r / count;
                data[i + 1] = g / count;
                data[i + 2] = b / count;
            }

            // 3. Coloca os dados de volta na imagem
            ctx.putImageData(imageData, x, y);

        } else if (effectType === 'censor') {
            ctx.fillStyle = 'black';
            ctx.fillRect(x, y, width, height);
        }

        currentImage.src = imageCanvas.toDataURL();
        
        downloadButton.href = currentImage.src;
        downloadButton.download = 'edited-image.png';
        downloadButton.style.display = 'inline-block';
        selectionBox.style.display = 'none';
        selectionCoords = null;
    };
}