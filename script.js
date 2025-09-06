document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const userPhotoUrl = localStorage.getItem('userPhotoUrl');
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

    // Elementos da nova saudação
    const greetingMessageElem = document.getElementById('greeting-message');
    const loadingStatusTextElem = document.getElementById('loading-status-text');
    
    // Novo elemento do clima
    const weatherDataElem = document.getElementById('weather-data');
    
    // Novos elementos dos botões de galeria
    const registrosButton = document.getElementById('registrosButtonCollapse');
    const formaButton = document.getElementById('formaButtonCollapse');

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
    
    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    }

    toggleFormBtn.addEventListener('click', () => {
        if (formContainer.style.display === 'none' || formContainer.style.display === '') {
            formContainer.style.display = 'block';
            toggleFormBtn.textContent = 'Fechar Formulário';
        } else {
            formContainer.style.display = 'none';
            toggleFormBtn.textContent = 'Adicionar Novo Registro';
        }
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

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

    function updateKPIs(records) {
        if (records.length === 0) {
            currentWeightElem.textContent = '-- kg';
            totalLossElem.textContent = '-- kg';
            weeklyStatusElem.textContent = 'N/A';
            bmiElem.textContent = '--';
            return;
        }

        const sortedRecords = [...records].sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
        const latestRecord = sortedRecords[0];
        const firstRecord = sortedRecords[sortedRecords.length - 1];

        currentWeightElem.textContent = `${parseFloat(latestRecord.weight).toFixed(2)} kg`;

        if (firstRecord && latestRecord.weight < firstRecord.weight) {
            const totalLoss = firstRecord.weight - latestRecord.weight;
            totalLossElem.textContent = `${totalLoss.toFixed(2)} kg`;
            totalLossElem.style.color = '#28a745';
        } else if (firstRecord && latestRecord.weight > firstRecord.weight) {
            const totalGain = latestRecord.weight - firstRecord.weight;
            totalLossElem.textContent = `+${totalGain.toFixed(2)} kg`;
            totalLossElem.style.color = '#dc3545';
        } else {
            totalLossElem.textContent = '0.00 kg';
        }

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recordsLastWeek = sortedRecords.filter(r => new Date(r.record_date) >= oneWeekAgo);

        if (recordsLastWeek.length > 1) {
            const latestWeight = parseFloat(recordsLastWeek[0].weight);
            const previousWeight = parseFloat(recordsLastWeek[1].weight);

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

        if (userHeightCm && userHeightCm > 0) {
            const heightMeters = userHeightCm / 100;
            const bmi = parseFloat(latestRecord.weight) / (heightMeters * heightMeters);
            bmiElem.textContent = bmi.toFixed(2);
        } else {
            bmiElem.textContent = '-- (Altura N/A)';
            bmiElem.style.color = '#ffc107';
        }
    }

    function renderCharts(records) {
        const sortedRecords = [...records].sort((a, b) => new Date(a.record_date) - new Date(b.record_date));

        const dates = sortedRecords.map(record => new Date(record.record_date).toLocaleDateString('pt-BR'));
        const weights = sortedRecords.map(record => parseFloat(record.weight));
        const waistMeasurements = sortedRecords.map(record => {
            const waist = record.measurements.find(m => m.name === 'Cintura');
            return waist ? parseFloat(waist.value) : null;
        });

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

    async function loadMeasurements() {
        try {
            const response = await fetch('/api/measurements');
            availableMeasurements = await response.json();
            addMeasurementField();
        } catch (error) {
            console.error('Erro ao carregar lista de medidas:', error);
        }
    }

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

        row.querySelector('.remove-measurement-btn').addEventListener('click', () => {
            row.remove();
        });
    }

    addMeasurementBtn.addEventListener('click', addMeasurementField);

    // Função assíncrona para buscar os dados de clima com tratamento de erro
    async function fetchWeather() {
        console.log("Tentando buscar dados de clima...");
        const apiKey = 'SUA_CHAVE_DE_API_DO_OPENWEATHERMAP'; 
        const city = 'São Paulo';
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro ${response.status}: ${errorData.message}`);
            }

            const data = await response.json();
            console.log("Dados de clima recebidos:", data);

            if (data && data.main && data.main.temp !== undefined) {
                const temp = data.main.temp.toFixed(0);
                const weatherDescription = data.weather[0].description;
                const weatherIconCode = data.weather[0].icon;

                weatherDataElem.textContent = `${temp}°C`;
                
                const iconElement = document.querySelector('.card-terracotta .icon');
                if (iconElement) {
                     const iconUrl = `https://openweathermap.org/img/wn/${weatherIconCode}@2x.png`;
                     iconElement.src = iconUrl;
                     iconElement.alt = weatherDescription;
                }
            } else {
                throw new Error('Dados de temperatura não encontrados na resposta da API.');
            }
            
        } catch (error) {
            console.error('Erro ao carregar clima:', error.message);
            if(weatherDataElem) {
                weatherDataElem.textContent = 'N/A';
            }
            const iconElement = document.querySelector('.card-terracotta .icon');
            if (iconElement) {
                iconElement.src = 'https://api.iconify.design/solar:cloud-snow-bold-duotone.svg';
            }
        }
    }
    
    // Função para atualizar a cor dos botões com base nas fotos
    function updatePhotoButtons(records) {
        const hasRegistrosPhotos = records.some(record => record.photo_url);
        const hasFormaPhotos = records.some(record => record.forma_url);
        
        if (registrosButton) {
            if (hasRegistrosPhotos) {
                registrosButton.classList.remove('btn-no-photos');
                registrosButton.classList.add('btn-with-photos');
            } else {
                registrosButton.classList.remove('btn-with-photos');
                registrosButton.classList.add('btn-no-photos');
            }
        }

        if (formaButton) {
            if (hasFormaPhotos) {
                formaButton.classList.remove('btn-no-photos');
                formaButton.classList.add('btn-with-photos');
            } else {
                formaButton.classList.remove('btn-with-photos');
                formaButton.classList.add('btn-no-photos');
            }
        }
    }

    async function loadInitialData() {
        try {
            if (greetingMessageElem && username) {
                greetingMessageElem.textContent = `${getGreeting()}, ${username}`;
            } else {
                greetingMessageElem.textContent = `${getGreeting()}, Usuário`;
            }

            loadingStatusTextElem.textContent = 'carregando seus dados...';
            
            const [recordsResponse, measurementsResponse] = await Promise.all([
                fetch(`/api/records?userId=${userId}`),
                fetch('/api/measurements')
            ]);
            
            const records = await recordsResponse.json();
            availableMeasurements = await measurementsResponse.json();

            loadingStatusTextElem.textContent = 'Acompanhe sua evolução';

            updateKPIs(records);
            renderPhotos(records, photoGrid, 'photo_url');
            renderPhotos(records, formaGrid, 'forma_url');
            renderCharts(records);
            addMeasurementField();
            updatePhotoButtons(records);
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            loadingStatusTextElem.textContent = 'Erro ao carregar dados. Tente novamente mais tarde.';
        }
    }
    
    dataForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = new FormData();
        
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
                loadInitialData();
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

    loadInitialData();
    fetchWeather();
});