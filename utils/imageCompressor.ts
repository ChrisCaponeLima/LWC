// /utils/imageCompressor.ts - V1.1 - Conversão para TypeScript e adição de tipagem.

/**
 * Comprime e redimensiona um objeto File de imagem usando a API Canvas.
 * Isso é essencial para evitar exceder o limite de payload (e.g., Vercel) antes do upload.
 * * @param file O objeto File original da imagem.
 * @param maxDimension Dimensão máxima (largura ou altura) da imagem final (padrão: 1200px).
 * @param quality Qualidade de compressão JPEG (0.0 a 1.0) (padrão: 0.8).
 * @returns Novo objeto File comprimido.
 */
export async function compressImage(
    file: File, 
    maxDimension: number = 1200, 
    quality: number = 0.8
): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        // Leitura do arquivo como Data URL para criar o objeto Image
        reader.readAsDataURL(file);

        reader.onload = (event: ProgressEvent<FileReader>) => {
            // Utilizamos a asssertion 'as string' pois sabemos que readAsDataURL retorna um string.
            const dataUrl = event.target?.result as string; 
            const img = new Image();
            img.src = dataUrl;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 1. Lógica de Redimensionamento: Evita imagens extremamente grandes
                if (width > height) {
                    if (width > maxDimension) {
                        height *= maxDimension / width;
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width *= maxDimension / height;
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // O '!' garante que o contexto 2d será obtido, pois estamos em um ambiente de navegador.
                const ctx = canvas.getContext('2d')!; 
                ctx.drawImage(img, 0, 0, width, height);

                // 2. Compressão: toBlob realiza a codificação e compressão com a qualidade especificada
                canvas.toBlob(
                    (blob: Blob | null) => {
                        if (!blob) {
                            reject(new Error("Falha ao criar o Blob comprimido."));
                            return;
                        }
                        
                        // Cria um novo objeto File para ser enviado
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    },
                    // Manter PNG se for PNG, senão usar JPEG (padrão para compressão por qualidade)
                    file.type === 'image/png' ? 'image/png' : 'image/jpeg', 
                    quality 
                );
            };

            img.onerror = () => reject(new Error('Falha ao carregar a imagem para compressão.'));
        };

        reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    });
}