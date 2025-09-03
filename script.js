document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const userPhotoUrl = localStorage.getItem('userPhotoUrl'); // Pega a URL da foto
    const dataForm = document.getElementById('dataForm');
    const toggleFormBtn = document.getElementById('toggleFormBtn');
    const formContainer = document.getElementById('formContainer');
    
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

    // Fetch inicial dos dados
    async function fetchData() {
        try {
            const response = await fetch(`/api/records?userId=${userId}`);
            const records = await response.json();
            
            // ... sua lógica de processamento dos dados ...
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            motivationMessage.textContent = 'Erro ao carregar dados. Tente novamente mais tarde.';
        }
    }
    
    // Submissão do formulário
    dataForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = new FormData(this);
        formData.append('userId', userId);
        
        try {
            const response = await fetch('/api/records', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Registro salvo com sucesso!');
                dataForm.reset();
                fetchData();
            } else {
                alert('Erro ao salvar o registro.');
            }
        } catch (error) {
            console.error('Erro ao enviar registro:', error);
            alert('Erro ao enviar registro. Verifique a conexão.');
        }
    });

    fetchData();
});