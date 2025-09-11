// Função para carregar os dados do usuário logado
function loadLoggedInUser() {
    // Tenta obter as chaves individuais do localStorage
    const username = localStorage.getItem('username');
    const userPhotoUrl = localStorage.getItem('userPhotoUrl');
    const role = localStorage.getItem('role');

    // Se não houver nome de usuário, redireciona para o login
    if (!username) {
        window.location.href = 'login.html';
        return null;
    }

    // Retorna um objeto com os dados do usuário
    return {
        username: username,
        photo_perfil_url: userPhotoUrl,
        role: role
    };
}

// Função para atualizar a interface com os dados do usuário
function updateHeaderUI(user) {
    const userProfileName = document.getElementById('userProfileName');
    const userProfilePhoto = document.getElementById('userProfilePhoto');
    const adminMenuItem = document.getElementById('adminMenuItem');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (user) {
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

            window.location.href = 'login.html';
        });
    }
}

// Executa a lógica de autenticação ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = loadLoggedInUser();
    updateHeaderUI(loggedInUser);
});