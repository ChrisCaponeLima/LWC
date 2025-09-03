document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = loginForm.username.value;
        const password = loginForm.password.value;

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
                localStorage.setItem('userPhotoUrl', data.photoUrl || ''); // Salva a URL da foto
                window.location.href = 'index.html'; // Redireciona para o dashboard
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
});