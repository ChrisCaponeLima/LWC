import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Função auxiliar para definir cabeçalhos CORS
const setCorsHeaders = (res) => {
    // CRÍTICO: Permite qualquer origem (*), necessário para que o localhost:3000 acesse a API
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    
    // Garante que a porta seja tratada como número
    port: parseInt(process.env.PGPORT || '5432', 10), 
    
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000, 
    idleTimeoutMillis: 30000 
});

export default async function handler(req, res) {
    // 1. Aplica os cabeçalhos CORS no início da resposta
    setCorsHeaders(res);
    
    // 2. Tratamento de requisições OPTIONS (Preflight, exigido pelo CORS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    const { username, password } = req.body;
    let client; 

    try {
        const queryText = `
            SELECT 
                id, 
                username, 
                password_hash, 
                role, 
                photo_perfil_url, 
                height_cm, 
                apelido,
                initial_weight_kg
            FROM users 
            WHERE username ILIKE $1 || '%'
        `;
        
        client = await pool.connect(); 

        const result = await client.query(queryText, [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

        if (isPasswordMatch) {
            res.status(200).json({
                message: 'Login bem-sucedido.',
                userId: user.id,
                username: user.username,
                role: user.role,
                photoUrl: user.photo_perfil_url,
                apelido: user.apelido,
                heightCm: user.height_cm,
                initialWeight: user.initial_weight_kg 
            });
        } else {
            res.status(401).json({ message: 'Credenciais inválidas.' });
        }

    } catch (error) {
        console.error('Erro de autenticação/conexão:', error);
        res.status(500).json({ message: 'Erro interno do servidor. Falha na conexão com o DB.', details: error.message });
    } finally {
        if (client) {
            client.release();
        }
    }
}


