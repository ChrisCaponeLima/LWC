import { Pool } from 'pg';
import pkg from 'formidable';
const { IncomingForm } = pkg;
import cloudinary from 'cloudinary';
import bcrypt from 'bcryptjs';

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

                if (user_id) {
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

                    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [user_id]);
                    if (userResult.rows.length === 0) {
                        return res.status(404).json({ message: 'Usuário não encontrado.' });
                    }
                    const existingUser = userResult.rows[0];

                    const newUsername = username || existingUser.username;
                    const newEmail = email || existingUser.email;
                    const newPasswordHash = hashedPassword || existingUser.password_hash;
                    const newPhotoUrl = photo_url || existingUser.photo_perfil_url;
                    
                    const newHeight = height ? parseFloat(height) : existingUser.height_cm;
                    const newInitialWeight = initial_weight ? parseFloat(initial_weight) : existingUser.initial_weight_kg;
                    const newBirthdate = (birthdate && birthdate.trim() !== '1') ? birthdate : existingUser.birthdate;
                    
                    const query = `
                        UPDATE users 
                        SET 
                            username = $1, 
                            email = $2, 
                            password_hash = $3, 
                            photo_perfil_url = $4, 
                            height_cm = $5, 
                            initial_weight_kg = $6, 
                            birthdate = $7
                        WHERE id = $8
                    `;
                    
                    const values = [
                        newUsername,
                        newEmail,
                        newPasswordHash,
                        newPhotoUrl,
                        newHeight,
                        newInitialWeight,
                        newBirthdate,
                        user_id
                    ];
                    
                    // Comentamos a linha que executa a query para evitar alterações.
                    // await client.query(query, values); 
                    
                    // Retornamos os dados para o frontend para depuração.
                    return res.status(200).json({ 
                        message: 'Dados de depuração da query:', 
                        query, 
                        values 
                    });

                } else {
                    let photo_perfil_url = 'https://api.iconify.design/solar:user-circle-bold-duotone.svg';
                    if (photoFile) {
                        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                        const