import { Pool } from 'pg';
import pkg from 'formidable';
const { IncomingForm } = pkg;
import cloudinary from 'cloudinary';
import fs from 'fs';

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

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
    const client = await pool.connect();
    
    try {
        if (req.method === 'POST') {
            const form = new IncomingForm();

            form.parse(req, async (err, fields, files) => {
                if (err) {
                    console.error('Erro ao processar o formulário:', err);
                    return res.status(500).json({ message: 'Erro ao processar o formulário.', error: err.message });
                }

                // Os campos do formidable vêm como arrays, precisamos pegar o primeiro item
                const id_usuario = fields.id_usuario ? fields.id_usuario[0] : null;
                const titulo = fields.titulo ? fields.titulo[0] : null;
                const mensagem = fields.mensagem ? fields.mensagem[0] : null;
                const imagemFile = files.imagem ? files.imagem[0] : null;

                // Validação básica
                if (!id_usuario || !mensagem) {
                    return res.status(400).json({ message: 'ID do usuário e mensagem são obrigatórios.' });
                }

                let imagem_url = null;
                if (imagemFile) {
                    try {
                        const result = await cloudinary.uploader.upload(imagemFile.filepath, { folder: "post_images" });
                        imagem_url = result.secure_url;
                        fs.unlinkSync(imagemFile.filepath); // Remove o arquivo temporário
                    } catch (uploadError) {
                        console.error('Erro ao fazer upload da imagem:', uploadError);
                        return res.status(500).json({ message: 'Erro ao fazer upload da imagem.', error: uploadError.message });
                    }
                }

                const query = `
                    INSERT INTO posts (id_usuario, titulo, mensagem, imagem_url)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id;
                `;
                const values = [id_usuario, titulo, mensagem, imagem_url];

                const result = await client.query(query, values);
                const postId = result.rows[0].id;

                return res.status(201).json({ message: 'Postagem criada com sucesso!', postId });
            });
        } else if (req.method === 'GET') {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            
            const query = `
                SELECT
                    p.id,
                    p.titulo,
                    p.mensagem,
                    p.imagem_url,
                    p.criado_em,
                    u.username AS nome_usuario,
                    u.photo_perfil_url AS foto_perfil,
                    COUNT(DISTINCT c.id) AS total_comentarios,
                    COUNT(DISTINCT rp.id_usuario) AS total_reacoes,
                    json_agg(
                        json_build_object(
                            'reacao', tr.nome_reacao,
                            'total', r_count.total
                        )
                    ) FILTER (WHERE tr.nome_reacao IS NOT NULL) AS reacoes_por_tipo
                FROM posts p
                JOIN users u ON p.id_usuario = u.id
                LEFT JOIN comentarios c ON p.id = c.id_post
                LEFT JOIN reacoes_post rp ON p.id = rp.id_post
                LEFT JOIN tipos_reacao tr ON rp.id_reacao = tr.id
                LEFT JOIN (
                    SELECT
                        id_post,
                        id_reacao,
                        COUNT(id_reacao) as total
                    FROM reacoes_post
                    GROUP BY id_post, id_reacao
                ) r_count ON rp.id_post = r_count.id_post AND rp.id_reacao = r_count.id_reacao
                GROUP BY p.id, u.id
                ORDER BY p.criado_em DESC
                LIMIT $1 OFFSET $2;
            `;

            const result = await client.query(query, [limit, offset]);

            return res.status(200).json(result.rows);
        } else {
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Método ${req.method} não permitido`);
        }
    } catch (error) {
        console.error('Erro na API /posts:', error);
        return res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    } finally {
        client.release();
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};