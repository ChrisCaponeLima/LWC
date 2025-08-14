

// **IMPORTANTE**: Substitua o URL abaixo pelo seu URL de Web app do Google Apps Script
const DATA_URL = 'https://script.google.com/macros/s/AKfycbypqSSXpJbqqqZdpZrNphfUjZN_XBCLGpLak45zu9cYV5Lfhsp6FBsBt8TG5mXv0lPy/exec'; 

// **NOVO**: Defina o nome do usuário que você quer visualizar
// Garanta que este nome seja EXATAMENTE igual ao da planilha
const CURRENT_USER_NAME = 'Maria'; // <-- SUBSTITUA PELO NOME DO USUÁRIO

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
        
        // Filtra os dados para o usuário atual e remove entradas inválidas
        const userData = allData
            .filter(entry => entry.userName === CURRENT_USER_NAME && entry.weight > 0 && entry.date);
        
        userData.sort((a, b) => new Date(a.date) - new Date(b.date)); // Ordena por data
        
        if (userData.length > 0) {
            processAndDisplayData(userData);
        } else {
            document.getElementById('motivation-message').textContent = 'Nenhum dado encontrado para o usuário. Por favor, verifique o nome na planilha ou adicione dados.';
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

// Função principal para processar e exibir os dados
function processAndDisplayData(data) {
    displayKPIs(data);
    displayPhotos(data);
    updateCharts(data);
}

// Exibe os KPIs no painel de controle
function displayKPIs(data) {
    const latestEntry = data[data.length - 1];
    const firstEntry = data[0];

    if (!latestEntry || !firstEntry) return;

    // Exibe peso atual
    document.getElementById('current-weight').textContent = `${latestEntry.weight.toFixed(2)} kg`;

    // Calcula e exibe a perda total de peso
    const totalLoss = firstEntry.weight - latestEntry.weight;
    document.getElementById('total-loss').textContent = `${totalLoss.toFixed(1)} kg`;

    // Calcula e exibe o status semanal de peso
    const weeklyStatusElement = document.getElementById('weekly-status');
    if (data.length > 1) {
        const previousWeight = data[data.length - 2].weight;
        const currentWeight = latestEntry.weight;
        if (currentWeight < previousWeight) {
            weeklyStatusElement.textContent = 'Melhora 💪';
            weeklyStatusElement.className = 'status-improved';
        } else if (currentWeight > previousWeight) {
            weeklyStatusElement.textContent = 'Aumentou 😟';
            weeklyStatusElement.className = 'status-decreased';
        } else {
            weeklyStatusElement.textContent = 'Estável 🧘';
            weeklyStatusElement.className = 'status-neutral';
        }
    } else {
        weeklyStatusElement.textContent = 'Começando! 🚀';
    }

    // Calcula e exibe o IMC
    const bmi = calculateBMI(latestEntry.weight, USER_HEIGHT_CM);
    document.getElementById('bmi').textContent = bmi.toFixed(2);

    // Exibe mensagem motivacional
    displayMotivationalMessage(totalLoss, data);
}

// Exibe a galeria de fotos
function displayPhotos(data) {
    const photoGrid = document.getElementById('photo-grid');
    photoGrid.innerHTML = ''; // Limpa a galeria
    
    // Exibe as fotos de "Antes e Depois"
    const firstPhotoURL = data[0]?.photoURL;
    const lastPhotoURL = data[data.length - 1]?.photoURL;
    
    document.getElementById('first-photo').src = firstPhotoURL || 'https://via.placeholder.com/150';
    document.getElementById('first-photo').alt = 'Primeira foto';
    document.getElementById('last-photo').src = lastPhotoURL || 'https://via.placeholder.com/150';
    document.getElementById('last-photo').alt = 'Última foto';

    // Cria a galeria completa
    data.forEach(entry => {
        if (entry.photoURL) {
            const img = document.createElement('img');
            img.src = entry.photoURL;
            img.alt = `Foto de ${entry.date}`;
            photoGrid.appendChild(img);
        }
    });
}

// Atualiza os gráficos
function updateCharts(data) {
    const dates = data.map(entry => formatDate(entry.date));
    const weights = data.map(entry => entry.weight);
    const waistMeasurements = data.map(entry => extractMeasurement(entry.measurements, 'Cintura'));

    // Gráfico de Peso
    const weightCtx = document.getElementById('weightChart').getContext('2d');
    if (weightChart) weightChart.destroy(); // Destrói o gráfico antigo
    weightChart = new Chart(weightCtx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Peso (kg)',
                data: weights,
                borderColor: '#007bff',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução do Peso ao longo do tempo'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Peso (kg)'
                    }
                }
            }
        }
    });

    // Gráfico de Cintura
    const waistCtx = document.getElementById('waistChart').getContext('2d');
    if (waistChart) waistChart.destroy(); // Destrói o gráfico antigo
    waistChart = new Chart(waistCtx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Cintura (cm)',
                data: waistMeasurements,
                borderColor: '#28a745',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução da Cintura ao longo do tempo'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Cintura (cm)'
                    }
                }
            }
        }
    });
}

// Função de filtro para os gráficos
function filterData(period) {
    let filteredData = [];
    const now = new Date();

    if (period === '3m') {
        const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
        filteredData = allData.filter(entry => new Date(entry.date) >= threeMonthsAgo);
    } else if (period === '6m') {
        const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
        filteredData = allData.filter(entry => new Date(entry.date) >= sixMonthsAgo);
    } else { // 'all'
        filteredData = allData;
    }
    
    // AQUI O FILTRO POR USUÁRIO FOI REMOVIDO, POIS JÁ O FAZEMOS AO CARREGAR
    if (filteredData.length > 0) {
        updateCharts(filteredData);
    } else {
        alert('Nenhum dado disponível para este período.');
    }
}

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

// Inicia o aplicativo ao carregar a página
document.addEventListener('DOMContentLoaded', fetchData);



