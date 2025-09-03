document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const dataForm = document.getElementById('dataForm');
    
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

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

    // Funções de Gráfico
    let weightChart, waistChart;
    const ctxWeight = document.getElementById('weightChart').getContext('2d');
    const ctxWaist = document.getElementById('waistChart').getContext('2d');

    // Funções de Análise e Exibição de Dados (Mesmas que você já tinha)
    function calculateBMI(weight, height) { /* ... */ }
    function getWeeklyStatus(records) { /* ... */ }
    function renderPhotos(photos) { /* ... */ }
    function filterData(period) { /* ... */ }
    
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
        formData.append('userId', userId); // Adiciona o ID do usuário ao formulário
        
        try {
            const response = await fetch('/api/records', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Registro salvo com sucesso!');
                dataForm.reset();
                fetchData(); // Recarrega os dados para atualizar a página
            } else {
                alert('Erro ao salvar o registro.');
            }
        } catch (error) {
            console.error('Erro ao enviar registro:', error);
            alert('Erro ao enviar registro. Verifique a conexão.');
        }
    });

    fetchData(); // Chama a função na inicialização
});