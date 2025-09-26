// /server/api/records.get.js
import { defineEventHandler, getQuery, setResponseHeaders, createError } from 'h3';
import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432', 10), 
    ssl: {
        rejectUnauthorized: false
    }
});

export default defineEventHandler(async (event) => {
    setResponseHeaders(event, {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });

    if (event.method === 'OPTIONS') {
        return {}; 
    }

    const { userId } = getQuery(event);
    let client;

    try {
        if (!userId) {
            throw createError({ statusCode: 400, statusMessage: 'ID de usuário não fornecido.' });
        }
        
        client = await pool.connect();

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
        
        return result.rows; // O Nitro automaticamente retorna 200 OK e JSON

    } catch (error) {
        console.error('Erro no handler records.get:', error);
        if (error.statusCode) {
             throw error;
        }
        throw createError({ statusCode: 500, statusMessage: 'Erro interno ao buscar registros.' });
    } finally {
        if (client) client.release();
    }
});