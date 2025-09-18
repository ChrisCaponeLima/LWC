// auth_menu.js
// Script para gerenciar o estado de login e a UI do cabeçalho

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

    return {
        id: userId,
        username: username,
        photo_perfil_url: userPhotoUrl,
        role: role,
        height_cm: userHeightCm,
        apelido: apelido
    };
}

function updateHeaderUI(user) {
    const userProfileName = document.getElementById('userProfileName');
    const userProfilePhoto = document.getElementById('userProfilePhoto');
    const adminMenuItem = document.getElementById('adminMenuItem');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (user) {
        // CORRIGIDO: O nome no cabeçalho agora sempre exibe apenas o primeiro nome
        const firstName = user.username ? user.username.split(' ')[0] : 'Meu Perfil';
        userProfileName.textContent = firstName;
        userProfilePhoto.src = user.photo_perfil_url || 'https://api.iconify.design/solar:user-circle-bold-duotone.svg';

        if (adminMenuItem) {
            adminMenuItem.style.display = (user.role === 'admin') ? 'list-item' : 'none';
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
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

// Função para atualizar a mensagem de saudação na página principal
function updateGreetingMessage(user) {
    const greetingMessage = document.getElementById('greeting-message');
    const loadingStatusText = document.getElementById('loading-status-text');

    if (user && greetingMessage) {
        // Lógica de saudação: usa apelido, senão o primeiro nome
        let displayName = user.apelido;
        if (!displayName || displayName.trim() === '') {
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
        if (loadingStatusText) {
            loadingStatusText.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = loadLoggedInUser();
    updateHeaderUI(loggedInUser);
    updateGreetingMessage(loggedInUser);
});