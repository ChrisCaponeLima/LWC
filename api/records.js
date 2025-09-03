import { Pool } from 'pg';
import { IncomingForm } from 'formidable';
import cloudinary from 'cloudinary';

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

// Manipulador de requisições
export default async function handler(req, res) {
    const client = await pool.connect();

    try {
        if (req.method === 'POST') {
            const form = new IncomingForm();

            form.parse(req, async (err, fields, files) => {
                if (err) {
                    console.error('Erro ao processar formulário:', err);
                    return res.status(500).json({ message: 'Erro ao processar formulário.' });
                }

                const { date, weight, measurements, event, weeklyAction, workoutDays, observations, userId } = fields;
                const photoFile = files.photo && files.photo.length > 0 ? files.photo[0] : null;

                if (!userId || userId.length === 0) {
                    return res.status(401).json({ message: 'ID de usuário não fornecido.' });
                }
                
                let photo_url = null;
                if (photoFile) {
                    try {
                        const result = await cloudinary.uploader.upload(photoFile.filepath, { folder: "record_photos" });
                        photo_url = result.secure_url;
                    } catch (uploadError) {
                        console.error('Erro ao fazer upload da foto:', uploadError);
                        return res.status(500).json({ message: 'Erro ao fazer upload da foto.' });
                    }
                }

                await client.query(
                    'INSERT INTO records (user_id, date, weight, measurements, event, weekly_action, workout_days, observations, photo_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                    [userId[0], date[0], weight[0], measurements[0], event[0], weeklyAction[0], workoutDays[0], observations[0], photo_url]
                );
                res.status(201).json({ message: 'Registro salvo com sucesso!' });
            });
        } else if (req.method === 'GET') {
            const { userId } = req.query;
            if (!userId) {
                return res.status(401).json({ message: 'ID de usuário não fornecido.' });
            }
            const result = await client.query('SELECT * FROM records WHERE user_id = $1 ORDER BY date ASC', [userId]);
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

export const config = {
  api: {
    bodyParser: false,
  },
};