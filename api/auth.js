import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

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
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    const { username, password } = req.body;
    const client = await pool.connect();

    try {
        // CORREÇÃO AQUI: A coluna que armazena a senha criptografada é 'password_hash'
        // A coluna que armazena a foto de perfil é 'photo_perfil_url'
        const result = await client.query('SELECT id, username, password_hash, role, photo_perfil_url FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // CORREÇÃO: Usar bcrypt.compare para verificar a senha de forma segura
        const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

        if (isPasswordMatch) {
            res.status(200).json({
                message: 'Login bem-sucedido.',
                userId: user.id,
                username: user.username,
                role: user.role,
                photoUrl: user.photo_perfil_url
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