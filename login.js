document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    // Verifica se o usuário já está logado
    if (localStorage.getItem('userId')) {
        window.location.href = 'index.html';
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // Salva o ID do usuário, nome e URL da foto no localStorage
                    localStorage.setItem('userId', data.userId);
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('userPhotoUrl', data.photoUrl); 

                    alert('Login bem-sucedido!');
                    window.location.href = 'index.html';
                } else {
                    const errorData = await response.json();
                    alert(`Erro de login: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Erro de conexão:', error);
                alert('Erro de conexão. Tente novamente.');
            }
        });
    }
});