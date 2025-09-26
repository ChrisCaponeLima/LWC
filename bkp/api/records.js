import { Pool } from 'pg';
import pkg from 'formidable';
const { IncomingForm } = pkg;
import cloudinary from 'cloudinary';

// Função auxiliar para definir cabeçalhos CORS
const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

// Configuração da conexão com o banco de dados
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    // CRÍTICO: Converte a porta para número e fornece um fallback.
    port: parseInt(process.env.PGPORT || '5432', 10), 
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
    setCorsHeaders(res);
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    let client;
    try {
        client = await pool.connect();
        
        if (req.method === 'POST') {
            const form = new IncomingForm();
            form.multiples = true; // Necessário para arrays de arquivos/campos

            form.parse(req, async (err, fields, files) => {
                try {
                    // 1. Processamento de Erros do Formidable
                    if (err) {
                        console.error('Erro ao processar formulário:', err);
                        return res.status(500).json({ message: 'Erro ao processar formulário.', details: err.message });
                    }
                    
                    // 2. Extração dos Campos (Formidable retorna arrays para campos de texto nas versões mais novas)
                    // CRÍTICO: Usa [0] para pegar o valor do campo
                    const user_id = fields.user_id ? fields.user_id[0] : null;
                    const record_date = fields.record_date ? fields.record_date[0] : null;
                    const weight = fields.weight ? fields.weight[0] : null;
                    const measurements = fields.measurements ? fields.measurements[0] : '[]';

                    // Campos que o Frontend PRECISA ENVIAR
                    const event = fields.event ? fields.event[0] : null;
                    const weeklyAction = fields.weeklyAction ? fields.weeklyAction[0] : null;
                    const workoutDays = fields.workoutDays ? fields.workoutDays[0] : null;
                    const observations = fields.observations ? fields.observations[0] : null;

                    // 3. Validação Básica
                    if (!user_id || !record_date || !weight) {
                        return res.status(400).json({ message: 'Dados essenciais (usuário, data ou peso) não fornecidos.' });
                    }
                    
                    // 4. Acesso aos Arquivos
                    // Formidable moderno retorna arrays, garantindo que pegamos o primeiro item e usando 'filepath'
                    const photoFile = Array.isArray(files.photo) ? files.photo[0] : files.photo || null;
                    const formaFile = Array.isArray(files.forma) ? files.forma[0] : files.forma || null;

                    let photo_url = null;
                    let forma_url = null;
                    
                    await client.query('BEGIN'); // Inicia a transação
                    
                    // 5. Upload para o Cloudinary
                    try {
                        const uploadPromises = [];
                        
                        if (photoFile && photoFile.filepath) {
                            uploadPromises.push(cloudinary.uploader.upload(photoFile.filepath, { folder: "record_photos" }));
                        }
                        if (formaFile && formaFile.filepath) {
                            uploadPromises.push(cloudinary.uploader.upload(formaFile.filepath, { folder: "record_forma" }));
                        }

                        const results = await Promise.all(uploadPromises);

                        // Atribui URLs sequencialmente
                        let resultIndex = 0;
                        if (photoFile && photoFile.filepath) {
                            photo_url = results[resultIndex++].secure_url;
                        }
                        if (formaFile && formaFile.filepath) {
                            forma_url = results[resultIndex++].secure_url;
                        }
                    } catch (uploadError) {
                        await client.query('ROLLBACK');
                        console.error('Erro ao fazer upload de fotos:', uploadError);
                        return res.status(500).json({ message: 'Erro ao fazer upload de fotos.', error: uploadError.message });
                    }

                    // 6. Inserção do Registro Principal
                    const recordInsertResult = await client.query(
                        'INSERT INTO records (user_id, record_date, weight, event, weekly_action, workout_days, observations, photo_url, forma_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
                        [user_id, record_date, weight, event, weeklyAction, workoutDays, observations, photo_url, forma_url]
                    );

                    const newRecordId = recordInsertResult.rows[0].id;
                    const parsedMeasurements = JSON.parse(measurements);

                    // 7. Inserção das Medidas Adicionais
                    if (parsedMeasurements && parsedMeasurements.length > 0) {
                        const measurementValues = parsedMeasurements.map(m => 
                            `(${newRecordId}, ${m.measurement_id}, ${m.value})`
                        ).join(', ');
                        
                        await client.query(`INSERT INTO record_measurements (record_id, measurement_id, value) VALUES ${measurementValues}`);
                    }

                    await client.query('COMMIT');
                    return res.status(201).json({ message: 'Registro salvo com sucesso!' });

                } catch (dbError) {
                    await client.query('ROLLBACK');
                    console.error('Erro ao salvar no banco de dados:', dbError);
                    return res.status(500).json({ message: 'Erro ao salvar o registro no banco de dados.', error: dbError.message });
                } finally {
                    // Liberação da conexão após o processamento POST
                    if (client) client.release();
                }
            });
            return; 

        } else if (req.method === 'GET') {
            // Lógica GET - Parece OK
            const { userId } = req.query; 
            if (!userId) {
                return res.status(401).json({ message: 'ID de usuário não fornecido.' });
            }
            
            const result = await client.query(`
                SELECT
                    r.id, r.record_date, r.weight, r.event, r.weekly_action, r.workout_days, r.observations, r.photo_url, r.forma_url,
                    COALESCE(
                        json_agg(
                            json_build_object('id', m.id, 'name', m.name, 'unit', m.unit, 'value', rm.value)
                        ) FILTER (WHERE rm.record_id IS NOT NULL), '[]'
                    ) AS measurements
                FROM records r
                LEFT JOIN record_measurements rm ON r.id = rm.record_id
                LEFT JOIN measurements m ON rm.measurement_id = m.id
                WHERE r.user_id = $1
                GROUP BY r.id
                ORDER BY r.record_date ASC
            `, [userId]);
            
            return res.status(200).json(result.rows);
        } else {
            return res.status(405).json({ message: 'Método não permitido' });
        }
    } catch (error) {
        console.error('Erro geral na requisição da API:', error);
        return res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    } finally {
        // Liberação da conexão apenas para GET (no POST, é feito dentro do form.parse)
        if (client && req.method !== 'POST') {
             client.release();
        }
    }
}

// CRÍTICO: Exporta a configuração para desabilitar o bodyParser do Next.js/Vercel
export const config = {
    api: {
        bodyParser: false,
    },
};