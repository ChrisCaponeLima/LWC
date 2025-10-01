// server/api/weather.get.ts - V1.1 - CORREÇÃO DE EXPORTAÇÃO (TypeError: Invalid lazy handler result)
import { defineEventHandler, getQuery, createError } from 'h3';

// Obtém a chave da API do runtimeConfig (seguro no servidor)
const config = useRuntimeConfig();
const apiKey = config.openWeatherApiKey;

// 🚨 CORREÇÃO: O handler deve ser exportado via 'export default defineEventHandler'
export default defineEventHandler(async (event) => {
    if (!apiKey) {
        // Este erro só ocorre se a chave não estiver no .env e no nuxt.config.ts
        console.error("OpenWeather API Key is not set.");
        throw createError({ statusCode: 500, statusMessage: 'Chave da API de clima não configurada no servidor.' });
    }

    // Pega os parâmetros lat e lon da URL (query string)
    const { lat, lon } = getQuery(event);

    // Constrói a query. Usa as coordenadas ou São Paulo como fallback
    const defaultQuery = 'q=São Paulo';
    const geoQuery = (lat && lon) ? `lat=${lat}&lon=${lon}` : defaultQuery;

    // URL completa da API do OpenWeatherMap
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?${geoQuery}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        // Usa $fetch para fazer a requisição externa
        const response = await $fetch(apiUrl);

        const temp = response.main.temp.toFixed(0);
        // Formatação: capitaliza a primeira letra da descrição
        const description = response.weather[0].description;
        const formattedDescription = description.charAt(0).toUpperCase() + description.slice(1);
        
        const iconCode = response.weather[0].icon;
        
        // Retorna dados formatados para o frontend (pages/index.vue)
        return {
            temperature: `${temp}°C`,
            description: formattedDescription,
            iconCode: iconCode,
            city: response.name,
        };

    } catch (error) {
        // Captura e lança erros de requisição externa
        console.error('Erro ao buscar clima no backend:', error);
        throw createError({ statusCode: 500, statusMessage: 'Falha ao buscar dados de clima no servidor.' });
    }
});