// api/auth.js - V1.2
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
        const result = await client.query('SELECT id, username, password_hash, role, photo_perfil_url, height_cm, apelido FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // --- INÍCIO DO CÓDIGO DE DEBUG ---
        console.log('Senha digitada (texto puro):', password);
        console.log('Hash da senha no banco de dados:', user.password_hash);
        // --- FIM DO CÓDIGO DE DEBUG ---

        let isPasswordMatch = await bcrypt.compare(password, user.password_hash);

        // --- INÍCIO DO CÓDIGO DE DEBUG ---
        console.log('Resultado da comparação (bcrypt):', isPasswordMatch);
        // --- FIM DO CÓDIGO DE DEBUG ---

        // Se a primeira validação falhar, tente novamente com a lógica antiga
        if (!isPasswordMatch) {
            // Este é o ponto onde o código tentaria um fallback, mas
            // precisamos entender por que a primeira verificação falhou.
        }

        if (isPasswordMatch) {
            // ... restante do código para login bem-sucedido
            const needsUpdate = !user.password_hash.startsWith('$2a$') && !user.password_hash.startsWith('$2b$');

            if (needsUpdate) {
                const newHashedPassword = await bcrypt.hash(password, 10);
                await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHashedPassword, user.id]);
                console.log(`Senha do usuário ${user.username} migrada com sucesso.`);
            }

            res.status(200).json({
                message: 'Login bem-sucedido.',
                userId: user.id,
                username: user.username,
                role: user.role,
                photoUrl: user.photo_perfil_url,
                apelido: user.apelido,
                heightCm: user.height_cm
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