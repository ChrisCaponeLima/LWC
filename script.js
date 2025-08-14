

// **IMPORTANTE**: Substitua o URL abaixo pelo seu URL de Web app do Google Apps Script
const DATA_URL = 'https://script.google.com/macros/s/AKfycbypqSSXpJbqqqZdpZrNphfUjZN_XBCLGpLak45zu9cYV5Lfhsp6FBsBt8TG5mXv0lPy/exec'; 

// Variáveis para armazenar os dados e os gráficos
let allData = [];
let weightChart, waistChart;
const USER_HEIGHT_CM = 175; // Altura fixa do usuário para cálculo do IMC

// Função para buscar os dados da planilha
async function fetchData() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error('Erro ao buscar os dados da planilha.');
        }
        allData = await response.json();
        
        // CORREÇÃO: Converte valores de peso com vírgula para ponto
        allData = allData.map(entry => {
            if (typeof entry.weight === 'string' && entry.weight.includes(',')) {
                entry.weight = parseFloat(entry.weight.replace(',', '.'));
            }
            return entry;
        });

        // NOVO: Lê o nome do usuário da URL
        const params = new URLSearchParams(window.location.search);
        const currentUser = params.get('user');

        if (!currentUser) {
            document.getElementById('motivation-message').textContent = 'Por favor, use um link com o seu nome de usuário. Ex: https://seu-repositorio.github.io/?user=NomeDoUsuario';
            return;
        }

        // Filtra os dados para o usuário atual e remove entradas inválidas
        const userData = allData
            .filter(entry => entry.userName === currentUser && entry.weight > 0 && entry.date);
        
        userData.sort((a, b) => new Date(a.date) - new Date(b.date)); // Ordena por data
        
        if (userData.length > 0) {
            processAndDisplayData(userData);
        } else {
            document.getElementById('motivation-message').textContent = `Nenhum dado encontrado para o usuário "${currentUser}". Por favor, verifique o nome na planilha ou adicione dados.`;
            // Limpar gráficos e galerias caso não haja dados
            if (weightChart) weightChart.destroy();
            if (waistChart) waistChart.destroy();
            document.getElementById('photo-grid').innerHTML = '';
            document.getElementById('first-photo').src = 'https://via.placeholder.com/150';
            document.getElementById('last-photo').src = 'https://via.placeholder.com/150';
            document.getElementById('current-weight').textContent = '-- kg';
            document.getElementById('total-loss').textContent = '-- kg';
            document.getElementById('weekly-status').textContent = 'N/A';
            document.getElementById('bmi').textContent = '--';
        }
    } catch (error) {
        console.error('Falha ao carregar os dados:', error);
        document.getElementById('motivation-message').textContent = 'Erro ao carregar dados. Verifique o console para mais detalhes.';
    }
}

// ... Restante do código (displayKPIs, displayPhotos, updateCharts, etc.)
// ... (Copie o restante do seu script.js aqui)

// Inicia o aplicativo ao carregar a página
document.addEventListener('DOMContentLoaded', fetchData);

// Funções utilitárias
function calculateBMI(weightKg, heightCm) {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

// Extrai uma medida específica da string de medidas
function extractMeasurement(measurementsString, measureName) {
    if (typeof measurementsString !== 'string' || !measurementsString) {
        return null;
    }
    const regex = new RegExp(`${measureName}:\\s*(\\d+)cm`);
    const match = measurementsString.match(regex);
    return match ? parseFloat(match[1]) : null;
}

function displayMotivationalMessage(totalLoss, data) {
    const motivationBox = document.getElementById('motivation-message');
    let message = 'Carregando mensagem...';

    if (data.length <= 1) {
        message = 'Ótimo começo! Cada jornada começa com o primeiro passo. 👟';
    } else {
        const latestWeight = data[data.length - 1].weight;
        const firstWeight = data[0].weight;

        if (latestWeight < firstWeight) {
            message = `Parabéns! Você já perdeu ${totalLoss.toFixed(1)} kg. Mantenha o foco! 👏`;
        } else if (latestWeight === firstWeight) {
            message = 'Seu peso está estável. Mantenha a consistência para resultados duradouros! 💪';
        } else {
            message = 'Tudo bem ter dias difíceis. A consistência é a chave! Não desista. ✨';
        }
    }
    motivationBox.textContent = message;
}





