// /utils/imageCompressor.ts - V1.3 - Ajuste final para aceitar Blob|File e garantir retrocompatibilidade com chamadas de 3 argumentos (mantendo os novos padrões).

/**
* Comprime e redimensiona um objeto File/Blob de imagem usando a API Canvas.
* Essencial para evitar exceder o limite de payload (e.g., Vercel) antes do upload.
* @param data O objeto File ou Blob original da imagem.
* @param maxDimension Dimensão máxima (largura ou altura) da imagem final (padrão: 1500px).
* @param quality Qualidade de compressão JPEG (0.0 a 1.0) (padrão: 0.75).
 * @param fileName O nome do arquivo a ser usado no novo objeto File (opcional).
* @returns Novo objeto File comprimido.
*/
export async function compressImage(
  data: Blob | File, 
  maxDimension: number = 1500, // Ajustado para 1500 (novo padrão)
  quality: number = 0.75, // Ajustado para 0.75 (novo padrão)
    fileName?: string // 🚨 ALTERAÇÃO: Torna 'fileName' opcional, mantendo retrocompatibilidade
): Promise<File> {
    
    // 1. Unificar Blob e File e obter o nome do arquivo
    // Se for Blob, cria um File temporário (usando o nome de arquivo padrão se 'fileName' não for fornecido).
    // Se for File, usa o próprio objeto File (para obter o nome original).
    const file = data instanceof File 
        ? data 
        : new File([data], fileName || 'compressed_blob.jpg', { type: data.type || 'image/jpeg', lastModified: Date.now() });
        
    // Se fileName foi fornecido na chamada da função, use ele, senão use o nome original do File/Blob.
    const finalFileName = fileName || file.name || 'compressed_image.jpg';

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
            const compressedFile = new File([blob], finalFileName, { // 🚨 ALTERAÇÃO: Usa finalFileName
              type: 'image/jpeg', // Força JPEG
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg', // Força JPEG
          quality 
        );
      };

      img.onerror = () => reject(new Error('Falha ao carregar a imagem para compressão.'));
    };

    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
  });
}