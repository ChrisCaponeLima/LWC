// api/measurements.js
import { Pool } from 'pg';

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

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT id, name, unit FROM measurements ORDER BY name ASC');
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Erro ao buscar medidas:', error);
            res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
        } finally {
            client.release();
        }
    } else {
        res.status(405).json({ message: 'Método não permitido' });
    }
}