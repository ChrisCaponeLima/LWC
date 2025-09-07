document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');

    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    let username = localStorage.getItem('username');
    let userPhotoUrl = localStorage.getItem('userPhotoUrl');
    let userHeightCm = localStorage.getItem('userHeightCm') ? parseFloat(localStorage.getItem('userHeightCm')) : null;

    let allRecords = []; // Variável para armazenar todos os registros carregados
    let availableMeasurements = [];
    const chartInstances = {};

    const dataForm = document.getElementById('dataForm');
    const toggleFormBtn = document.getElementById('toggleFormBtn');
    const formContainer = document.getElementById('formContainer');
    const measurementsContainer = document.getElementById('measurements-container');
    const addMeasurementBtn = document.getElementById('add-measurement-btn');
    const photoGrid = document.getElementById('photo-grid');
    const formaGrid = document.getElementById('forma-grid');
    const chartsContainer = document.getElementById('charts-container');
    const currentWeightElem = document.getElementById('current-weight');
    const totalLossElem = document.getElementById('total-loss');
    const weeklyStatusElem = document.getElementById('weekly-status');
    const bmiElem = document.getElementById('bmi');
    const greetingMessageElem = document.getElementById('greeting-message');
    const loadingStatusTextElem = document.getElementById('loading-status-text');
    const weatherDataElem = document.getElementById('weather-data');
    const registrosButton = document.getElementById('registrosButtonCollapse');
    const formaButton = document.getElementById('formaButtonCollapse');
    const userProfileName = document.getElementById('userProfileName');
    const userProfilePhoto = document.getElementById('userProfilePhoto');

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
        chartsContainer.innerHTML = '';
        const sortedRecords = [...records].sort((a, b) => new Date(a.record_date) - new Date(b.record_date));
        const dates = sortedRecords.map(record => new Date(record.record_date).toLocaleDateString('pt-BR'));
        
        const allMeasurements = new Set();
        sortedRecords.forEach(record => {
            if (record.weight) allMeasurements.add('Peso');
            if (record.measurements) {
                record.measurements.forEach(m => allMeasurements.add(m.name));
            }
        });

        // Ordenar as medições
        const orderedMeasurements = ['Peso', 'Cintura'];
        allMeasurements.forEach(m => {
            if (!orderedMeasurements.includes(m)) {
                orderedMeasurements.push(m);
            }
        });

        Object.values(chartInstances).forEach(chart => chart.destroy());
        
        orderedMeasurements.forEach(measurementName => {
            const chartData = sortedRecords.map(record => {
                if (measurementName === 'Peso') {
                    return parseFloat(record.weight);
                } else {
                    const measurement = record.measurements?.find(m => m.name === measurementName);
                    return measurement ? parseFloat(measurement.value) : null;
                }
            });

            if (chartData.some(d => d !== null && !isNaN(d))) {
                const uniqueChartId = `${measurementName.toLowerCase().replace(/\s/g, '-')}-chart`;
                const chartDiv = document.createElement('div');
                chartDiv.className = 'card-chart';
                chartDiv.innerHTML = `<canvas id="${uniqueChartId}"></canvas>`;
                chartsContainer.appendChild(chartDiv);

                const ctx = document.getElementById(uniqueChartId);
                chartInstances[uniqueChartId] = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: dates,
                        datasets: [{
                            label: `${measurementName} (cm)`,
                            data: chartData,
                            borderColor: '#007bff',
                            backgroundColor: 'rgba(0, 123, 255, 0.1)',
                            borderWidth: 2,
                            fill: true
                        }]
                    },
                    options: { responsive: true, tension: 0.4 }
                });
            }
        });
    }
    
    // Função para filtrar os dados por período
    function filterData(period) {
        const now = new Date();
        let filteredRecords = [];

        if (period === 'all') {
            filteredRecords = allRecords;
        } else {
            const dateFilter = new Date();
            if (period === '3months') {
                dateFilter.setMonth(now.getMonth() - 3);
            } else if (period === '6months') {
                dateFilter.setMonth(now.getMonth() - 6);
            }
            filteredRecords = allRecords.filter(r => new Date(r.record_date) >= dateFilter);
        }
        
        renderCharts(filteredRecords);
    }
    window.filterData = filterData; // Expor a função para o escopo global

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

    function updateWeatherCardStyle(weatherCode) {
        const weatherCard = document.querySelector('.card-terracotta');
        const iconElement = weatherCard.querySelector('.icon');
        const kpiInfoElements = weatherCard.querySelectorAll('.kpi-info, .kpi-label, .kpi-value');

        const weatherMap = {
            '01d': { bg: 'var(--weather-bg-sunny-day)', font: 'var(--weather-font-sunny-day)' },
            '01n': { bg: 'var(--weather-bg-clear-night)', font: 'var(--weather-font-clear-night)' },
            '02d': { bg: 'var(--weather-bg-clouds)', font: 'var(--weather-font-clouds)' },
            '02n': { bg: 'var(--weather-bg-clouds)', font: 'var(--weather-font-clouds)' },
            '03d': { bg: 'var(--weather-bg-clouds)', font: 'var(--weather-font-clouds)' },
            '03n': { bg: 'var(--weather-bg-clouds)', font: 'var(--weather-font-clouds)' },
            '04d': { bg: 'var(--weather-bg-clouds)', font: 'var(--weather-font-clouds)' },
            '04n': { bg: 'var(--weather-bg-clouds)', font: 'var(--weather-font-clouds)' },
            '09d': { bg: 'var(--weather-bg-rainy)', font: 'var(--weather-font-rainy)' },
            '09n': { bg: 'var(--weather-bg-rainy)', font: 'var(--weather-font-rainy)' },
            '10d': { bg: 'var(--weather-bg-rainy)', font: 'var(--weather-font-rainy)' },
            '10n': { bg: 'var(--weather-bg-rainy)', font: 'var(--weather-font-rainy)' },
            '11d': { bg: 'var(--weather-bg-thunderstorm)', font: 'var(--weather-font-thunderstorm)' },
            '11n': { bg: 'var(--weather-bg-thunderstorm)', font: 'var(--weather-font-thunderstorm)' },
            '13d': { bg: 'var(--weather-bg-snow)', font: 'var(--weather-font-snow)' },
            '13n': { bg: 'var(--weather-bg-snow)', font: 'var(--weather-font-snow)' },
            '50d': { bg: 'var(--weather-bg-clouds)', font: 'var(--weather-font-clouds)' },
            '50n': { bg: 'var(--weather-bg-clouds)', font: 'var(--weather-font-clouds)' },
        };
        
        const style = weatherMap[weatherCode] || { bg: 'var(--weather-bg-default)', font: 'var(--weather-font-default)' };
        
        weatherCard.style.backgroundColor = style.bg;
        iconElement.style.color = style.font;
        kpiInfoElements.forEach(elem => {
            elem.style.color = style.font;
        });
    }

    async function fetchWeather(lat, lon) {
        const apiKey = '7266ddb3d14331910bdc98966924d8d0'; 
        const apiUrl = lat && lon 
            ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`
            : `https://api.openweathermap.org/data/2.5/weather?q=São Paulo&appid=${apiKey}&units=metric&lang=pt_br`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Erro ao buscar dados de clima.');
            }
            const data = await response.json();
            
            const temp = data.main.temp.toFixed(0);
            const weatherIconCode = data.weather[0].icon;

            weatherDataElem.textContent = `${temp}°C`;
            const iconUrl = `https://openweathermap.org/img/wn/${weatherIconCode}@2x.png`;
            const iconElement = document.querySelector('.card-terracotta .icon');
            if (iconElement) {
                 iconElement.src = iconUrl;
                 iconElement.alt = data.weather[0].description;
                 updateWeatherCardStyle(weatherIconCode);
            }
        } catch (error) {
            console.error('Erro ao carregar clima:', error.message);
            weatherDataElem.textContent = 'N/A';
            const iconElement = document.querySelector('.card-terracotta .icon');
            if (iconElement) {
                iconElement.src = 'https://api.iconify.design/solar:cloud-snow-bold-duotone.svg';
                updateWeatherCardStyle('default');
            }
        }
    }
    
    function fetchWeatherByGeolocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.error('Erro de geolocalização:', error);
                    fetchWeather();
                }
            );
        } else {
            console.log('Geolocalização não é suportada por este navegador.');
            fetchWeather();
        }
    }

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

    async function fetchUserProfile() {
        try {
            const response = await fetch(`/api/users?id=${userId}`); 
            const user = await response.json();
            if (user) {
                username = user.username; 
                userPhotoUrl = user.photo_perfil_url; 
                userHeightCm = user.height_cm;

                localStorage.setItem('username', username);
                localStorage.setItem('userPhotoUrl', userPhotoUrl);
                localStorage.setItem('userHeightCm', userHeightCm);
                
                if (userProfileName) userProfileName.textContent = username;
                if (userProfilePhoto) userProfilePhoto.src = userPhotoUrl;
            }
        } catch (error) {
            console.error('Erro ao carregar perfil do usuário:', error);
        }
    }

    async function loadInitialData() {
        try {
            loadingStatusTextElem.textContent = 'carregando seus dados...';
            
            if (username) {
                if (userProfileName) userProfileName.textContent = username;
                if (userProfilePhoto) userProfilePhoto.src = userPhotoUrl;
                if (greetingMessageElem) greetingMessageElem.textContent = `${getGreeting()}, ${username}`;
            } else {
                 if (greetingMessageElem) greetingMessageElem.textContent = `${getGreeting()}, Usuário`;
            }

            await fetchUserProfile();
            
            if (username) {
                greetingMessageElem.textContent = `${getGreeting()}, ${username}`;
            }

            const [recordsResponse, measurementsResponse] = await Promise.all([
                fetch(`/api/records?userId=${userId}`),
                fetch('/api/measurements')
            ]);
            
            allRecords = await recordsResponse.json();
            availableMeasurements = await measurementsResponse.json();

            loadingStatusTextElem.textContent = 'Acompanhe sua evolução';

            updateKPIs(allRecords);
            renderPhotos(allRecords, photoGrid, 'photo_url');
            renderPhotos(allRecords, formaGrid, 'forma_url');
            renderCharts(allRecords);
            addMeasurementField();
            updatePhotoButtons(allRecords);
            
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
    fetchWeatherByGeolocation();
});