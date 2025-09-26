// timeline.js - V1.0
import React, { useState, useEffect } from 'react';
import Post from './Post'; // Componente que criaremos depois

function Timeline() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch('/api/posts');
                if (!response.ok) {
                    throw new Error('Erro ao carregar as postagens.');
                }
                const data = await response.json();
                setPosts(data);
            } catch (err) {
                setError(err.message);
                console.error('Falha ao buscar as postagens:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []); // O array vazio [] garante que a função só será executada uma vez, no carregamento inicial.

    if (loading) {
        return <div>Carregando a sua timeline...</div>;
    }

    if (error) {
        return <div>Erro: {error}</div>;
    }

    if (posts.length === 0) {
        return <div>Ainda não há postagens. Seja o primeiro a criar uma!</div>;
    }

    return (
        <div className="timeline-container">
            {posts.map(post => (
                <Post key={post.id} post={post} />
            ))}
        </div>
    );
}

export default Timeline;