import pg from 'pg';
const { Pool } = pg;

// Configuração da conexão com o banco de dados usando variáveis de ambiente
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

// Manipulador de requisições
export default async function handler(req, res) {
    const client = await pool.connect();

    try {
        if (req.method === 'GET') {
            const id = req.query.id; // O Vercel passa o ID automaticamente na query
            
            const result = await client.query('SELECT id, username, email, birthdate, role, photo_perfil_url FROM users WHERE id = $1', [id]);
            
            if (result.rows.length > 0) {
                res.status(200).json(result.rows[0]);
            } else {
                res.status(404).json({ message: 'Usuário não encontrado' });
            }
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