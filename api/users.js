import { Pool } from 'pg';
import pkg from 'formidable';
const { IncomingForm } = pkg;
import cloudinary from 'cloudinary';
import bcrypt from 'bcryptjs';

// Configuração da conexão com o banco de dados
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

export default async function handler(req, res) {
    const client = await pool.connect();

    try {
        if (req.method === 'POST') {
            const form = new IncomingForm();

            form.parse(req, async (err, fields, files) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao processar formulário.' });
                }

                const { user_id, user_name, user_email, password, height } = fields;
                const photoFile = files.photo && files.photo.length > 0 ? files.photo[0] : null;

                let photo_url = null;
                if (photoFile) {
                    try {
                        const result = await cloudinary.uploader.upload(photoFile.filepath, { folder: "user_photos" });
                        photo_url = result.secure_url;
                    } catch (uploadError) {
                        console.error('Erro ao fazer upload da foto:', uploadError);
                        return res.status(500).json({ message: 'Erro ao fazer upload da foto.' });
                    }
                }

                if (user_id) { // Atualiza usuário existente
                    const updateFields = [];
                    const updateValues = [];
                    let paramIndex = 1;

                    if (user_name) { updateFields.push(`user_name = $${paramIndex++}`); updateValues.push(user_name[0]); }
                    if (user_email) { updateFields.push(`user_email = $${paramIndex++}`); updateValues.push(user_email[0]); }
                    if (password && password[0]) {
                        const hashedPassword = await bcrypt.hash(password[0], 10);
                        updateFields.push(`password = $${paramIndex++}`);
                        updateValues.push(hashedPassword);
                    }
                    if (photo_url) { updateFields.push(`photo_url = $${paramIndex++}`); updateValues.push(photo_url); }
                    if (height) { updateFields.push(`height_cm = $${paramIndex++}`); updateValues.push(parseInt(height[0])); }
                    
                    updateValues.push(user_id[0]);

                    if (updateFields.length > 0) {
                        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
                        await client.query(query, updateValues);
                    }
                    res.status(200).json({ message: 'Dados atualizados com sucesso.' });

                } else { // Cria novo usuário (login)
                    const hashedPassword = await bcrypt.hash(password[0], 10);
                    const result = await client.query(
                        'INSERT INTO users (user_name, user_email, password, photo_url, height_cm) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                        [user_name[0], user_email[0], hashedPassword, photo_url, parseInt(height[0])]
                    );
                    const newUserId = result.rows[0].id;
                    res.status(201).json({ message: 'Usuário criado com sucesso!', userId: newUserId });
                }
            });

        } else if (req.method === 'GET') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ message: 'ID de usuário é obrigatório.' });
            }

            const result = await client.query(
                'SELECT id, username, email, photo_perfil_url, height_cm FROM users WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
            res.status(200).json(result.rows[0]);

        } else {
            res.status(405).json({ message: 'Método não permitido.' });
        }
    } catch (error) {
        console.error('Erro na requisição da API:', error);
        res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    } finally {
        client.release();
    }
}

export const config = {
  api: {
    bodyParser: false,
  },
};