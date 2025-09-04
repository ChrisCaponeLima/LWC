document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const userPhotoUrl = localStorage.getItem('userPhotoUrl');
    // A altura agora é carregada do localStorage, que é preenchido pelo profile.js
    const userHeightCm = localStorage.getItem('userHeightCm') ? parseFloat(localStorage.getItem('userHeightCm')) : null; 

    const dataForm = document.getElementById('dataForm');
    const toggleFormBtn = document.getElementById('toggleFormBtn');
    const formContainer = document.getElementById('formContainer');
    const measurementsContainer = document.getElementById('measurements-container');
    const addMeasurementBtn = document.getElementById('add-measurement-btn');
    const photoGrid = document.getElementById('photo-grid');
    const formaGrid = document.getElementById('forma-grid');
    const weightChartElement = document.getElementById('weightChart');
    const waistChartElement = document.getElementById('waistChart');

    // Elementos dos KPIs
    const currentWeightElem = document.getElementById('current-weight');
    const totalLossElem = document.getElementById('total-loss');
    const weeklyStatusElem = document.getElementById('weekly-status');
    const bmiElem = document.getElementById('bmi');

    const cardColors = ['#E0F2FE', '#E6E1FF', '#EDE5D6', '#E3F0E4', '#FFF0EB', '#F8EBFD'];
    let availableMeasurements = [];
    let myWeightChart, myWaistChart;
    
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // Exibir nome e foto do usuário no cabeçalho
    const userProfileName = document.getElementById('userProfileName');
    const userProfilePhoto = document.getElementById('userProfilePhoto');
    if (userProfileName && username) {
        userProfileName.textContent = username;
    }
    if (userProfilePhoto && userPhotoUrl) {
        userProfilePhoto.src = userPhotoUrl;
    }

    // Funcionalidade de abrir/fechar o formulário
    toggleFormBtn.addEventListener('click', () => {
        if (formContainer.style.display === 'none') {
            formContainer.style.display = 'block';
            toggleFormBtn.textContent = 'Fechar Formulário';
        } else {
            formContainer.style.display = 'none';
            toggleFormBtn.textContent = 'Adicionar Novo Registro';
        }
    });

    // Função de Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    // Exibir mensagem de boas-vindas
    const motivationMessage = document.getElementById('motivation-message');
    if (motivationMessage) {
        motivationMessage.textContent = `Bem-vindo, ${username}! Carregando seus dados...`;
    }

    // Função para aplicar as cores aos cards
    function applyCardColors() {
        const cards = document.querySelectorAll('.kpi-grid .card-basic');
        cards.forEach((card, index) => {
            card.style.backgroundColor = cardColors[index % cardColors.length];
        });
    }

    // Função para renderizar as fotos de evolução
    function renderPhotos(records, gridElement, photoUrlKey) {
        gridElement.innerHTML = '';
        records.forEach(record => {
            if (record[photoUrlKey]) {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                const date = new Date(record.record_date).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
                photoItem.innerHTML = `
                    <a href="${record[photoUrlKey]}" target="_blank">
                        <img src="${record[photoUrlKey]}" alt="Foto de Evolução">
                    </a>
                    <p>${date}</p>
                `;
                gridElement.appendChild(photoItem);
            }
        });
    }

    // Função para calcular e exibir os KPIs
    function updateKPIs(records) {
        if (records.length === 0) {
            currentWeightElem.textContent = '-- kg';
            totalLossElem.textContent = '-- kg';
            weeklyStatusElem.textContent = 'N/A';
            bmiElem.textContent = '--';
            return;
        }

        // Ordena os registros pela data para pegar o mais recente
        const sortedRecords = [...records].sort((a, b) => new Date(b.record_date) - new Date(a.record_date));

        const latestRecord = sortedRecords[0];
        const firstRecord = sortedRecords[sortedRecords.length - 1];

        // Peso Atual
        currentWeightElem.textContent = `${parseFloat(latestRecord.weight).toFixed(2)} kg`;

        // Perda Total
        if (firstRecord && latestRecord.weight < firstRecord.weight) {
            const totalLoss = firstRecord.weight - latestRecord.weight;
            totalLossElem.textContent = `${totalLoss.toFixed(2)} kg`;
            totalLossElem.style.color = '#28a745'; // Verde para perda
        } else if (firstRecord && latestRecord.weight > firstRecord.weight) {
             const totalGain = latestRecord.weight - firstRecord.weight;
             totalLossElem.textContent = `+${totalGain.toFixed(2)} kg`;
             totalLossElem.style.color = '#dc3545'; // Vermelho para ganho
        } else {
            totalLossElem.textContent = '0.00 kg';
        }

        // Status Semanal (Exemplo simples: verifica se o peso mudou na última semana)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recordsLastWeek = sortedRecords.filter(r => new Date(r.record_date) >= oneWeekAgo);

        if (recordsLastWeek.length > 1) {
            const latestWeight = parseFloat(recordsLastWeek[0].weight);
            const previousWeight = parseFloat(recordsLastWeek[1].weight); // Penúltimo peso na última semana

            if (latestWeight < previousWeight) {
                weeklyStatusElem.textContent = 'Emagrecendo';
                weeklyStatusElem.style.color = '#28a745';
            } else if (latestWeight > previousWeight) {
                weeklyStatusElem.textContent = 'Engordando';
                weeklyStatusElem.style.color = '#dc3545';
            } else {
                weeklyStatusElem.textContent = 'Estável';
                weeklyStatusElem.style.color = '#6c757d';
            }
        } else {
            weeklyStatusElem.textContent = 'Poucos dados';
            weeklyStatusElem.style.color = '#ffc107';
        }


        // IMC (depende da altura do usuário)
        if (userHeightCm && userHeightCm > 0) {
            const heightMeters = userHeightCm / 100;
            const bmi = parseFloat(latestRecord.weight) / (heightMeters * heightMeters);
            bmiElem.textContent = bmi.toFixed(2);
            // Adicione lógica de cores para diferentes categorias de IMC se desejar
        } else {
            bmiElem.textContent = '-- (Altura N/A)';
            bmiElem.style.color = '#ffc107';
        }
    }


    // Função para renderizar os gráficos de peso e cintura
    function renderCharts(records) {
        // Ordena os registros pela data para garantir a ordem correta no gráfico
        const sortedRecords = [...records].sort((a, b) => new Date(a.record_date) - new Date(b.record_date));

        const dates = sortedRecords.map(record => new Date(record.record_date).toLocaleDateString('pt-BR'));
        const weights = sortedRecords.map(record => parseFloat(record.weight));
        const waistMeasurements = sortedRecords.map(record => {
            const waist = record.measurements.find(m => m.name === 'Cintura');
            return waist ? parseFloat(waist.value) : null;
        });

        // Gráfico de Peso
        if (myWeightChart) {
            myWeightChart.destroy();
        }
        myWeightChart = new Chart(weightChartElement, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Peso (kg)',
                    data: weights,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: { responsive: true, tension: 0.4 }
        });

        // Gráfico de Cintura
        if (myWaistChart) {
            myWaistChart.destroy();
        }
        myWaistChart = new Chart(waistChartElement, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Cintura (cm)',
                    data: waistMeasurements,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: { responsive: true, tension: 0.4 }
        });
    }

    // Função para carregar as medidas e popular o dropdown
    async function loadMeasurements() {
        try {
            const response = await fetch('/api/measurements');
            availableMeasurements = await response.json();
            addMeasurementField(); // Adiciona o primeiro campo de medida
        } catch (error) {
            console.error('Erro ao carregar lista de medidas:', error);
        }
    }

    // Função para criar um novo campo de medida
    function addMeasurementField() {
        const row = document.createElement('div');
        row.className = 'row g-3 mb-2 measurement-row';
        row.innerHTML = `
            <div class="col-6">
                <select class="form-select measurement-type" required>
                    <option value="">Selecione a medida</option>
                    ${availableMeasurements.map(m => `<option value="${m.id}">${m.name} (${m.unit})</option>`).join('')}
                </select>
            </div>
            <div class="col-4">
                <input type="number" step="0.1" class="form-control measurement-value" placeholder="Valor" required>
            </div>
            <div class="col-2 d-flex align-items-center">
                <button type="button" class="btn btn-sm btn-danger remove-measurement-btn">&times;</button>
            </div>
        `;
        measurementsContainer.appendChild(row);

        // Adiciona o listener para remover o campo
        row.querySelector('.remove-measurement-btn').addEventListener('click', () => {
            row.remove();
        });
    }

    // Listener para o botão de adicionar medida
    addMeasurementBtn.addEventListener('click', addMeasurementField);

    // Fetch inicial dos dados
    async function fetchData() {
        try {
            const response = await fetch(`/api/records?userId=${userId}`);
            const records = await response.json();
            
            applyCardColors(); 
            updateKPIs(records); // Atualiza os KPIs
            renderPhotos(records, photoGrid, 'photo_url');
            renderPhotos(records, formaGrid, 'forma_url');
            renderCharts(records);
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            motivationMessage.textContent = 'Erro ao carregar dados. Tente novamente mais tarde.';
        }
    }
    
    // Submissão do formulário
    dataForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = new FormData();
        
        // Coleta os dados estáticos
        formData.append('userId', userId);
        formData.append('date', this.querySelector('#date').value);
        formData.append('weight', this.querySelector('#weight').value);
        formData.append('event', this.querySelector('#event').value);
        formData.append('weeklyAction', this.querySelector('#weeklyAction').value);
        formData.append('workoutDays', this.querySelector('#workoutDays').value);
        formData.append('observations', this.querySelector('#observations').value);
        const photoFile = this.querySelector('#photo').files[0];
        if (photoFile) {
            formData.append('photo', photoFile);
        }
        const formaFile = this.querySelector('#forma').files[0];
        if (formaFile) {
            formData.append('forma', formaFile);
        }

        // Coleta os dados das medidas dinâmicas
        const measurements = [];
        document.querySelectorAll('.measurement-row').forEach(row => {
            const measurementId = row.querySelector('.measurement-type').value;
            const measurementValue = row.querySelector('.measurement-value').value;
            if (measurementId && measurementValue) {
                measurements.push({
                    id: parseInt(measurementId),
                    value: parseFloat(measurementValue)
                });
            }
        });
        formData.append('measurements', JSON.stringify(measurements));
        
        try {
            const response = await fetch('/api/records', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Registro salvo com sucesso!');
                dataForm.reset();
                fetchData();
                document.querySelectorAll('.measurement-row').forEach(row => row.remove());
                addMeasurementField();
            } else {
                alert('Erro ao salvar o registro.');
            }
        } catch (error) {
            console.error('Erro ao enviar registro:', error);
            alert('Erro ao enviar registro. Verifique a conexão.');
        }
    });

    loadMeasurements();
    fetchData();
});