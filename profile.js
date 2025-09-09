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
    const debugOutput = document.getElementById('debug-output');
    
    const initialWeightElem = document.getElementById('initial-weight');
    const currentWeightElem = document.getElementById('current-weight');
    const userHeightElem = document.getElementById('user-height');
    const userBmiElem = document.getElementById('user-bmi');

    const registrosButton = document.getElementById('registrosButtonCollapse');
    const formaButton = document.getElementById('formaButtonCollapse');

    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    
    function renderPhotos(records, gridElement, photoUrlKey) {
        gridElement.innerHTML = '';
        let hasPhotos = false;
        records.forEach(record => {
            if (record[photoUrlKey]) {
                hasPhotos = true;
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
        return hasPhotos;
    }

    async function loadUserDataAndRecords() {
        try {
            const response = await fetch(`/api/users?id=${userId}`);
            if (response.ok) {
                const userData = await response.json();
                
                localStorage.setItem('userPhotoUrl', userData.photo_perfil_url);

                userNameElement.textContent = userData.username || 'Usuário'; 
                document.getElementById('user-email').textContent = userData.email || 'Não informado'; 
                
                const userProfilePhotoElement = document.getElementById('user-profile-photo');
                if (userProfilePhotoElement) {
                    userProfilePhotoElement.src = userData.photo_perfil_url || 'https://api.iconify.design/solar:user-circle-bold-duotone.svg'; 
                }
                profilePhotoPreview.src = userData.photo_perfil_url || 'https://api.iconify.design/solar:user-circle-bold-duotone.svg';
                
                initialWeightElem.textContent = `${userData.initial_weight_kg || '--'} kg`;
                userHeightElem.textContent = `${userData.height_cm || '--'} cm`;
                userBmiElem.textContent = userData.bmi || '--';
                currentWeightElem.textContent = `${userData.latest_weight_kg || '--'} kg`;

                document.getElementById('profile-username').value = userData.username || '';
                document.getElementById('profile-email').value = userData.email || '';
                document.getElementById('height').value = userData.height_cm || '';
                document.getElementById('initial-weight-form').value = userData.initial_weight_kg || '';
                if (userData.birthdate) {
                    document.getElementById('birthdate').value = new Date(userData.birthdate).toISOString().split('T')[0];
                }

                const hasPhotoRecords = renderPhotos(userData.records, photoGrid, 'photo_url');
                const hasFormaRecords = renderPhotos(userData.records, formaGrid, 'forma_url');

                if (registrosButton) {
                    if (hasPhotoRecords) {
                        registrosButton.classList.add('btn-with-photos');
                        registrosButton.classList.remove('btn-no-photos');
                    } else {
                        registrosButton.classList.add('btn-no-photos');
                        registrosButton.classList.remove('btn-with-photos');
                    }
                }
                if (formaButton) {
                    if (hasFormaRecords) {
                        formaButton.classList.add('btn-with-photos');
                        formaButton.classList.remove('btn-no-photos');
                    } else {
                        formaButton.classList.add('btn-no-photos');
                        formaButton.classList.remove('btn-with-photos');
                    }
                }
            } else {
                console.error('Erro ao carregar dados do usuário.');
            }
        } catch (error) {
            console.error('Erro de conexão ao carregar dados:', error);
        }
    }

    editProfileBtn.addEventListener('click', () => {
        infoDisplay.style.display = 'none';
        infoForm.style.display = 'block';
    });

    cancelEditBtn.addEventListener('click', () => {
        infoDisplay.style.display = 'grid';
        infoForm.style.display = 'none';
        loadUserDataAndRecords(); 
    });

    profilePhotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                profilePhotoPreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        const passwordValue = document.getElementById('profile-password').value;
        const birthdateValue = document.getElementById('birthdate').value;

        formData.append('user_id', userId);
        formData.append('username', document.getElementById('profile-username').value);
        formData.append('email', document.getElementById('profile-email').value); 
        formData.append('height', document.getElementById('height').value);
        formData.append('initial_weight', document.getElementById('initial-weight-form').value);

        if (birthdateValue) {
            formData.append('birthdate', birthdateValue);
        }

        if (passwordValue.trim() !== '') {
            formData.append('password', passwordValue);
        }

        const photoFile = profilePhotoInput.files[0];
        if (photoFile) {
            formData.append('photo', photoFile);
        }

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                body: formData
            });

            // Exibir a query de depuração
            const responseData = await response.json(); 
            if (responseData.query && responseData.values) {
                debugOutput.value = `Query de depuração:\n\nSQL: ${responseData.query}\n\nValores: ${JSON.stringify(responseData.values, null, 2)}`;
            } else if (response.ok) {
                alert('Dados atualizados com sucesso!');
                infoDisplay.style.display = 'grid'; 
                infoForm.style.display = 'none';
                loadUserDataAndRecords(); 
                profileForm.reset();
                document.getElementById('profile-photo-upload').value = '';
            } else {
                alert(`Erro ao atualizar dados: ${responseData.message}`);
            }
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
            alert('Erro de conexão. Tente novamente.');
        }
    });

    loadUserDataAndRecords();
});