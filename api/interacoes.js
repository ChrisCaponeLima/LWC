// api/interacoes.js - V1.0
import { Pool } from 'pg';
import pkg from 'formidable';
const { IncomingForm } = pkg;

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: {
        rejectUnauthorized: false
    }
});

export default async function handler(req, res) {
    const client = await pool.connect();

    try {
        if (req.method === 'POST') {
            const form = new IncomingForm();

            form.parse(req, async (err, fields) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao processar o formulário.', error: err.message });
                }

                // O formidable retorna campos como arrays, então pegamos o primeiro item
                const id_usuario = fields.id_usuario ? fields.id_usuario[0] : null;
                const id_post = fields.id_post ? fields.id_post[0] : null;
                const id_comentario_pai = fields.id_comentario_pai ? fields.id_comentario_pai[0] : null;

                // POST para Comentar
                if (req.url === '/api/interacoes/comentar') {
                    const mensagem = fields.mensagem ? fields.mensagem[0] : null;

                    if (!id_usuario || !id_post || !mensagem) {
                        return res.status(400).json({ message: 'ID do usuário, ID da postagem e mensagem são obrigatórios.' });
                    }

                    const query = `
                        INSERT INTO comentarios (id_usuario, id_post, mensagem, id_comentario_pai)
                        VALUES ($1, $2, $3, $4)
                        RETURNING id;
                    `;
                    const values = [id_usuario, id_post, mensagem, id_comentario_pai];

                    await client.query(query, values);
                    return res.status(201).json({ message: 'Comentário adicionado com sucesso!' });
                }

                // POST para Reagir
                if (req.url === '/api/interacoes/reagir') {
                    const id_reacao = fields.id_reacao ? fields.id_reacao[0] : null;

                    if (!id_usuario || !id_post || !id_reacao) {
                        return res.status(400).json({ message: 'ID do usuário, ID da postagem e ID da reação são obrigatórios.' });
                    }

                    // Tenta inserir a reação
                    const insertQuery = `
                        INSERT INTO reacoes_post (id_usuario, id_post, id_reacao)
                        VALUES ($1, $2, $3);
                    `;
                    const insertValues = [id_usuario, id_post, id_reacao];

                    await client.query(insertQuery, insertValues);
                    return res.status(201).json({ message: 'Reação adicionada com sucesso!' });
                }

            });

        } else if (req.method === 'GET') {
            // GET para listar comentários de uma postagem
            const { pathname } = new URL(req.url, `http://${req.headers.host}`);
            const pathSegments = pathname.split('/');
            const id_post = pathSegments[pathSegments.length - 1];

            if (req.url.startsWith('/api/interacoes/comentarios/')) {
                if (!id_post) {
                    return res.status(400).json({ message: 'ID da postagem é obrigatório.' });
                }

                const query = `
                    SELECT
                        c.id,
                        c.mensagem,
                        c.criado_em,
                        u.username AS nome_usuario,
                        u.photo_perfil_url AS foto_perfil
                    FROM comentarios c
                    JOIN users u ON c.id_usuario = u.id
                    WHERE c.id_post = $1
                    ORDER BY c.criado_em ASC;
                `;
                const result = await client.query(query, [id_post]);

                return res.status(200).json(result.rows);
            }

        } else {
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Método ${req.method} não permitido`);
        }
    } catch (error) {
        if (error.code === '23505' && req.url === '/api/interacoes/reagir') {
            // Código '23505' é para violação de UNIQUE constraint.
            // Significa que o usuário já reagiu àquela postagem.
            // Neste caso, vamos deletar a reação existente (funciona como um "undo")
            const form = new IncomingForm();
            form.parse(req, async (err, fields) => {
                const id_usuario = fields.id_usuario ? fields.id_usuario[0] : null;
                const id_post = fields.id_post ? fields.id_post[0] : null;
                
                const deleteQuery = `
                    DELETE FROM reacoes_post
                    WHERE id_usuario = $1 AND id_post = $2;
                `;
                await client.query(deleteQuery, [id_usuario, id_post]);
                return res.status(200).json({ message: 'Reação removida com sucesso!' });
            });
        } else {
            console.error('Erro na API de interações:', error);
            return res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
        }
    } finally {
        client.release();
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};