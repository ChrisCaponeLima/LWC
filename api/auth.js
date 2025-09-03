import { Pool } from 'pg';
import bcrypt from 'bcrypt';

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
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    const { username, password } = req.body;
    const client = await pool.connect();

    try {
        const result = await client.query('SELECT id, username, password_hash, role FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Você precisa gerar um hash para as senhas no momento do cadastro
        // Para este exemplo, vamos supor que as senhas estão em texto simples
        // Em um ambiente de produção, use bcrypt.compare
        if (password === user.password_hash) {
            res.status(200).json({
                message: 'Login bem-sucedido.',
                userId: user.id,
                username: user.username,
                role: user.role
            });
        } else {
            res.status(401).json({ message: 'Credenciais inválidas.' });
        }

    } catch (error) {
        console.error('Erro de autenticação:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
}