// login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    
    // Verifica se o usuário já está logado e, se sim, redireciona para a página principal.
    if (localStorage.getItem('userId')) {
        window.location.href = 'index.html';
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const firstName = usernameInput.split(' ')[0];

            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username: firstName, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('userId', data.userId);
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('role', data.role);
                    localStorage.setItem('userPhotoUrl', data.photoUrl || '');
                    localStorage.setItem('apelido', data.apelido || '');
                    
                    window.location.href = 'index.html';
                } else {
                    if (loginMessage) {
                        loginMessage.textContent = data.message || 'Credenciais inválidas.';
                        loginMessage.style.display = 'block';
                    } else {
                        alert(data.message || 'Credenciais inválidas.');
                    }
                }
            } catch (error) {
                if (loginMessage) {
                    loginMessage.textContent = 'Erro ao conectar com o servidor.';
                    loginMessage.style.display = 'block';
                } else {
                    alert('Erro ao conectar com o servidor.');
                }
                console.error('Erro de login:', error);
            }
        });
    }
});