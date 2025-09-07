document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const profileForm = document.getElementById('profileForm');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const infoDisplay = document.getElementById('infoDisplay');
    const infoForm = document.getElementById('infoForm');
    const profilePhotoInput = document.getElementById('profile-photo-upload');
    const profilePhotoPreview = document.getElementById('profile-photo-preview');
    const userNameElement = document.getElementById('user-name');
    const photoGrid = document.getElementById('photo-grid');
    const formaGrid = document.getElementById('forma-grid');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const initialWeightElem = document.getElementById('initial-weight');
    const currentWeightElem = document.getElementById('current-weight');
    const userHeightElem = document.getElementById('user-height');
    const userBmiElem = document.getElementById('user-bmi');

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
                photoItem.innerHTML = `
                    <img src="${record[photoUrlKey]}" alt="Foto de Evolução">
                    <div class="photo-date">${new Date(record.record_date).toLocaleDateString('pt-BR')}</div>
                    <button class="photo-edit-btn" data-record-id="${record.id}">
                        <img src="https://api.iconify.design/solar:pen-bold-duotone.svg" alt="Editar" class="icon-sm">
                    </button>
                `;
                const editBtn = photoItem.querySelector('.photo-edit-btn');
                editBtn.addEventListener('click', () => {
                    alert('Funcionalidade de edição em desenvolvimento.');
                });
                gridElement.appendChild(photoItem);
            }
        });
    }

    // Função para carregar os dados do usuário e registros
    async function loadUserDataAndRecords() {
        try {
            const response = await fetch(`/api/users?id=${userId}`);
            if (response.ok) {
                const userData = await response.json();
                
                // --- CORREÇÃO: ADICIONA O NOVO URL DA FOTO AO LOCALSTORAGE ---
                localStorage.setItem('userPhotoUrl', userData.photo_url);

                // Preencher informações do perfil
                userNameElement.textContent = userData.user_name || 'Usuário';
                profilePhotoPreview.src = userData.photo_url || 'https://api.iconify.design/solar:user-circle-bold-duotone.svg';
                document.getElementById('user-profile-photo').src = userData.photo_url || 'https://api.iconify.design/solar:user-circle-bold-duotone.svg';
                
                // Preencher os KPIs
                initialWeightElem.textContent = `${userData.initial_weight_kg || '--'} kg`;
                userHeightElem.textContent = `${userData.height_cm || '--'} cm`;
                userBmiElem.textContent = userData.bmi || '--';
                currentWeightElem.textContent = `${userData.latest_weight_kg || '--'} kg`;

                // Preencher o formulário de edição
                document.getElementById('profile-username').value = userData.user_name || '';
                document.getElementById('profile-email').value = userData.user_email || '';
                document.getElementById('height').value = userData.height_cm || '';
                document.getElementById('initial-weight-form').value = userData.initial_weight_kg || '';
                if (userData.birthdate) {
                    document.getElementById('birthdate').value = new Date(userData.birthdate).toISOString().split('T')[0];
                }

                // Renderizar as fotos
                renderPhotos(userData.records, photoGrid, 'photo_url');
                renderPhotos(userData.records, formaGrid, 'forma_url');

            } else {
                console.error('Erro ao carregar dados do usuário.');
            }
        } catch (error) {
            console.error('Erro de conexão ao carregar dados:', error);
        }
    }

    // Lógica para mostrar/esconder o formulário
    editProfileBtn.addEventListener('click', () => {
        infoDisplay.style.display = 'none';
        infoForm.style.display = 'block';
    });

    cancelEditBtn.addEventListener('click', () => {
        infoDisplay.style.display = 'grid';
        infoForm.style.display = 'none';
        loadUserDataAndRecords(); 
    });

    // Pré-visualização da foto ao selecionar
    profilePhotoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePhotoPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Lógica de envio do formulário de perfil
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        const profilePhotoInput = document.getElementById('profile-photo-upload');

        formData.append('user_id', userId);
        formData.append('user_email', document.getElementById('profile-email').value);
        formData.append('password', document.getElementById('profile-password').value);
        
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
                infoDisplay.style.display = 'grid'; 
                infoForm.style.display = 'none';
                loadUserDataAndRecords(); 
                profileForm.reset();
                document.getElementById('profile-photo-upload').value = '';
            } else {
                const errorData = await response.json();
                alert(`Erro ao atualizar dados: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
            alert('Erro de conexão. Tente novamente.');
        }
    });

    // Lógica do botão de logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('userPhotoUrl');
        window.location.href = 'login.html';
    });
    
    loadUserDataAndRecords();
});