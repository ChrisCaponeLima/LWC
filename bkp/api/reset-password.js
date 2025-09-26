import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ /* ... sua configuração de banco de dados ... */ });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
    }

    const newPassword = Math.random().toString(36).substring(2, 10); // Gera uma senha aleatória
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const client = await pool.connect();
    try {
        await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);
        res.status(200).json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
        console.error('Erro ao redefinir a senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
}