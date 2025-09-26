//components/Post.js - V1.2
import React from 'react';
import Image from 'next/image';
import PostActions from './PostActions';

function Post({ post }) {
    const formatDateTime = (timestamp) => {
        const date = new Date(timestamp);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('pt-BR', options);
    };

    return (
        <div className="post-card">
            <div className="post-header">
                <img
                    src={post.foto_perfil || '/default-avatar.svg'}
                    alt="Foto de perfil"
                    className="avatar"
                />
                <div className="user-info">
                    <span className="username">{post.nome_usuario}</span>
                    <span className="post-date">{formatDateTime(post.criado_em)}</span>
                </div>
            </div>
            
            {post.titulo && <h2 className="post-title">{post.titulo}</h2>}
            <p className="post-message">{post.mensagem}</p>
            
            {post.imagem_url && (
                <div className="post-image-container">
                    <Image
                        src={post.imagem_url}
                        alt="Imagem da postagem"
                        layout="responsive"
                        width={700}
                        height={400}
                        objectFit="cover"
                    />
                </div>
            )}
            
            <PostActions
                postId={post.id}
                totalReacoes={post.total_reacoes}
                totalComentarios={post.total_comentarios}
                reacoesPorTipo={post.reacoes_por_tipo}
            />
        </div>
    );
}

export default Post;