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

                const user_id = fields.user_id ? fields.user_id[0] : null;
                const username = fields.username ? fields.username[0] : null;
                const email = fields.email ? fields.email[0] : null;
                const password = fields.password ? fields.password[0] : null;
                const height = fields.height ? fields.height[0] : null;
                const initial_weight = fields.initial_weight ? fields.initial_weight[0] : null;
                const birthdate = fields.birthdate ? fields.birthdate[0] : null;
                const photoFile = files.photo && files.photo.length > 0 ? files.photo[0] : null;
                
                let hashedPassword = null;
                if (password) {
                    hashedPassword = await bcrypt.hash(password, 10);
                }

                if (user_id) { // Atualiza usuário existente
                    let photo_url = null;
                    if (photoFile) {
                        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                        const maxSize = 5 * 1024 * 1024; // 5 MB

                        if (!allowedTypes.includes(photoFile.mimetype) || photoFile.size > maxSize) {
                            return res.status(400).json({ message: 'Tipo de arquivo inválido ou muito grande. Apenas imagens JPEG, PNG ou GIF até 5MB são permitidas.' });
                        }

                        try {
                            const result = await cloudinary.uploader.upload(photoFile.filepath, { folder: "user_photos" });
                            photo_url = result.secure_url;
                        } catch (uploadError) {
                            console.error('Erro ao fazer upload da foto:', uploadError);
                            return res.status(500).json({ message: 'Erro ao fazer upload da foto.' });
                        }
                    }

                    const updateFields = [];
                    const updateValues = [];
                    let paramIndex = 1;

                    if (username) {
                        updateFields.push(`username = $${paramIndex++}`);
                        updateValues.push(username);
                    }
                    if (email) {
                        updateFields.push(`email = $${paramIndex++}`);
                        updateValues.push(email);
                    }
                    if (hashedPassword) {
                        updateFields.push(`password_hash = $${paramIndex++}`);
                        updateValues.push(hashedPassword);
                    }
                    if (photo_url) {
                        updateFields.push(`photo_perfil_url = $${paramIndex++}`);
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
                    if (birthdate) {
                        updateFields.push(`birthdate = $${paramIndex++}`);
                        updateValues.push(birthdate);
                    }

                    if (updateFields.length > 0) {
                        updateValues.push(user_id);
                        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
                        await client.query(query, updateValues);
                    }

                    res.status(200).json({ message: 'Dados atualizados com sucesso.' });
                } else { // Cria novo usuário
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
                        [username, email, hashedPassword, photo_perfil_url, parseInt(height), parseFloat(initial_weight), birthdate]
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
                'SELECT id, username, email, birthdate, photo_perfil_url, height_cm, initial_weight_kg FROM users WHERE id = $1',
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
        // Retorna um erro em formato JSON para evitar o SyntaxError no frontend
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