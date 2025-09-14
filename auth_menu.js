// auth_menu.js - V1.0
// Função para carregar os dados do usuário logado do localStorage
function loadLoggedInUser() {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const userPhotoUrl = localStorage.getItem('userPhotoUrl');
    const role = localStorage.getItem('role');
    const userHeightCm = localStorage.getItem('userHeightCm');
    const apelido = localStorage.getItem('apelido');

    if (!userId) {
        window.location.href = 'login.html';
        return null;
    }

    // Retorna um objeto completo com todos os dados necessários
    return {
        id: userId,
        username: username,
        photo_perfil_url: userPhotoUrl,
        role: role,
        height_cm: userHeightCm,
        apelido: apelido
    };
}

// Função para atualizar a UI do cabeçalho com base no usuário logado
function updateHeaderUI(user) {
    const userProfileName = document.getElementById('userProfileName');
    const userProfilePhoto = document.getElementById('userProfilePhoto');
    const adminMenuItem = document.getElementById('adminMenuItem');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (user) {
        // CORRIGIDO: O nome no cabeçalho deve ser o nome de usuário completo.
        userProfileName.textContent = user.username || 'Meu Perfil';
        userProfilePhoto.src = user.photo_perfil_url || 'https://api.iconify.design/solar:user-circle-bold-duotone.svg';

        // Exibe o item do menu de admin se o cargo for 'admin'
        if (adminMenuItem) {
            adminMenuItem.style.display = (user.role === 'admin') ? 'list-item' : 'none';
        }
    }

    // Configura o botão de logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove todas as chaves de usuário ao sair
            localStorage.removeItem('username');
            localStorage.removeItem('userPhotoUrl');
            localStorage.removeItem('role');
            localStorage.removeItem('userHeightCm');
            localStorage.removeItem('userId');
            localStorage.removeItem('apelido');

            window.location.href = 'login.html';
        });
    }
}

// -- NOVA FUNÇÃO PARA SAUDAÇÃO NA PÁGINA PRINCIPAL --
function updateGreetingMessage(user) {
    const greetingMessage = document.getElementById('greeting-message');
    const loadingStatusText = document.getElementById('loading-status-text');

    if (user) {
        // Lógica de saudação: usa apelido, senão o primeiro nome
        let displayName = user.username;
        if (user.apelido && user.apelido.trim() !== '') {
            displayName = user.apelido;
        } else if (user.username) {
            displayName = user.username.split(' ')[0];
        }

        const currentHour = new Date().getHours();
        let greeting;

        if (currentHour >= 5 && currentHour < 12) {
            greeting = `Bom dia, ${displayName}!`;
        } else if (currentHour >= 12 && currentHour < 18) {
            greeting = `Boa tarde, ${displayName}!`;
        } else {
            greeting = `Boa noite, ${displayName}!`;
        }
        
        greetingMessage.textContent = greeting;
        loadingStatusText.style.display = 'none'; // Oculta o texto de carregamento
    }
}
// -- FIM DA NOVA FUNÇÃO --

// Executa a lógica de autenticação ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = loadLoggedInUser();
    updateHeaderUI(loggedInUser);
    // -- CORRIGIDO: Chama a nova função de saudação
    updateGreetingMessage(loggedInUser);
});