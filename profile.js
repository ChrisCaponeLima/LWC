document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const profileForm = document.getElementById('profileForm');
    const profilePhotoInput = document.getElementById('profile-photo-upload');
    const profilePhoto = document.getElementById('profilePhoto');
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');

    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // Função para carregar os dados do usuário na página
    async function loadUserData() {
        try {
            const response = await fetch(`/api/users?id=${userId}`);
            if (!response.ok) {
                throw new Error('Usuário não encontrado.');
            }
            const user = await response.json();

            // Exibe os dados na página
            document.getElementById('profile-username').value = user.user_name || '';
            document.getElementById('profile-email').value = user.user_email || '';
            document.getElementById('height').value = user.height_cm || ''; // Define o valor da altura

            userNameElement.textContent = user.user_name || 'Usuário';
            userEmailElement.textContent = user.user_email || 'email@exemplo.com';
            if (user.photo_url) {
                profilePhoto.src = user.photo_url;
            }

            // Salva os dados no localStorage para uso na página principal
            localStorage.setItem('username', user.user_name || 'Usuário');
            localStorage.setItem('userPhotoUrl', user.photo_url || '');
            localStorage.setItem('userHeightCm', user.height_cm || '');

        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            alert('Erro ao carregar dados do usuário. Tente novamente mais tarde.');
        }
    }

    // Pré-visualização da foto
    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = e => {
                    profilePhoto.src = e.target.result;
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
            formData.append('height', document.getElementById('height').value); // Adiciona a altura ao FormData

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
                    loadUserData();
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

    // Carrega os dados na inicialização
    loadUserData();
});