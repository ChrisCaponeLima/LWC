import { Pool } from 'pg';
import pkg from 'formidable';
const { IncomingForm } = pkg;
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
    const client = await pool.connect();

    try {
        if (req.method === 'GET') {
            const { id } = req.query;
            if (id) {
                // -- CORRIGIDO: Selecionando todos os campos para o GET por ID
                const userResult = await client.query('SELECT * FROM users WHERE id = $1', [id]);
                if (userResult.rows.length === 0) {
                    return res.status(404).json({ message: 'Usuário não encontrado.' });
                }
                res.status(200).json(userResult.rows[0]);
            } else {
                // -- CORRIGIDO: Adicionado 'apelido' na seleção SQL para a lista de usuários
                const usersResult = await client.query('SELECT id, username, email, photo_perfil_url, role, birthdate, height_cm, initial_weight_kg, apelido FROM users ORDER BY username ASC');
                res.status(200).json(usersResult.rows);
            }

        } else if (req.method === 'POST') {
            const form = new IncomingForm();
            form.parse(req, async (err, fields) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao processar formulário.' });
                }

                try {
                    const username = fields.name || null;
                    const email = fields.email || null;
                    const birthdate = fields.birthdate || null;
                    const role = fields.role || 'user';
                    const initialWeight = fields['initial-weight'] ? parseFloat(fields['initial-weight']) : null;
                    const heightCm = fields['height-cm'] ? parseInt(fields['height-cm']) : null;
                    // -- NOVO: Adicionado 'apelido' para a criação de usuário
                    const apelido = fields.apelido || null;
                    // -- FIM NOVO

                    if (!username || !email || !role || initialWeight === null) {
                        return res.status(400).json({ message: 'Campos obrigatórios faltando: nome, e-mail, cargo e peso inicial.' });
                    }
                    
                    const hashedPassword = await bcrypt.hash('password123', 10);
                    const photo_perfil_url = null;

                    const result = await client.query(
                        // -- CORRIGIDO: Adicionado 'apelido' na query de INSERT
                        'INSERT INTO users (username, email, password_hash, photo_perfil_url, birthdate, role, height_cm, initial_weight_kg, apelido) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
                        [username, email, hashedPassword, photo_perfil_url, birthdate, role, heightCm, initialWeight, apelido]
                    );
                    
                    const newUserId = result.rows[0].id;
                    res.status(201).json({ message: 'Usuário criado com sucesso!', userId: newUserId });
                } catch (dbError) {
                    console.error('Erro ao inserir novo usuário:', dbError);
                    res.status(500).json({ message: 'Erro ao inserir novo usuário. Verifique se o nome de usuário ou e-mail já existem.' });
                }
            });

        } else if (req.method === 'PUT') {
            const form = new IncomingForm();
            form.parse(req, async (err, fields) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao processar formulário.' });
                }

                try {
                    const user_id = fields.id || null;
                    const resetPasswordFlag = fields.resetPassword || false;
                    
                    if (!user_id) {
                        return res.status(400).json({ message: 'ID do usuário é obrigatório para atualização.' });
                    }
                    
                    if (resetPasswordFlag) {
                        const newPassword = Math.random().toString(36).substring(2, 10);
                        const hashedPassword = await bcrypt.hash(newPassword, 10);
                        const result = await client.query(
                            'UPDATE users SET password_hash = $1 WHERE id = $2', 
                            [hashedPassword, user_id]
                        );
                        if (result.rowCount === 0) {
                            return res.status(404).json({ message: 'Usuário não encontrado.' });
                        }
                        return res.status(200).json({ message: 'Senha redefinida com sucesso.' });
                    }

                    const username = fields.name || null;
                    const email = fields.email || null;
                    const birthdate = fields.birthdate || null;
                    const role = fields.role || null;
                    const initialWeight = fields['initial-weight'] ? parseFloat(fields['initial-weight']) : null;
                    const heightCm = fields['height-cm'] ? parseInt(fields['height-cm']) : null;
                    // -- NOVO: Adicionado 'apelido' para a atualização
                    const apelido = fields.apelido || null;
                    // -- FIM NOVO

                    const query = `
                        UPDATE users 
                        SET 
                            username = COALESCE($1, username), 
                            email = COALESCE($2, email),
                            birthdate = COALESCE($3, birthdate),
                            role = COALESCE($4, role),
                            height_cm = COALESCE($5, height_cm),
                            initial_weight_kg = COALESCE($6, initial_weight_kg),
                            apelido = COALESCE($7, apelido)
                        WHERE id = $8
                    `;
                    
                    const values = [
                        username,
                        email,
                        birthdate,
                        role,
                        heightCm,
                        initialWeight,
                        apelido,
                        user_id
                    ];

                    const result = await client.query(query, values);

                    if (result.rowCount === 0) {
                        return res.status(404).json({ message: 'Usuário não encontrado ou nenhum dado alterado.' });
                    }

                    return res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
                } catch (dbError) {
                    console.error('Erro ao atualizar usuário:', dbError);
                    res.status(500).json({ message: 'Erro ao atualizar usuário.' });
                }
            });

        } else if (req.method === 'DELETE') {
            const { id } = req.body;
            if (!id) {
                return res.status(400).json({ message: 'ID do usuário é obrigatório para exclusão.' });
            }

            const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
            res.status(200).json({ message: 'Usuário excluído com sucesso!' });
        
        } else {
            res.status(405).json({ message: 'Método não permitido.' });
        }
    } catch (error) {
        console.error('Erro na requisição da API:', error);
        res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    } finally {
        client.release();
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};