//components/PostActions.js - V1.3
import React, { useState, useEffect } from 'react';
import Comentario from './Comentario';

function PostActions({ postId, totalReacoes, totalComentarios, reacoesPorTipo }) {
    const [comentarios, setComentarios] = useState([]);
    const [novoComentario, setNovoComentario] = useState('');
    const [mostrarComentarios, setMostrarComentarios] = useState(false);
    
    const userId = 1;

    // Função para buscar e montar a árvore de comentários
    const fetchComentarios = async () => {
        try {
            const response = await fetch(`/api/interacoes/comentarios/${postId}`);
            if (!response.ok) throw new Error('Falha ao carregar comentários.');
            const data = await response.json();
            
            // Constrói a árvore de comentários
            const comentariosMap = new Map();
            data.forEach(c => comentariosMap.set(c.id, { ...c, respostas: [] }));
            
            const comentariosRaiz = [];
            data.forEach(c => {
                if (c.id_comentario_pai) {
                    comentariosMap.get(c.id_comentario_pai)?.respostas.push(comentariosMap.get(c.id));
                } else {
                    comentariosRaiz.push(comentariosMap.get(c.id));
                }
            });

            setComentarios(comentariosRaiz);
        } catch (error) {
            console.error('Erro ao buscar comentários:', error);
        }
    };

    useEffect(() => {
        if (mostrarComentarios) {
            fetchComentarios();
        }
    }, [postId, mostrarComentarios]);

    const handleComentar = async (id_comentario_pai, mensagem) => {
        if (!mensagem.trim()) return;

        const formData = new FormData();
        formData.append('id_usuario', userId);
        formData.append('id_post', postId);
        formData.append('mensagem', mensagem);
        if (id_comentario_pai) {
            formData.append('id_comentario_pai', id_comentario_pai);
        }

        try {
            const response = await fetch('/api/interacoes/comentar', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                console.log('Comentário adicionado com sucesso!');
                // Recarrega os comentários para atualizar a árvore
                await fetchComentarios();
            } else {
                console.error('Erro ao postar comentário.');
            }
        } catch (error) {
            console.error('Erro de rede:', error);
        }
    };
    
    // Novo handler para comentários principais
    const handleComentarioPrincipal = (e) => {
        e.preventDefault();
        handleComentar(null, novoComentario);
        setNovoComentario('');
    };

    const handleReagir = async (reacaoId) => {
        const formData = new FormData();
        formData.append('id_usuario', userId);
        formData.append('id_post', postId);
        formData.append('id_reacao', reacaoId);
        
        try {
            const response = await fetch('/api/interacoes/reagir', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                console.log('Reação processada com sucesso.');
            } else {
                console.error('Erro ao reagir.');
            }
        } catch (error) {
            console.error('Erro de rede ao reagir:', error);
        }
    };

    return (
        <div>
            <div className="post-actions-summary">
                {reacoesPorTipo && reacoesPorTipo.length > 0 && (
                    <div className="reactions-list">
                        {reacoesPorTipo.map((reacao, index) => (
                            <span key={index} className="reaction-item">
                                {reacao.reacao}: {reacao.total}
                            </span>
                        ))}
                    </div>
                )}
                <span>{totalReacoes || 0} Reações</span>
                <span>{totalComentarios || 0} Comentários</span>
            </div>
            <div className="post-action-buttons">
                <button onClick={() => handleReagir(1)}>Curtir</button>
                <button onClick={() => setMostrarComentarios(!mostrarComentarios)}>
                    Comentar
                </button>
            </div>
            
            {mostrarComentarios && (
                <div className="comentarios-container">
                    <form onSubmit={handleComentarioPrincipal}>
                        <input
                            type="text"
                            value={novoComentario}
                            onChange={(e) => setNovoComentario(e.target.value)}
                            placeholder="Escreva um comentário..."
                        />
                        <button type="submit">Enviar</button>
                    </form>

                    <div className="lista-comentarios">
                        {comentarios.length > 0 ? (
                            comentarios.map(comentario => (
                                <Comentario key={comentario.id} comentario={comentario} onReply={handleComentar} />
                            ))
                        ) : (
                            <p>Seja o primeiro a comentar!</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PostActions;