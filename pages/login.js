// pages/login.js - V1.0
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [loginMessage, setLoginMessage] = useState('');
    const [messageType, setMessageType] = useState('text-danger');

    // Redireciona se o usuário já estiver logado
    useEffect(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('userId')) {
            router.push('/');
        }
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const username = e.target.username.value;
        const password = e.target.password.value;

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
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('username', data.username);
                localStorage.setItem('role', data.role);
                localStorage.setItem('userPhotoUrl', data.photoUrl || '');
                localStorage.setItem('apelido', data.apelido || '');

                setMessageType('text-success');
                setLoginMessage(data.message);
                router.push('/');
            } else {
                setMessageType('text-danger');
                setLoginMessage(data.message);
            }
        } catch (error) {
            setMessageType('text-danger');
            setLoginMessage('Erro ao conectar-se ao servidor.');
        }
    };

    return (
        <>
            <Head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Login - LWC</title>
                <link rel="stylesheet" href="/style.css" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
            </Head>
            
            <header className="app-header">
                <h1 className="h1-title">Login</h1>
            </header>

            <div className="container main-content d-flex justify-content-center align-items-center">
                <div className="form-card login-card">
                    <h2 className="h2-title text-center">Acesse sua conta</h2>
                    <form id="loginForm" onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">Nome de Usuário</label>
                            <input type="text" className="form-control" id="username" name="username" required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Senha</label>
                            <input type="password" className="form-control" id="password" name="password" required />
                        </div>
                        <div className="d-grid gap-2">
                            <button type="submit" className="btn-control">Entrar</button>
                        </div>
                        <div className="text-center mt-3">
                            <a href="#" className="small-text-link">Esqueceu sua senha?</a>
                        </div>
                        {loginMessage && (
                            <div id="loginMessage" className={`mt-3 text-center ${messageType}`}>
                                {loginMessage}
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
        </>
    );
}