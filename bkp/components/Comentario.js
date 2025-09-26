//components/Comentario.js - V1.1
import React, { useState } from 'react';

function Comentario({ comentario, onReply }) {
    const [mostrarResposta, setMostrarResposta] = useState(false);
    const [textoResposta, setTextoResposta] = useState('');

    const handleResposta = (e) => {
        e.preventDefault();
        onReply(comentario.id, textoResposta); // Chama a função do pai com o ID do comentário e o texto
        setTextoResposta('');
        setMostrarResposta(false);
    };

    return (
        <div className="comentario-item">
            <div className="comentario-header">
                <img src={comentario.foto_perfil} alt="avatar" className="avatar" />
                <span className="comentario-usuario">{comentario.nome_usuario}</span>
            </div>
            <p>{comentario.mensagem}</p>
            <span className="reply-link" onClick={() => setMostrarResposta(!mostrarResposta)}>Responder</span>

            {mostrarResposta && (
                <form onSubmit={handleResposta}>
                    <input
                        type="text"
                        value={textoResposta}
                        onChange={(e) => setTextoResposta(e.target.value)}
                        placeholder="Escreva sua resposta..."
                    />
                    <button type="submit">Enviar</button>
                </form>
            )}

            {/* Renderiza as respostas aninhadas, se existirem */}
            {comentario.respostas && comentario.respostas.length > 0 && (
                <div className="comentarios-aninhados">
                    {comentario.respostas.map(resposta => (
                        <Comentario key={resposta.id} comentario={resposta} onReply={onReply} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Comentario;