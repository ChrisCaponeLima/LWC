import { Pool } from 'pg';
import pkg from 'formidable';
const { IncomingForm } = pkg;
import cloudinary from 'cloudinary';
import bcrypt from 'bcryptjs';
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
        if (req.method === 'GET') {
            const usersResult = await client.query('SELECT id, username, email, photo_perfil_url, role, birthdate FROM users ORDER BY username ASC');
            res.status(200).json(usersResult.rows);

        } else if (req.method === 'POST') {
            const form = new IncomingForm();
            form.parse(req, async (err, fields, files) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao processar formulário.' });
                }

                try {
                    const username = fields.name ? fields.name[0] : null;
                    const email = fields.email ? fields.email[0] : null;
                    const birthdate = fields.birthdate ? fields.birthdate[0] : null;
                    const role = fields.role ? fields.role[0] : 'user';
                    const photoFile = files['profile-photo'] ? files['profile-photo'][0] : null;

                    if (!username || !email || !role) {
                        return res.status(400).json({ message: 'Campos obrigatórios faltando: nome, e-mail e cargo.' });
                    }
                    
                    let photo_perfil_url = 'https://api.iconify.design/solar:user-circle-bold-duotone.svg';
                    if (photoFile) {
                        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                        const maxSize = 5 * 1024 * 1024;

                        if (!allowedTypes.includes(photoFile.mimetype) || photoFile.size > maxSize) {
                            return res.status(400).json({ message: 'Tipo de arquivo inválido ou muito grande.' });
                        }
                        
                        try {
                            const result = await cloudinary.uploader.upload(photoFile.filepath, { folder: "user_photos" });
                            photo_perfil_url = result.secure_url;
                            fs.unlinkSync(photoFile.filepath);
                        } catch (uploadError) {
                            return res.status(500).json({ message: 'Erro ao fazer upload da foto.' });
                        }
                    }
                    
                    const hashedPassword = await bcrypt.hash('password123', 10);
                    
                    const result = await client.query(
                        'INSERT INTO users (username, email, password_hash, photo_perfil_url, birthdate, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                        [username, email, hashedPassword, photo_perfil_url, birthdate, role]
                    );
                    
                    const newUserId = result.rows[0].id;
                    res.status(201).json({ message: 'Usuário criado com sucesso!', userId: newUserId });
                } catch (dbError) {
                    console.error('Erro ao inserir novo usuário:', dbError);
                    res.status(500).json({ message: 'Erro ao inserir novo usuário. Verifique se o nome de usuário ou e-mail já existem.' });
                }
            });

        } else if (req.method === 'PUT') {
            const form = new IncomingForm();
            form.parse(req, async (err, fields, files) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao processar formulário.' });
                }

                try {
                    const user_id = fields.id ? fields.id[0] : null;
                    
                    if (!user_id) {
                        return res.status(400).json({ message: 'ID do usuário é obrigatório para atualização.' });
                    }

                    const username = fields.name ? fields.name[0] : null;
                    const email = fields.email ? fields.email[0] : null;
                    const birthdate = fields.birthdate ? fields.birthdate[0] : null;
                    const role = fields.role ? fields.role[0] : null;
                    const photoFile = files['profile-photo'] ? files['profile-photo'][0] : null;
                    
                    let photo_url_to_update = null;
                    
                    if (photoFile && photoFile.size > 0) {
                        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                        const maxSize = 5 * 1024 * 1024;

                        if (!allowedTypes.includes(photoFile.mimetype) || photoFile.size > maxSize) {
                            return res.status(400).json({ message: 'Tipo de arquivo inválido ou muito grande.' });
                        }
                        
                        try {
                            const result = await cloudinary.uploader.upload(photoFile.filepath, { folder: "user_photos" });
                            photo_url_to_update = result.secure_url;
                            fs.unlinkSync(photoFile.filepath);
                        } catch (uploadError) {
                            return res.status(500).json({ message: 'Erro ao fazer upload da foto.' });
                        }
                    }

                    const query = `
                        UPDATE users 
                        SET 
                            username = COALESCE($1, username), 
                            email = COALESCE($2, email),
                            photo_perfil_url = COALESCE($3, photo_perfil_url),
                            birthdate = COALESCE($4, birthdate),
                            role = COALESCE($5, role)
                        WHERE id = $6
                    `;
                    
                    const values = [
                        username,
                        email,
                        photo_url_to_update,
                        (birthdate && birthdate.trim() !== '') ? birthdate : null,
                        role,
                        user_id
                    ];

                    const result = await client.query(query, values);

                    if (result.rowCount === 0) {
                        return res.status(404).json({ message: 'Usuário não encontrado ou nenhum dado alterado.' });
                    }

                    return res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
                } catch (dbError) {
                    console.error('Erro ao atualizar usuário:', dbError);
                    res.status(500).json({ message: 'Erro ao atualizar usuário.' });
                }
            });

        } else if (req.method === 'DELETE') {
            const { id } = req.body;
            if (!id) {
                return res.status(400).json({ message: 'ID do usuário é obrigatório para exclusão.' });
            }

            const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
            res.status(200).json({ message: 'Usuário excluído com sucesso!' });
        
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