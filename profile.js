document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const profileForm = document.getElementById('profileForm');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const infoDisplay = document.getElementById('infoDisplay');
    const infoForm = document.getElementById('infoForm');
    const profilePhotoInput = document.getElementById('profile-photo-upload');
    const profilePhotoForm = document.getElementById('profilePhotoForm');
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const photoGrid = document.getElementById('photo-grid');
    
    const initialWeightElem = document.getElementById('initial-weight');
    const userHeightElem = document.getElementById('user-height');
    const userBmiElem = document.getElementById('user-bmi');
    const idealWeightElem = document.getElementById('ideal-weight');

    if (!userId) {
        window.location.href = 'login.html';
        return;
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

    // Função para carregar os dados do usuário e registros
    async function loadUserDataAndRecords() {
        try {
            const [userResponse, recordsResponse] = await Promise.all([
                fetch(`/api/users?id=${userId}`),
                fetch(`/api/records?userId=${userId}`)
            ]);

            const user = await userResponse.json();
            const records = await recordsResponse.json();

            // Exibe os dados do usuário
            document.getElementById('profile-username').value = user.user_name || '';
            document.getElementById('profile-email').value = user.user_email || '';
            document.getElementById('height').value = user.height_cm || '';
            
            userNameElement.textContent = user.user_name || 'John Doe';
            userEmailElement.textContent = user.user_email || 'email@exemplo.com';
            
            // Exibir foto de perfil principal e no formulário
            const userPhotoUrl = user.photo_url || 'https://api.iconify.design/solar:user-circle-bold-duotone.svg';
            document.getElementById('profilePhoto').src = userPhotoUrl;
            profilePhotoForm.src = userPhotoUrl;
            
            // Salva os dados no localStorage para uso em outras páginas
            localStorage.setItem('username', user.user_name || 'John Doe');
            localStorage.setItem('userPhotoUrl', user.photo_url || '');
            localStorage.setItem('userHeightCm', user.height_cm || '');

            // Atualiza os KPIs
            if (records.length > 0) {
                const sortedRecords = [...records].sort((a, b) => new Date(a.record_date) - new Date(b.record_date));
                const firstRecord = sortedRecords[0];
                const latestRecord = sortedRecords[sortedRecords.length - 1];
                const latestWeight = parseFloat(latestRecord.weight);
                const heightCm = parseFloat(user.height_cm);
                
                initialWeightElem.textContent = `${parseFloat(firstRecord.weight).toFixed(2)} kg`;
                userHeightElem.textContent = `${heightCm || '--'} cm`;

                if (heightCm && latestWeight) {
                    const heightMeters = heightCm / 100;
                    const bmi = latestWeight / (heightMeters * heightMeters);
                    userBmiElem.textContent = bmi.toFixed(2);
                    
                    // Cálculo de Peso Ideal (Fórmula de Lorentz)
                    const idealWeight = (heightCm - 100) - ((heightCm - 150) / (user.sex === 'F' ? 2 : 4));
                    idealWeightElem.textContent = `${idealWeight.toFixed(2)} kg`;
                }
            } else {
                initialWeightElem.textContent = '-- kg';
      document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const profileForm = document.getElementById('profileForm');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const infoDisplay = document.getElementById('infoDisplay');
    const infoForm = document.getElementById('infoForm');
    const profilePhotoInput = document.getElementById('profile-photo-upload');
    const profilePhotoForm = document.getElementById('profilePhotoForm');
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const photoGrid = document.getElementById('photo-grid');
    
    const initialWeightElem = document.getElementById('initial-weight');
    const userHeightElem = document.getElementById('user-height');
    const userBmiElem = document.getElementById('user-bmi');
    const idealWeightElem = document.getElementById('ideal-weight');

    if (!userId) {
        window.location.href = 'login.html';
        return;
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

    // Função para carregar os dados do usuário e registros
    async function loadUserDataAndRecords() {
        try {
            const [userResponse, recordsResponse] = await Promise.all([
                fetch(`/api/users?id=${userId}`),
                fetch(`/api/records?userId=${userId}`)
            ]);

            const user = await userResponse.json();
            const records = await recordsResponse.json();

            // Exibe os dados do usuário
            // CORRIGIDO: Agora as propriedades correspondem ao banco de dados
            document.getElementById('profile-username').value = user.username || '';
            document.getElementById('profile-email').value = user.email || '';
            document.getElementById('height').value = user.height_cm || '';
            
            userNameElement.textContent = user.username || 'John Doe';
            userEmailElement.textContent = user.email || 'email@exemplo.com';
            
            // Exibir foto de perfil principal e no formulário
            // CORRIGIDO: Agora a propriedade corresponde ao banco de dados
            const userPhotoUrl = user.photo_perfil_url || 'https://api.iconify.design/solar:user-circle-bold-duotone.svg';
            document.getElementById('profilePhoto').src = userPhotoUrl;
            profilePhotoForm.src = userPhotoUrl;
            
            // Salva os dados no localStorage para uso em outras páginas
            localStorage.setItem('username', user.username || 'John Doe');
            localStorage.setItem('userPhotoUrl', user.photo_perfil_url || '');
            localStorage.setItem('userHeightCm', user.height_cm || '');

            // Atualiza os KPIs
            if (records.length > 0) {
                const sortedRecords = [...records].sort((a, b) => new Date(a.record_date) - new Date(b.record_date));
                const firstRecord = sortedRecords[0];
                const latestRecord = sortedRecords[sortedRecords.length - 1];
                const latestWeight = parseFloat(latestRecord.weight);
                const heightCm = parseFloat(user.height_cm);
                
                initialWeightElem.textContent = `${parseFloat(firstRecord.weight).toFixed(2)} kg`;
                userHeightElem.textContent = `${heightCm || '--'} cm`;

                if (heightCm && latestWeight) {
                    const heightMeters = heightCm / 100;
                    const bmi = latestWeight / (heightMeters * heightMeters);
                    userBmiElem.textContent = bmi.toFixed(2);
                    
                    // Cálculo de Peso Ideal (Fórmula de Lorentz)
                    const idealWeight = (heightCm - 100) - ((heightCm - 150) / (user.sex === 'F' ? 2 : 4));
                    idealWeightElem.textContent = `${idealWeight.toFixed(2)} kg`;
                }
            } else {
                initialWeightElem.textContent = '-- kg';
                userHeightElem.textContent = `${user.height_cm || '--'} cm`;
                userBmiElem.textContent = '--';
                idealWeightElem.textContent = '-- kg';
            }

            // Renderiza os registros de foto
            renderPhotos(records, photoGrid, 'photo_url');

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar dados do usuário. Tente novamente mais tarde.');
        }
    }

    // Funcionalidade de alternar entre display de informações e formulário
    editProfileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        infoDisplay.style.display = 'none';
        infoForm.style.display = 'block';
    });

    cancelEditBtn.addEventListener('click', () => {
        infoDisplay.style.display = 'grid';
        infoForm.style.display = 'none';
    });
    
    // Pré-visualização da foto
    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = e => {
                    profilePhotoForm.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Lógica para submissão do formulário de perfil
    if (profileForm) {
        profileForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('user_name', document.getElementById('profile-username').value);
            formData.append('user_email', document.getElementById('profile-email').value);
            formData.append('password', document.getElementById('profile-password').value);
            formData.append('height', document.getElementById('height').value);

            const photoFile = profilePhotoInput.files[0];
            if (photoFile) {
                formData.append('photo', photoFile);
            }

            try {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    alert('Dados atualizados com sucesso!');
                    loadUserDataAndRecords(); // Recarrega os dados após a atualização
                    infoDisplay.style.display = 'grid'; // Retorna para o display de informações
                    infoForm.style.display = 'none';
                } else {
                    const errorData = await response.json();
                    alert(`Erro ao atualizar dados: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Erro ao enviar dados:', error);
                alert('Erro de conexão. Tente novamente.');
            }
        });
    }

    loadUserDataAndRecords();
});          userHeightElem.textContent = `${user.height_cm || '--'} cm`;
                userBmiElem.textContent = '--';
                idealWeightElem.textContent = '-- kg';
            }

            // Renderiza os registros de foto
            renderPhotos(records, photoGrid, 'photo_url');

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar dados do usuário. Tente novamente mais tarde.');
        }
    }

    // Funcionalidade de alternar entre display de informações e formulário
    editProfileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        infoDisplay.style.display = 'none';
        infoForm.style.display = 'block';
    });

    cancelEditBtn.addEventListener('click', () => {
        infoDisplay.style.display = 'grid';
        infoForm.style.display = 'none';
    });
    
    // Pré-visualização da foto
    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = e => {
                    profilePhotoForm.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Lógica para submissão do formulário de perfil
    if (profileForm) {
        profileForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('user_name', document.getElementById('profile-username').value);
            formData.append('user_email', document.getElementById('profile-email').value);
            formData.append('password', document.getElementById('profile-password').value);
            formData.append('height', document.getElementById('height').value);

            const photoFile = profilePhotoInput.files[0];
            if (photoFile) {
                formData.append('photo', photoFile);
            }

            try {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    alert('Dados atualizados com sucesso!');
                    
                    // Limpeza de todos os campos do formulário
                    profileForm.reset();

                    // Limpeza manual dos campos de arquivo para garantir
                    document.getElementById('profile-photo-upload').value = '';

                    loadUserDataAndRecords(); // Recarrega os dados após a atualização
                    infoDisplay.style.display = 'grid'; // Retorna para o display de informações
                    infoForm.style.display = 'none';
                } else {
                    const errorData = await response.json();
                    alert(`Erro ao atualizar dados: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Erro ao enviar dados:', error);
                alert('Erro de conexão. Tente novamente.');
            }
        });
    }

    loadUserDataAndRecords();
});