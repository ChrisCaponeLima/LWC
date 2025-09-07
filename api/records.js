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

                // Acesso seguro aos campos do formulário para evitar erros.
                // O operador `?.` garante que o código não falha se o campo não existir.
                const date = fields.date?.[0] || null;
                const weight = fields.weight?.[0] || null;
                const event = fields.event?.[0] || null;
                const weeklyAction = fields.weeklyAction?.[0] || null;
                const workoutDays = fields.workoutDays?.[0] || null;
                const observations = fields.observations?.[0] || null;
                const userId = fields.userId?.[0] || null;
                const measurements = fields.measurements?.[0] || null;

                const photoFile = files.photo?.[0] || null;
                const formaFile = files.forma?.[0] || null;

                if (!userId) {
                    return res.status(401).json({ message: 'ID de usuário não fornecido.' });
                }
                
                // Upload das fotos em paralelo para otimizar o tempo de resposta
                let photo_url = null;
                let forma_url = null;
                
                try {
                    const uploadPromises = [];
                    
                    if (photoFile) {
                        uploadPromises.push(cloudinary.uploader.upload(photoFile.filepath, { folder: "record_photos" }));
                    } else {
                        uploadPromises.push(Promise.resolve(null));
                    }
                    
                    if (formaFile) {
                        uploadPromises.push(cloudinary.uploader.upload(formaFile.filepath, { folder: "record_forma" }));
                    } else {
                        uploadPromises.push(Promise.resolve(null));
                    }
                    
                    const [photoResult, formaResult] = await Promise.all(uploadPromises);
                    
                    photo_url = photoResult ? photoResult.secure_url : null;
                    forma_url = formaResult ? formaResult.secure_url : null;

                } catch (uploadError) {
                    console.error('Erro ao fazer upload de fotos:', uploadError);
                    return res.status(500).json({ message: 'Erro ao fazer upload de fotos.' });
                }

                await client.query('BEGIN');

                const recordInsertResult = await client.query(
                    'INSERT INTO records (user_id, record_date, weight, event, weekly_action, workout_days, observations, photo_url, forma_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
                    [userId, date, weight, event, weeklyAction, workoutDays, observations, photo_url, forma_url]
                );

                const newRecordId = recordInsertResult.rows[0].id;
                
                let parsedMeasurements = [];
                if (measurements) {
                    try {
                        parsedMeasurements = JSON.parse(measurements);
                    } catch (e) {
                        console.error('Erro ao analisar as medidas:', e);
                    }
                }
                

                if (parsedMeasurements && parsedMeasurements.length > 0) {
                    // A sintaxe para inserção múltipla não suporta parâmetros dinâmicos ($1, $2), então construímos a string SQL.
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