// login.js - V1.0
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    
    // Verifica se o usuário já está logado
    if (localStorage.getItem('userId')) {
        window.location.href = 'index.html';
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Autenticação bem-sucedida
                    localStorage.setItem('userId', data.userId);
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('role', data.role);
                    localStorage.setItem('userPhotoUrl', data.photoUrl || '');
                    
                    // -- Linha que garante que o apelido seja salvo --
                    localStorage.setItem('apelido', data.apelido || '');
                    // -- Fim da linha --
                    
                    window.location.href = 'index.html';
                } else {
                    // Autenticação falhou
                    loginMessage.textContent = data.message;
                    loginMessage.style.display = 'block';
                }
            } catch (error) {
                loginMessage.textContent = 'Erro ao conectar com o servidor.';
                loginMessage.style.display = 'block';
                console.error('Erro de login:', error);
            }
        });
    }
});