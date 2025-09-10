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
    
    const initialWeightElem = document.getElementById('initial-weight');
    const currentWeightElem = document.getElementById('current-weight');
    const userHeightElem = document.getElementById('user-height');
    const userBmiElem = document.getElementById('user-bmi');

    const registrosButton = document.getElementById('registrosButtonCollapse');
    const formaButton = document.getElementById('formaButtonCollapse');
    const debugOutput = document.getElementById('debug-output');

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
        
        const formData = new FormData(profileForm);
        formData.append('user_id', userId);
        
        const passwordValue = document.getElementById('profile-password').value;
        if (passwordValue.trim() === '') {
            formData.delete('password');
        }

        let debugText = "--- Dados do Formulário (FormData) ---\n";
        for (let pair of formData.entries()) {
            debugText += `${pair[0]}: ${pair[1]}\n`;
        }
        
        debugOutput.value = debugText;

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const responseData = await response.json();

                // --- INÍCIO DA LÓGICA DE DEPURAÇÃO CORRIGIDA ---
                // Agora, verificamos se a resposta do backend contém 'fields'.
                if (responseData.fields) {
                    let backendDebugText = "\n-------------------------\n";
                    backendDebugText += "--- Saída de depuração do Backend ---\n";
                    backendDebugText += `Campos recebidos pelo Formidable: \n${JSON.stringify(responseData.fields, null, 2)}`;
                    debugOutput.value += backendDebugText; // Adiciona ao conteúdo existente
                    alert('Teste de depuração concluído. Os campos do backend estão no campo de depuração.');
                    // Não fechamos o formulário para que você possa ler o resultado.
                } else if (responseData.query && responseData.values) {
                // Mantemos esta lógica para o próximo passo.
                    let backendDebugText = "\n-------------------------\n";
                    backendDebugText += "--- Saída de depuração do Backend ---\n";
                    backendDebugText += `Query: \n${responseData.query}\n\n`;
                    backendDebugText += `Values: \n${JSON.stringify(responseData.values, null, 2)}`;
                    debugOutput.value += backendDebugText;
                    alert('Teste de depuração concluído. A query está no campo de depuração.');
                } else {
                // Caso não haja depuração, a lógica de sucesso continua.
                    alert('Dados atualizados com sucesso!');
                    infoDisplay.style.display = 'grid'; 
                    infoForm.style.display = 'none';
                    loadUserDataAndRecords(); 
                    profileForm.reset();
                    document.getElementById('profile-photo-upload').value = '';
                }
                // --- FIM DA LÓGICA DE DEPURAÇÃO CORRIGIDA ---

            } else {
                const errorData = await response.json();
                alert(`Erro ao atualizar dados: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
            alert('Erro de conexão. Tente novamente.');
        }
    });

    loadUserDataAndRecords();
});