// /server/api/ocr/peso-balanca.post.ts - V45 - Ajustes Finais de Limiar

import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import sharp from 'sharp'

// --- CONFIGURAÇÃO DA ÁREA E DIMENSÕES ---
const CROP_AREA = { left: 150, top: 200, width: 600, height: 180 };
const RESIZED_WIDTH = 600;
const RESIZED_HEIGHT = 180;
const DIGIT_POSITIONS = [
    { x: 30, width: 150 },   // Dígito 1
    { x: 190, width: 150 },  // Dígito 2
    { x: 370, width: 150 }   // Dígito 3
];

const IS_ON = 255;
// LIMIAR CRÍTICO: 0.75 (Precisa ser muito branco para ser considerado aceso)
const ACTIVATION_THRESHOLD = 0.75; 

// Mapeamento dos 7 segmentos (A-G)
const SEGMENTS_MAP: { [key: string]: string } = {
    '1110111': '0', '0010010': '1', '1011110': '2', '1011011': '3', 
    '0111010': '4', '1101011': '5', '1101111': '6', '1010010': '7', 
    '1111111': '8', '1111011': '9',
};


// --- FUNÇÕES AUXILIARES (V45) ---

const getAreaAverage = (xStart: number, yStart: number, width: number, height: number, buffer: Buffer, bufferWidth: number): number => {
    let sum = 0;
    let count = 0;
    for (let y = yStart; y < yStart + height; y++) {
        for (let x = xStart; x < xStart + width; x++) {
            const index = (y * bufferWidth) + x;
            if (index >= 0 && index < buffer.length) {
                sum += buffer[index]; 
                count++;
            }
        }
    }
    return count > 0 ? sum / count : 0;
};

const readDigit = (xOffset: number, digitWidth: number, processedBuffer: Buffer): string => {
    const digitHeight = RESIZED_HEIGHT; 
    
    const w = Math.round(digitWidth * 0.2); 
    const h = Math.round(digitHeight * 0.1); 
    
    const x_L = xOffset + Math.round(digitWidth * 0.1);
    const x_C = xOffset + Math.round(digitWidth * 0.4);
    const x_R = xOffset + Math.round(digitWidth * 0.7);
    const y_T = Math.round(digitHeight * 0.05);
    const y_M_U = Math.round(digitHeight * 0.3);
    const y_M = Math.round(digitHeight * 0.5);
    const y_M_D = Math.round(digitHeight * 0.7);
    const y_B = Math.round(digitHeight * 0.9);

    const checkSegment = (xCenter: number, yCenter: number) => {
        const avg = getAreaAverage(xCenter - w/2, yCenter - h/2, w, h, processedBuffer, RESIZED_WIDTH);
        return (avg / IS_ON) > ACTIVATION_THRESHOLD ? '1' : '0';
    };

    let segments = '';
    segments += checkSegment(x_C, y_T);   // A 
    segments += checkSegment(x_R, y_M_U); // B 
    segments += checkSegment(x_R, y_M_D); // C 
    segments += checkSegment(x_C, y_B);   // D 
    segments += checkSegment(x_L, y_M_D); // E 
    segments += checkSegment(x_L, y_M_U); // F 
    segments += checkSegment(x_C, y_M);   // G 

    if (segments === '0000000') return ''; 
    return SEGMENTS_MAP[segments] || ''; 
};


// --- HANDLER PRINCIPAL ---

export default defineEventHandler(async (event) => {
  let processedBuffer: Buffer;
  
  try {
    const form = await readMultipartFormData(event)
    const file = form?.find(f => f.name === 'image')

    if (!file || !file.data) {
      throw createError({ statusCode: 400, statusMessage: 'Nenhum arquivo recebido' })
    }

    const imageBuffer = Buffer.from(file.data)
    
    // Processamento Sharp - AJUSTE DO LIMIAR DE BINARIZAÇÃO (150)
    const result = await sharp(imageBuffer)
        .extract(CROP_AREA)
        .resize(RESIZED_WIDTH, RESIZED_HEIGHT) 
        .greyscale()
        .threshold(150) // <--- AJUSTE FINAL: Aumenta o limiar para o preto ser mais preto
        .raw() 
        .toBuffer({ resolveWithObject: true });
        
    processedBuffer = result.data;
    
    let weightString = '';

    // Loop de leitura
    DIGIT_POSITIONS.forEach((pos, index) => {
        try {
            const digit = readDigit(pos.x, pos.width, processedBuffer);
            weightString += digit;
            
            if (index === 1) { 
                const dpX = pos.x + pos.width + 10; 
                const dpY = RESIZED_HEIGHT - 10; 
                
                const indexDp = (dpY * RESIZED_WIDTH) + dpX;
                if (indexDp >= 0 && indexDp < processedBuffer.length && processedBuffer[indexDp] === IS_ON) {
                    weightString += '.';
                }
            }
        } catch (e: any) {
            console.error(`Falha na leitura do dígito ${index}:`, e.message);
            weightString += 'X'; 
        }
    });

    console.log(`[OCR DEBUG] Peso lido (V45): ${weightString}`); 
    
    return {
      text: weightString, 
      confidence: 100
    }

  } catch (err: any) {
    console.error('Erro no processamento da imagem (Falha no Sharp/Loop):', err)
    
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Falha no servidor: Processamento Sharp/Segmentação.',
      data: err.message
    })
  }
})