document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const userPhotoUrl = localStorage.getItem('userPhotoUrl');
    const dataForm = document.getElementById('dataForm');
    const toggleFormBtn = document.getElementById('toggleFormBtn');
    const formContainer = document.getElementById('formContainer');
    const measurementsContainer = document.getElementById('measurements-container');
    const addMeasurementBtn = document.getElementById('add-measurement-btn');
    const photoGrid = document.getElementById('photo-grid');
    let availableMeasurements = [];
    
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

    // Funções de Gráfico (manter o seu código existente)
    // ...

    // Função para renderizar as fotos de evolução
    function renderEvolutionPhotos(records) {
        photoGrid.innerHTML = '';
        records.forEach(record => {
            if (record.photo_url) {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                photoItem.innerHTML = `
                    <a href="${record.photo_url}" target="_blank">
                        <img src="${record.photo_url}" alt="Foto de Evolução">
                    </a>
                `;
                photoGrid.appendChild(photoItem);
            }
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
            
            // Renderizar as fotos após buscar os dados
            renderEvolutionPhotos(records);

            // ... sua lógica de processamento dos dados ...
            
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