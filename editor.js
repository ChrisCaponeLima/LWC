const imageUpload = document.getElementById('image-upload');
const imageCanvas = document.getElementById('image-canvas');
const ctx = imageCanvas.getContext('2d');
const selectionBox = document.getElementById('selection-box');
const blurButton = document.getElementById('blur-button');
const censorButton = document.getElementById('censor-button');
const downloadButton = document.getElementById('download-button');

let isSelecting = false;
let startX, startY;
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
                // Salva a imagem original como o estado atual
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
        const scaleX = imageCanvas.width / rect.width;
        const scaleY = imageCanvas.height / rect.height;
        startX = (e.clientX - rect.left) * scaleX;
        startY = (e.clientY - rect.top) * scaleY;
        
        selectionBox.style.left = `${e.clientX - rect.left}px`;
        selectionBox.style.top = `${e.clientY - rect.top}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
    }
});

// Atualiza o tamanho da seleção
imageCanvas.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;
    const rect = imageCanvas.getBoundingClientRect();
    const scaleX = imageCanvas.width / rect.width;
    const scaleY = imageCanvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const width = currentX - startX;
    const height = currentY - startY;

    selectionBox.style.left = `${Math.min(startX, currentX) / scaleX}px`;
    selectionBox.style.top = `${Math.min(startY, currentY) / scaleY}px`;
    selectionBox.style.width = `${Math.abs(width) / scaleX}px`;
    selectionBox.style.height = `${Math.abs(height) / scaleY}px`;
});

// Finaliza a seleção
imageCanvas.addEventListener('mouseup', () => {
    isSelecting = false;
});

// Aplica o desfoque na área selecionada
blurButton.addEventListener('click', () => {
    applyEffect('blur');
});

// Aplica a tarja preta na área selecionada
censorButton.addEventListener('click', () => {
    applyEffect('censor');
});

function applyEffect(effectType) {
    const rect = selectionBox.getBoundingClientRect();
    const canvasRect = imageCanvas.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0 || !currentImage.src) {
        alert('Por favor, selecione uma área na imagem primeiro.');
        return;
    }

    // A principal mudança está aqui:
    // 1. Cria uma nova imagem a partir do estado atual do canvas.
    let tempImage = new Image();
    tempImage.src = currentImage.src;

    tempImage.onload = () => {
        // 2. Redesenha o estado atual no canvas.
        ctx.drawImage(tempImage, 0, 0, imageCanvas.width, imageCanvas.height);

        const scaleX = imageCanvas.width / canvasRect.width;
        const scaleY = imageCanvas.height / canvasRect.height;
        const x = (rect.left - canvasRect.left) * scaleX;
        const y = (rect.top - canvasRect.top) * scaleY;
        const width = rect.width * scaleX;
        const height = rect.height * scaleY;

        if (effectType === 'blur') {
            // Código do desfoque (mantido)
            const imageData = ctx.getImageData(x, y, width, height);
            const data = imageData.data;
            const radius = 10;
            
            for (let i = 0; i < data.length; i += 4) {
                let r = 0, g = 0, b = 0, count = 0;
                for (let dx = -radius; dx <= radius; dx++) {
                    for (let dy = -radius; dy <= radius; dy++) {
                        const pixelX = Math.min(width - 1, Math.max(0, (i/4 % width) + dx));
                        const pixelY = Math.min(height - 1, Math.max(0, Math.floor(i/4 / width) + dy));
                        const newIndex = (pixelY * width + pixelX) * 4;
                        if (newIndex >= 0 && newIndex < data.length) {
                            r += data[newIndex];
                            g += data[newIndex + 1];
                            b += data[newIndex + 2];
                            count++;
                        }
                    }
                }
                data[i] = r / count;
                data[i + 1] = g / count;
                data[i + 2] = b / count;
            }
            ctx.putImageData(imageData, x, y);

        } else if (effectType === 'censor') {
            // Código da tarja preta (mantido)
            ctx.fillStyle = 'black';
            ctx.fillRect(x, y, width, height);
        }

        // 3. Salva o novo estado da imagem.
        currentImage.src = imageCanvas.toDataURL();
        
        downloadButton.href = currentImage.src;
        downloadButton.style.display = 'inline-block';
        selectionBox.style.display = 'none'; // Esconde a caixa de seleção
    };
}
