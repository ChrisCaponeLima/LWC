// /server/api/records.post.js
import { defineEventHandler, setResponseHeaders, createError } from 'h3';
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
    // CRÍTICO: Converte a porta para número.
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

// Wrapper para converter form.parse (callback) em Promise (async/await)
function parseMultipartForm(event) {
    return new Promise((resolve, reject) => {
        const form = new IncomingForm({ multiples: true });
        
        // O h3/Nitro usa a requisição Node.js nativa
        form.parse(event.node.req, (err, fields, files) => {
            if (err) {
                return reject(err);
            }
            resolve({ fields, files });
        });
    });
}

export default defineEventHandler(async (event) => {
    setResponseHeaders(event, {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    
    if (event.method === 'OPTIONS') {
        return {}; // Responde 200 para preflight
    }
    
    let client;
    try {
        const { fields, files } = await parseMultipartForm(event);
        client = await pool.connect();
        
        // Lógica de Extração de Campos (Formidable retorna arrays, usamos [0])
        const user_id = fields.user_id ? fields.user_id[0] : null;
        const record_date = fields.record_date ? fields.record_date[0] : null;
        const weight = fields.weight ? fields.weight[0] : null;
        const measurements = fields.measurements ? fields.measurements[0] : '[]';

        const eventField = fields.event ? fields.event[0] : null;
        const weeklyAction = fields.weeklyAction ? fields.weeklyAction[0] : null;
        const workoutDays = fields.workoutDays ? fields.workoutDays[0] : null;
        const observations = fields.observations ? fields.observations[0] : null;

        if (!user_id || !record_date || !weight) {
            throw createError({ statusCode: 400, statusMessage: 'Dados essenciais (usuário, data ou peso) não fornecidos.' });
        }
        
        // Acesso aos Arquivos e uso de 'filepath'
        const photoFile = Array.isArray(files.photo) ? files.photo[0] : files.photo || null;
        const formaFile = Array.isArray(files.forma) ? files.forma[0] : files.forma || null;

        let photo_url = null;
        let forma_url = null;
        
        await client.query('BEGIN');

        // Lógica de Upload para o Cloudinary
        try {
            const uploadPromises = [];
            
            if (photoFile && photoFile.filepath) {
                uploadPromises.push(cloudinary.uploader.upload(photoFile.filepath, { folder: "record_photos" }));
            }
            if (formaFile && formaFile.filepath) {
                uploadPromises.push(cloudinary.uploader.upload(formaFile.filepath, { folder: "record_forma" }));
            }

            const results = await Promise.all(uploadPromises);

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
            throw createError({ statusCode: 500, statusMessage: 'Erro ao fazer upload de fotos.' });
        }

        // Inserção do Registro Principal
        const recordInsertResult = await client.query(
            'INSERT INTO records (user_id, record_date, weight, event, weekly_action, workout_days, observations, photo_url, forma_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
            [user_id, record_date, weight, eventField, weeklyAction, workoutDays, observations, photo_url, forma_url]
        );

        const newRecordId = recordInsertResult.rows[0].id;
        const parsedMeasurements = JSON.parse(measurements);

        // Inserção das Medidas Adicionais
        if (parsedMeasurements && parsedMeasurements.length > 0) {
            const measurementValues = parsedMeasurements.map(m => 
                `(${newRecordId}, ${m.measurement_id}, ${m.value})`
            ).join(', ');
            
            await client.query(`INSERT INTO record_measurements (record_id, measurement_id, value) VALUES ${measurementValues}`);
        }

        await client.query('COMMIT');
        
        // Retorno de sucesso (201 Created)
        event.node.res.statusCode = 201;
        return { message: 'Registro salvo com sucesso!' };

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Erro no handler records.post:', error);
        
        // Lança o erro para o h3/Nitro lidar com a resposta HTTP correta
        if (error.statusCode) {
            throw error;
        }
        throw createError({ statusCode: 500, statusMessage: 'Erro interno ao salvar o registro.' });
    } finally {
        if (client) client.release();
    }
});