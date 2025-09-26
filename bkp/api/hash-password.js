// api/[password].js - V2.0
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método não permitido.' });
    }
    
    // Agora o parâmetro 'password' é capturado da URL
    const { password } = req.query;

    if (!password) {
        return res.status(400).json({ message: 'A senha é obrigatória.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        res.status(200).json({ hashedPassword });
    } catch (error) {
        console.error('Erro ao criptografar a senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
}