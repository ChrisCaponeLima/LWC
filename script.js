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

    const currentWeightTruncated = Math.trunc(latestEntry.weight * 100) / 100;
    document.getElementById('current-weight').textContent = `${currentWeightTruncated.toFixed(2)} kg`;

    const totalLoss = firstEntry.weight - latestEntry.weight;
    const totalLossTruncated = Math.trunc(totalLoss * 100) / 100;
    document.getElementById('total-loss').textContent = `${totalLossTruncated.toFixed(2)} kg`;

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

    const bmi = calculateBMI(latestEntry.weight, USER_HEIGHT_CM);
    document.getElementById('bmi').textContent = bmi.toFixed(2);

    displayMotivationalMessage(totalLoss, data);
}

// Exibe a galeria de fotos
function displayPhotos(data) {
    const photoGrid = document.getElementById('photo-grid');
    photoGrid.innerHTML = '';
    
    const firstPhotoURL = data[0]?.photoURL;
    const lastPhotoURL = data[data.length - 1]?.photoURL;
    
    document.getElementById('first-photo').src = firstPhotoURL || 'https://via.placeholder.com/150';
    document.getElementById('first-photo').alt = 'Primeira foto';
    document.getElementById('last-photo').src = lastPhotoURL || 'https://via.placeholder.com/150';
    document.getElementById('last-photo').alt = 'Última foto';

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
    const waistMeasurements = data.map(entry =>
