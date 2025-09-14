//CreatePost.js - V1.0
import React, { useState } from 'react';

function CreatePost() {
    // Definimos os estados para cada campo do formulário
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('');

        // Crio um objeto FormData para enviar os dados do formulário
        const formData = new FormData();
        // Nota: O ID do usuário deve vir de uma fonte real, como um contexto de autenticação.
        // Por enquanto, usaremos um ID de exemplo.
        const userId = 1; 
        
        formData.append('id_usuario', userId);
        formData.append('titulo', title);
        formData.append('mensagem', message);
        if (image) {
            formData.append('imagem', image);
        }

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                // Limpa o formulário em caso de sucesso
                setTitle('');
                setMessage('');
                setImage(null);
                setStatus('Postagem criada com sucesso!');
                console.log('Postagem criada:', data);
                // Você pode querer recarregar a timeline aqui
            } else {
                setStatus(`Erro: ${data.message || 'Falha ao criar a postagem.'}`);
            }
        } catch (error) {
            console.error('Erro ao enviar a postagem:', error);
            setStatus('Erro de conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-post-container">
            <h3>Criar Nova Postagem</h3>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Título (opcional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                    placeholder="O que você está pensando?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Publicando...' : 'Publicar'}
                </button>
            </form>
            {status && <p>{status}</p>}
        </div>
    );
}

export default CreatePost;