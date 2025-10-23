// /composables/useTempFiles.ts - V1.0 - Lógica centralizada de manipulação de SessionStorage em TypeScript.

import { ref, computed, Ref, ComputedRef } from 'vue';

interface TempFile {
    tempId: string;
    isPrivate: boolean;
    type: 'photo' | 'forma';
}

const TEMP_PHOTO_DATA_KEY = 'tempPhotoFilesData';
const TEMP_FORMA_DATA_KEY = 'tempFormaFilesData';
const TEMP_PHOTO_IDS_KEY = 'tempPhotoFileIds';
const TEMP_FORMA_IDS_KEY = 'tempFormaFileIds';

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
 * Persiste os arrays de arquivos temporários e seus respectivos IDs no sessionStorage.
 */
const saveTempFiles = (tempPhotoFiles: TempFile[], tempFormaFiles: TempFile[]): void => {
    if (process.client) {
        // Salva a estrutura completa (para a lista do ImageEditor)
        sessionStorage.setItem(TEMP_PHOTO_DATA_KEY, JSON.stringify(tempPhotoFiles));
        sessionStorage.setItem(TEMP_FORMA_DATA_KEY, JSON.stringify(tempFormaFiles));

        // Salva apenas os IDs (para o FormData do Records API)
        const photoIds = tempPhotoFiles.map(f => f.tempId);
        const formaIds = tempFormaFiles.map(f => f.tempId);
        sessionStorage.setItem(TEMP_PHOTO_IDS_KEY, JSON.stringify(photoIds));
        sessionStorage.setItem(TEMP_FORMA_IDS_KEY, JSON.stringify(formaIds));
    }
};

/**
 * Adiciona um novo arquivo temporário à lista correta e salva a sessão.
 */
export const addTempFile = (newFileObject: TempFile): void => {
    if (!process.client) return;

    // 1. Carrega o estado atual da sessão
    const { tempPhotoFiles, tempFormaFiles } = loadTempFiles();

    // 2. Adiciona o novo arquivo
    if (newFileObject.type === 'photo') {
        tempPhotoFiles.push(newFileObject);
    } else if (newFileObject.type === 'forma') {
        tempFormaFiles.push(newFileObject);
    }

    // 3. Salva o novo estado na sessão
    saveTempFiles(tempPhotoFiles, tempFormaFiles);
};

/**
 * Remove um arquivo temporário da lista e salva a sessão.
 */
export const removeTempFile = (tempId: string, type: 'photo' | 'forma'): void => {
    if (!process.client) return;

    let { tempPhotoFiles, tempFormaFiles } = loadTempFiles();

    if (type === 'photo') {
        tempPhotoFiles = tempPhotoFiles.filter(f => f.tempId !== tempId);
    } else if (type === 'forma') {
        tempFormaFiles = tempFormaFiles.filter(f => f.tempId !== tempId);
    }

    saveTempFiles(tempPhotoFiles, tempFormaFiles);
};

/**
 * Limpa todos os dados de arquivos temporários da sessão.
 */
export const clearAllTempFiles = (): void => {
    if (process.client) {
        sessionStorage.removeItem(TEMP_PHOTO_DATA_KEY);
        sessionStorage.removeItem(TEMP_FORMA_DATA_KEY);
        sessionStorage.removeItem(TEMP_PHOTO_IDS_KEY);
        sessionStorage.removeItem(TEMP_FORMA_IDS_KEY);
    }
};

/**
 * Retorna os arrays reativos de arquivos temporários, sincronizados com a sessão.
 */
export const useTempFiles = (): {
    tempPhotoFiles: Ref<TempFile[]>;
    tempFormaFiles: Ref<TempFile[]>;
    allTempFiles: ComputedRef<TempFile[]>;
    syncFromSession: () => void;
} => {
    // Refs locais para o componente (a UI)
    const tempPhotoFiles = ref<TempFile[]>([]);
    const tempFormaFiles = ref<TempFile[]>([]);

    const updateRefs = (): void => {
        const { tempPhotoFiles: loadedPhotos, tempFormaFiles: loadedFormas } = loadTempFiles();
        tempPhotoFiles.value = loadedPhotos;
        tempFormaFiles.value = loadedFormas;
    };
    
    // Inicializa a primeira leitura
    updateRefs();

    // Exporta a lista consolidada
    const allTempFiles = computed<TempFile[]>(() => [
        ...tempPhotoFiles.value,
        ...tempFormaFiles.value
    ]);

    // Função de sincronização manual (usada em onMounted, onFocus e após mutações)
    const syncFromSession = (): void => updateRefs();

    return {
        tempPhotoFiles,
        tempFormaFiles,
        allTempFiles,
        syncFromSession
    };
};