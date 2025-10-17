// /server/utils/ocr.ts - V1.3 - Solução de Contingência para o erro "Must supply api_key".

import { type Multipart } from 'h3';
// Importa o objeto Cloudinary configurado, mas também o SDK para reconfiguração Just-In-Time (JIT)
import cloudinary, { bufferToDataURI } from '~/server/utils/cloudinary'; 
import { v2 as cloudinarySDK } from 'cloudinary'; // Necessário para reconfigurar a instância

// ----------------------------------------------------
// 1. Helpers de Texto (Não Alterados)
// ----------------------------------------------------

function extractWeightFromText(fullText: string): string | null {
    if (!fullText) return null;
    const cleanedText = fullText
        .toUpperCase()
        .replace(/(KG|LBS|LB|G|GR|K|S|:|;|\s)/g, '')
        .replace(/,/g, '.')
        .trim();
    const match = cleanedText.match(/(\d+\.\d+|\d+)/);
    if (match && match[0]) {
        let numericValue = parseFloat(match[0]);
        if (numericValue >= 30 && numericValue <= 300) {
            return `${numericValue.toFixed(1)} kg`;
        }
    }
    return null;
}

// ----------------------------------------------------
// 2. Função Principal de OCR (Com Reconfiguração JIT)
// ----------------------------------------------------

export async function performOcrOnCloudinary(filePart: Multipart): Promise<{ pesoDetectado: string | null, message: string }> {
    
    // 🚨 PASSO ESSENCIAL DE CONTINGÊNCIA:
    // Garante que o SDK do Cloudinary seja configurado *agora* lendo o process.env, 
    // prevenindo o erro de "api_key" ausente devido ao timing do ambiente Nitro.
    if (!cloudinarySDK.config().api_key) {
        cloudinarySDK.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
        });
    }

    const dataUri = bufferToDataURI(filePart.data, filePart.type || 'image/jpeg');
    let publicId: string | undefined;

    try {
        // Upload Temporário e Processamento OCR (usando a instância reconfigurada)
        const uploadResult = await cloudinarySDK.uploader.upload(dataUri, {
            folder: 'temp_ocr_uploads',
            resource_type: 'image',
            raw_convert: 'ocr_text', // Parâmetro para ativar o Add-on OCR
        });

        publicId = uploadResult.public_id;
        
        // Extração do Texto OCR
        const ocrData = uploadResult.info?.raw_convert?.[0]?.data;
        
        if (!ocrData || ocrData.status !== 'success' || !ocrData.text) {
             return { pesoDetectado: null, message: 'O Cloudinary não conseguiu extrair texto da imagem.' };
        }
        
        const detectedWeight = extractWeightFromText(ocrData.text);

        return {
            pesoDetectado: detectedWeight,
            message: detectedWeight ? 'OCR realizado com sucesso.' : 'Texto encontrado, mas nenhum peso válido detectado.'
        };

    } catch (error: any) {
        // Agora, o erro reportado será um erro real do Cloudinary sobre a transação.
        console.error('ERRO DETALHADO NO CLOUDINARY:', error); 
        throw new Error(error.message || 'Falha ao processar o OCR. Verifique as credenciais ou o limite de uso do Add-on.');
    } finally {
        // Limpeza: Exclui a imagem temporária (usando a instância reconfigurada)
        if (publicId) {
            await cloudinarySDK.uploader.destroy(publicId, { resource_type: 'image' }).catch(e => {
                console.error('Falha na limpeza do arquivo temporário do Cloudinary:', e);
            });
        }
    }
}