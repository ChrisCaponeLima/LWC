// **IMPORTANTE**: Substitua o URL abaixo pelo seu URL de Web app do Google Apps Script
const DATA_URL = 'https://lwc-ten.vercel.app';

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
    const waistMeasurements = data.map(entry => extractMeasurement(entry.measurements, 'Cintura'));

    const weightCtx = document.getElementById('weightChart').getContext('2d');
    if (weightChart) weightChart.destroy();
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

    const waistCtx = document.getElementById('waistChart').getContext('2d');
    if (waistChart) waistChart.destroy();
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
    } else {
        filteredData = allData;
    }
    
    if (filteredData.length > 0) {
        processAndDisplayData(filteredData);
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
            message = `Parabéns! Você já perdeu ${totalLoss.toFixed(2)} kg. Mantenha o foco! 👏`;
        } else if (latestWeight === firstWeight) {
            message = 'Seu peso está estável. Mantenha a consistência para resultados duradouros! 💪';
        } else {
            message = 'Tudo bem ter dias difíceis. A consistência é a chave! Não desista. ✨';
        }
    }
    motivationBox.textContent = message;
}

document.addEventListener('DOMContentLoaded', fetchData);

// Lógica para mostrar/esconder o formulário
document.getElementById('toggleFormBtn').addEventListener('click', function() {
    const formContainer = document.getElementById('formContainer');
    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        this.textContent = 'Fechar Formulário';
    } else {
        formContainer.style.display = 'none';
        this.textContent = 'Adicionar Novo Registro';
    }
});

// A nova lógica de envio do formulário, mais robusta
document.getElementById('dataForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const form = event.target;
    const userName = new URLSearchParams(window.location.search).get('user');

    if (!userName) {
        alert('Erro: O nome de usuário não foi encontrado na URL.');
        return;
    }

    const formData = new FormData(form);
    
    // Convertendo FormData para um objeto JSON para evitar problemas de compatibilidade
    const formObject = Object.fromEntries(formData.entries());
    formObject.action = 'saveFormData';
    formObject.userName = userName;
    
    // Se um arquivo de foto foi selecionado, adicione-o ao objeto como Base64
    const photoInput = document.getElementById('photo');
    if (photoInput.files.length > 0) {
        const file = photoInput.files[0];
        await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                formObject.photoFile = reader.result.split(',')[1];
                formObject.photoName = file.name;
                resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    try {
        const response = await fetch(DATA_URL, {
            method: 'POST',
            body: JSON.stringify(formObject),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        if (result.result === 'success') {
            alert('Dados salvos com sucesso!');
            form.reset();
            
            // Fecha o formulário e altera o texto do botão
            const formContainer = document.getElementById('formContainer');
            const toggleBtn = document.getElementById('toggleFormBtn');
            formContainer.style.display = 'none';
            toggleBtn.textContent = 'Adicionar Novo Registro';
            
            fetchData(); 
        } else {
            console.error(result.error);
            alert('Erro ao salvar os dados: ' + result.error);
        }

    } catch (error) {
        console.error('Erro no envio do formulário:', error);
        alert('Ocorreu um erro inesperado: ' + error.message);
    }
});


