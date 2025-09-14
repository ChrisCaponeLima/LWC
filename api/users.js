// api/users.js - V2.0
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
        // Apenas a rota POST, sem alterações nas outras partes do arquivo
if (req.method === 'POST') {
    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao processar formulário.' });
        }

        const user_id = fields.user_id || null;
        const username = fields.username || null;
        const email = fields.user_email || null;
        const password = fields.password || null;
        const height = fields.height || null;
        const initial_weight = fields.initial_weight || null;
        const birthdate = fields.birthdate || null;
        const user_role = fields.role || null;
        
        // --- ADIÇÃO NECESSÁRIA PARA TRATAR 'apelido' e 'sexo' ---
        // Se o valor for a string 'null', converte para null
        const apelido = (fields.apelido === 'null') ? null : fields.apelido;
        const sexo = (fields.sexo === 'null') ? null : fields.sexo;
        // --------------------------------------------------------

        const photoFile = files.photo || null;

        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        if (user_id) {
            let photo_url_to_update = null;

            if (photoFile && photoFile.size > 0) {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                const maxSize = 5 * 1024 * 1024; // 5 MB

                if (!allowedTypes.includes(photoFile.mimetype) || photoFile.size > maxSize) {
                    return res.status(400).json({ message: 'Tipo de arquivo inválido ou muito grande. Apenas imagens JPEG, PNG ou GIF até 5MB são permitidas.' });
                }

                try {
                    const result = await cloudinary.uploader.upload(photoFile.filepath, { folder: "user_photos" });
                    photo_url_to_update = result.secure_url;
                    fs.unlinkSync(photoFile.filepath);
                } catch (uploadError) {
                    console.error('Erro ao fazer upload da foto:', uploadError);
                    return res.status(500).json({ message: 'Erro ao fazer upload da foto.' });
                }
            }

            const query = `
                UPDATE users 
                SET 
                    username = COALESCE($1, username), 
                    email = COALESCE($2, email), 
                    password_hash = COALESCE($3, password_hash), 
                    photo_perfil_url = COALESCE($4, photo_perfil_url), 
                    height_cm = COALESCE($5, height_cm), 
                    initial_weight_kg = COALESCE($6, initial_weight_kg), 
                    birthdate = COALESCE($7, birthdate),
                    apelido = COALESCE($8, apelido),
                    sexo = $9
                WHERE id = $10
            `;

            const values = [
                username,
                email,
                hashedPassword,
                photo_url_to_update,
                height ? parseFloat(height) : null,
                initial_weight ? parseFloat(initial_weight) : null,
                (birthdate && birthdate.trim() !== '') ? birthdate : null,
                apelido,
                sexo,
                user_id
            ];

            const result = await client.query(query, values);

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado ou nenhum dado alterado.' });
            }

            return res.status(200).json({ message: 'Perfil atualizado com sucesso!' });

        } else {
            // Lógica para criação de novo usuário
            let photo_perfil_url = 'https://api.iconify.design/solar:user-circle-bold-duotone.svg';
            if (photoFile) {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                const maxSize = 5 * 1024 * 1024; // 5 MB

                if (!allowedTypes.includes(photoFile.mimetype) || photoFile.size > maxSize) {
                    return res.status(400).json({ message: 'Tipo de arquivo inválido ou muito grande. Apenas imagens JPEG, PNG ou GIF até 5MB são permitidas.' });
                }

                try {
                    const result = await cloudinary.uploader.upload(photoFile.filepath, { folder: "user_photos" });
                    photo_perfil_url = result.secure_url;
                    fs.unlinkSync(photoFile.filepath);
                } catch (uploadError) {
                    console.error('Erro ao fazer upload da foto:', uploadError);
                    return res.status(500).json({ message: 'Erro ao fazer upload da foto.' });
                }
            }

            if (!username || !email || !password || !height || !initial_weight || !birthdate) {
                return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const result = await client.query(
                'INSERT INTO users (username, email, password_hash, photo_perfil_url, height_cm, initial_weight_kg, birthdate) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                [username, email, hashedPassword, photo_perfil_url, parseFloat(height), parseFloat(initial_weight), birthdate]
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

            const userResult = await client.query(
                // Adicionado 'sexo' e 'apelido' à consulta SELECT
                'SELECT id, username, email, birthdate, photo_perfil_url, height_cm, role, initial_weight_kg, apelido, sexo FROM users WHERE id = $1',
                [id]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }

            const userData = userResult.rows[0];

            const latestWeightResult = await client.query(
                'SELECT weight FROM records WHERE user_id = $1 ORDER BY record_date DESC LIMIT 1',
                [id]
            );

            let latestWeight = userData.initial_weight_kg;
            if (latestWeightResult.rows.length > 0) {
                latestWeight = latestWeightResult.rows[0].weight;
            }

            let bmi = null;
            if (userData.height_cm && latestWeight) {
                const heightInMeters = userData.height_cm / 100;
                bmi = (latestWeight / (heightInMeters * heightInMeters)).toFixed(2);
            }

            userData.latest_weight_kg = latestWeight;
            userData.bmi = bmi;

            const recordsResult = await client.query(
                'SELECT record_date, weight, photo_url, forma_url FROM records WHERE user_id = $1 ORDER BY record_date ASC',
                [id]
            );

            userData.records = recordsResult.rows;

            res.status(200).json(userData);

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