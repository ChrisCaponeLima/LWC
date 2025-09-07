import { Pool } from 'pg';
import pkg from 'formidable';
const { IncomingForm } = pkg;
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

                const date = fields.date[0];
                const weight = fields.weight[0];
                const event = fields.event[0];
                const weeklyAction = fields.weeklyAction[0];
                const workoutDays = fields.workoutDays[0];
                const observations = fields.observations[0];
                const userId = fields.userId[0];
                const measurements = fields.measurements[0];
                const photoFile = files.photo && files.photo.length > 0 ? files.photo[0] : null;
                const formaFile = files.forma && files.forma.length > 0 ? files.forma[0] : null;

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

                let forma_url = null;
                if (formaFile) {
                    try {
                        const result = await cloudinary.uploader.upload(formaFile.filepath, { folder: "record_forma" });
                        forma_url = result.secure_url;
                    } catch (uploadError) {
                        console.error('Erro ao fazer upload da foto de forma:', uploadError);
                        return res.status(500).json({ message: 'Erro ao fazer upload da foto de forma.' });
                    }
                }

                await client.query('BEGIN');

                const recordInsertResult = await client.query(
                    'INSERT INTO records (user_id, record_date, weight, event, weekly_action, workout_days, observations, photo_url, forma_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
                    [userId[0], date[0], weight[0], event[0], weeklyAction[0], workoutDays[0], observations[0], photo_url, forma_url]
                );

                const newRecordId = recordInsertResult.rows[0].id;
                const parsedMeasurements = JSON.parse(measurements[0]);

                if (parsedMeasurements && parsedMeasurements.length > 0) {
                    const values = parsedMeasurements.map(m => `(${newRecordId}, ${m.id}, ${m.value})`).join(', ');
                    await client.query(`INSERT INTO record_measurements (record_id, measurement_id, value) VALUES ${values}`);
                }

                await client.query('COMMIT');
                res.status(201).json({ message: 'Registro salvo com sucesso!' });
            });
        } else if (req.method === 'GET') {
            const { userId } = req.query;
            if (!userId) {
                return res.status(401).json({ message: 'ID de usuário não fornecido.' });
            }
            
            const result = await client.query(`
                SELECT
                    r.id,
                    r.record_date,
                    r.weight,
                    r.event,
                    r.weekly_action,
                    r.workout_days,
                    r.observations,
                    r.photo_url,
                    r.forma_url,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', m.id,
                                'name', m.name,
                                'unit', m.unit,
                                'value', rm.value
                            )
                        ) FILTER (WHERE rm.record_id IS NOT NULL),
                        '[]'
                    ) AS measurements
                FROM records r
                LEFT JOIN record_measurements rm ON r.id = rm.record_id
                LEFT JOIN measurements m ON rm.measurement_id = m.id
                WHERE r.user_id = $1
                GROUP BY r.id
                ORDER BY r.record_date ASC
            `, [userId]);
            
            res.status(200).json(result.rows);
        } else {
            res.status(405).json({ message: 'Método não permitido' });
        }
    } catch (error) {
        console.error('Erro na requisição da API:', error);
        await client.query('ROLLBACK');
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