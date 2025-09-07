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

                // Acesso aos campos como strings, como nas versões antigas do formidable
                const user_id = fields.user_id || null;
                const user_name = fields.user_name || null;
                const user_email = fields.user_email || null;
                const password = fields.password || null;
                const height = fields.height || null;
                const initial_weight = fields.initial_weight || null;

                // Acesso ao objeto de arquivo, como na versão 1.2.6 do formidable
                const photoFile = files.photo || null;
                
                let hashedPassword = null;
                if (password) {
                    hashedPassword = await bcrypt.hash(password, 10);
                }

                if (user_id) {
                    // Lógica para atualizar o usuário
                    let photo_url = null;
                    if (photoFile) {
                        try {
                            const result = await cloudinary.uploader.upload(photoFile.path, { folder: "user_photos" });
                            photo_url = result.secure_url;
                        } catch (uploadError) {
                            console.error('Erro ao fazer upload da foto:', uploadError);
                            return res.status(500).json({ message: 'Erro ao fazer upload da foto.', error: uploadError });
                        }
                    }

                    const updateFields = [];
                    const updateValues = [];
                    let paramIndex = 1;

                    if (user_name) {
                        updateFields.push(`user_name = $${paramIndex++}`);
                        updateValues.push(user_name);
                    }
                    if (user_email) {
                        updateFields.push(`user_email = $${paramIndex++}`);
                        updateValues.push(user_email);
                    }
                    if (hashedPassword) {
                        updateFields.push(`password = $${paramIndex++}`);
                        updateValues.push(hashedPassword);
                    }
                    if (photo_url) {
                        updateFields.push(`photo_url = $${paramIndex++}`);
                        updateValues.push(photo_url);
                    }
                    if (height) {
                        updateFields.push(`height_cm = $${paramIndex++}`);
                        updateValues.push(parseInt(height));
                    }
                    if (initial_weight) {
                        updateFields.push(`initial_weight_kg = $${paramIndex++}`);
                        updateValues.push(parseFloat(initial_weight));
                    }

                    if (updateFields.length > 0) {
                        updateValues.push(user_id);
                        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
                        await client.query(query, updateValues);
                    }

                    res.status(200).json({ message: 'Dados do usuário atualizados com sucesso.' });
                } else {
                    // Lógica para criar um novo usuário
                    let photo_url = 'https://api.iconify.design/solar:user-circle-bold-duotone.svg';
                    if (photoFile) {
                        try {
                            const result = await cloudinary.uploader.upload(photoFile.path, { folder: "user_photos" });
                            photo_url = result.secure_url;
                        } catch (uploadError) {
                            console.error('Erro ao fazer upload da foto:', uploadError);
                            return res.status(500).json({ message: 'Erro ao fazer upload da foto.', error: uploadError });
                        }
                    }
                    
                    if (!user_name || !user_email || !password || !height || !initial_weight) {
                         return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
                    }

                    const hashedPassword = await bcrypt.hash(password, 10);

                    const result = await client.query(
                        'INSERT INTO users (user_name, user_email, password, photo_url, height_cm, initial_weight_kg) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                        [user_name, user_email, hashedPassword, photo_url, parseInt(height), parseFloat(initial_weight)]
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
                'SELECT id, user_name, user_email, photo_url, height_cm, initial_weight_kg FROM users WHERE id = $1',
                [id]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }

            const userData = userResult.rows[0];

            // Busca o peso mais recente do usuário
            const latestWeightResult = await client.query(
                'SELECT weight FROM records WHERE user_id = $1 ORDER BY record_date DESC LIMIT 1',
                [id]
            );

            let latestWeight = userData.initial_weight_kg;
            if (latestWeightResult.rows.length > 0) {
                latestWeight = latestWeightResult.rows[0].weight;
            }

            // Calcula o IMC com base no peso mais recente ou inicial
            let bmi = null;
            if (userData.height_cm && latestWeight) {
                const heightInMeters = userData.height_cm / 100;
                bmi = (latestWeight / (heightInMeters * heightInMeters)).toFixed(2);
            }

            // Adiciona o peso mais recente e o IMC ao objeto de resposta
            userData.latest_weight_kg = latestWeight;
            userData.bmi = bmi;
            
            // Busca todos os registros de peso para o gráfico
            const recordsResult = await client.query(
                'SELECT record_date, weight FROM records WHERE user_id = $1 ORDER BY record_date ASC',
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