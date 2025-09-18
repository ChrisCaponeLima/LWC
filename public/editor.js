// editor.js - V1.1
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

// Inicia a seleção da área
imageCanvas.addEventListener('mousedown', (e) => {
    if (originalImage.src) {
        isSelecting = true;
        const rect = imageCanvas.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        
        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
    }
});

// Atualiza o tamanho da seleção enquanto o mouse se move
imageCanvas.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;
    const rect = imageCanvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = currentX - startX;
    const height = currentY - startY;

    selectionBox.style.left = `${Math.min(startX, currentX)}px`;
    selectionBox.style.top = `${Math.min(startY, currentY)}px`;
    selectionBox.style.width = `${Math.abs(width)}px`;
    selectionBox.style.height = `${Math.abs(height)}px`;
});

// Finaliza a seleção e armazena as coordenadas
imageCanvas.addEventListener('mouseup', () => {
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
});

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
        selectionCoords = null; // Reseta as coordenadas de seleção
        alert('Imagem redefinida com sucesso.');
    }
});

// editor.js - Versão 1.2

// ... (todo o resto do seu código permanece igual) ...

// Função para aplicar o efeito (desfoque ou tarja preta)
function applyEffect(effectType) {
    if (!selectionCoords) {
        alert('Por favor, selecione uma área na imagem primeiro.');
        return;
    }

    const { x, y, width, height } = selectionCoords;
    const tempImage = new Image();
    tempImage.src = currentImage.src;

    tempImage.onload = () => {
        // Redesenha a imagem atual no canvas
        ctx.drawImage(tempImage, 0, 0);

        if (effectType === 'blur') {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = width;
            tempCanvas.height = height;

            // Desenha a área selecionada em um canvas temporário
            tempCtx.drawImage(tempImage, x, y, width, height, 0, 0, width, height);

            // Aplica o filtro de desfoque no canvas temporário
            tempCtx.filter = 'blur(20px)';
            tempCtx.drawImage(tempCanvas, 0, 0);

            // Desenha a área desfocada de volta no canvas principal
            ctx.drawImage(tempCanvas, x, y);

        } else if (effectType === 'censor') {
            ctx.fillStyle = 'black';
            ctx.fillRect(x, y, width, height);
        }

        currentImage.src = imageCanvas.toDataURL();
        
        // CORRIGIDO: Agora o download é feito de forma programática.
        downloadButton.href = currentImage.src;
        downloadButton.download = 'edited-image.png'; // Define um nome para o arquivo
        downloadButton.style.display = 'inline-block';
        selectionBox.style.display = 'none';
        selectionCoords = null;
    };
}