// /composables/useTempFiles.ts - V1.1 - Garantindo a inicialização dos Refs no lado do cliente.

import { ref, computed, Ref, ComputedRef } from 'vue';

interface TempFile {
  tempId: string;
  isPrivate: boolean;
  type: 'photo' | 'forma';
}

const TEMP_PHOTO_DATA_KEY = 'tempPhotoFilesData';
const TEMP_FORMA_DATA_KEY = 'tempFormaFilesData';
// As chaves ID não são mais estritamente necessárias se usarmos os dados completos
// mas vamos mantê-las por consistência com o seu código.
const TEMP_PHOTO_IDS_KEY = 'tempPhotoFileIds';
const TEMP_FORMA_IDS_KEY = 'tempFormaFileIds';

// 🚨 Declaramos os Refs fora da função useTempFiles para que eles sejam singleton (estado compartilhado)
// mas inicializamos eles vazios e dependemos da leitura da sessão.
const tempPhotoFiles = ref<TempFile[]>([]);
const tempFormaFiles = ref<TempFile[]>([]);

/**
* Lê os dados de arquivos temporários do sessionStorage.
*/
const loadTempFiles = (): { tempPhotoFiles: TempFile[], tempFormaFiles: TempFile[] } => {
  if (process.client) {
    try {
      const photoDataRaw = sessionStorage.getItem(TEMP_PHOTO_DATA_KEY);
      const formaDataRaw = sessionStorage.getItem(TEMP_FORMA_DATA_KEY);
      
      return {
        tempPhotoFiles: photoDataRaw ? JSON.parse(photoDataRaw) as TempFile[] : [],
        tempFormaFiles: formaDataRaw ? JSON.parse(formaDataRaw) as TempFile[] : [],
      };
    } catch (error) {
      console.error('Erro ao ler dados da sessão:', error);
      return { tempPhotoFiles: [], tempFormaFiles: [] };
    }
  }
  return { tempPhotoFiles: [], tempFormaFiles: [] };
};

/**
* Sincroniza os Refs reativos com os dados mais recentes do sessionStorage.
* 🚨 Esta é a função principal de atualização de estado.
*/
const updateRefs = (): void => {
  if (process.client) {
    const { tempPhotoFiles: loadedPhotos, tempFormaFiles: loadedFormas } = loadTempFiles();
    tempPhotoFiles.value = loadedPhotos;
    tempFormaFiles.value = loadedFormas;
  }
};

/**
* Persiste os arrays de arquivos temporários e seus respectivos IDs no sessionStorage.
*/
const saveTempFiles = (photos: TempFile[], formas: TempFile[]): void => {
  if (process.client) {
    // Salva a estrutura completa 
    sessionStorage.setItem(TEMP_PHOTO_DATA_KEY, JSON.stringify(photos));
    sessionStorage.setItem(TEMP_FORMA_DATA_KEY, JSON.stringify(formas));

    // Salva apenas os IDs 
    const photoIds = photos.map(f => f.tempId);
    const formaIds = formas.map(f => f.tempId);
    sessionStorage.setItem(TEMP_PHOTO_IDS_KEY, JSON.stringify(photoIds));
    sessionStorage.setItem(TEMP_FORMA_IDS_KEY, JSON.stringify(formaIds));
    
    // 🚨 Atualiza os Refs globais imediatamente após salvar
    updateRefs();
  }
};


/**
* Adiciona um novo arquivo temporário à lista correta e salva a sessão.
*/
export const addTempFile = (newFileObject: TempFile): void => {
  // 1. Carrega o estado atual da sessão
  const { tempPhotoFiles: photos, tempFormaFiles: formas } = loadTempFiles();

  // 2. Adiciona o novo arquivo
  if (newFileObject.type === 'photo') {
    photos.push(newFileObject);
  } else if (newFileObject.type === 'forma') {
    formas.push(newFileObject);
  }

  // 3. Salva o novo estado na sessão (e atualiza os refs globais)
  saveTempFiles(photos, formas);
};

/**
* Remove um arquivo temporário da lista e salva a sessão.
*/
export const removeTempFile = (tempId: string, type: 'photo' | 'forma'): void => {
  let { tempPhotoFiles: photos, tempFormaFiles: formas } = loadTempFiles();

  if (type === 'photo') {
    photos = photos.filter(f => f.tempId !== tempId);
  } else if (type === 'forma') {
    formas = formas.filter(f => f.tempId !== tempId);
  }

  saveTempFiles(photos, formas);
};

/**
* Limpa todos os dados de arquivos temporários da sessão (e os Refs reativos).
*/
export const clearAllTempFiles = (): void => {
  if (process.client) {
    sessionStorage.removeItem(TEMP_PHOTO_DATA_KEY);
    sessionStorage.removeItem(TEMP_FORMA_DATA_KEY);
    sessionStorage.removeItem(TEMP_PHOTO_IDS_KEY);
    sessionStorage.removeItem(TEMP_FORMA_IDS_KEY);
    
    // 🚨 Limpa os Refs reativos imediatamente
    tempPhotoFiles.value = [];
    tempFormaFiles.value = [];
  }
};

// 🚨 Chamada de sincronização inicial para garantir que o estado comece correto
// na inicialização do módulo no lado do cliente.
if (process.client) {
    updateRefs();
}


/**
* Retorna os arrays reativos de arquivos temporários.
*/
export const useTempFiles = (): {
  tempPhotoFiles: Ref<TempFile[]>;
  tempFormaFiles: Ref<TempFile[]>;
  allTempFiles: ComputedRef<TempFile[]>;
  syncFromSession: () => void;
} => {
    
  // Exporta a lista consolidada
  const allTempFiles = computed<TempFile[]>(() => [
    ...tempPhotoFiles.value,
    ...tempFormaFiles.value
  ]);

  // Função de sincronização manual (usada nos hooks do componente)
  const syncFromSession = (): void => updateRefs();

  return {
    tempPhotoFiles,
    tempFormaFiles,
    allTempFiles,
    syncFromSession // Exportamos para ser usado no onActivated/onMounted
  };
};