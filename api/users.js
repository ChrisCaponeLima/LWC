import pg from 'pg';
import { Pool } from 'pg';
import formidable from 'formidable';
const { IncomingForm } = formidable;
import cloudinary from 'cloudinary';

// Configuração da conexão com o banco de dados usando variáveis de ambiente
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

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Exporta uma função padrão para Vercel
export default async function handler(req, res) {
    const client = await pool.connect();

    try {
        if (req.method === 'POST' || req.method === 'PUT') {
            const form = new formidable.IncomingForm();

            form.parse(req, async (err, fields, files) => {
                if (err) {
                    console.error('Erro ao processar formulário:', err);
                    return res.status(500).json({ message: 'Erro ao processar formulário.' });
                }

                const { name, email, birthdate, role, id } = fields;
                const finalBirthdate = birthdate[0] === '' ? null : birthdate[0];

                let photo_perfil_url = null;
                const photoFile = files.photo_perfil_url ? files.photo_perfil_url[0] : null;

                if (photoFile) {
                    try {
                        const result = await cloudinary.uploader.upload(photoFile.filepath, { folder: "user_photos" });
                        photo_perfil_url = result.secure_url;
                    } catch (uploadError) {
                        console.error('Erro ao fazer upload da foto:', uploadError);
                        return res.status(500).json({ message: 'Erro ao fazer upload da foto.' });
                    }
                }

                if (req.method === 'POST') {
                    // Criação de usuário
                    await client.query(
                        'INSERT INTO users (username, email, birthdate, role, photo_perfil_url) VALUES ($1, $2, $3, $4, $5)',
                        [name[0], email[0], finalBirthdate, role[0], photo_perfil_url]
                    );
                    res.status(201).json({ message: 'Usuário criado com sucesso!' });
                } else {
                    // Atualização de usuário
                    await client.query(
                        'UPDATE users SET username = $1, email = $2, birthdate = $3, role = $4, photo_perfil_url = $5 WHERE id = $6',
                        [name[0], email[0], finalBirthdate, role[0], photo_perfil_url, id[0]]
                    );
                    res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
                }
            });
        } else if (req.method === 'DELETE') {
            const { id: deleteId } = req.body;
            await client.query('DELETE FROM users WHERE id = $1', [deleteId]);
            res.status(200).json({ message: 'Usuário excluído com sucesso!' });
        } else if (req.method === 'GET') {
            const result = await client.query('SELECT id, username, email, birthdate, role, photo_perfil_url FROM users ORDER BY username');
            res.status(200).json(result.rows);
        } else {
            res.status(405).json({ message: 'Método não permitido' });
        }
    } catch (error) {
        console.error('Erro na requisição da API:', error);
        res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    } finally {
        client.release();
    }
}

// Desabilita o parser de corpo padrão do Vercel
export const config = {
  api: {
    bodyParser: false,
  },
};