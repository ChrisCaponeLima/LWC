// api/users.js

const { Pool } = require('pg');

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
        switch (req.method) {
            // Rota GET /api/users/[id] - Busca um único usuário por ID
            case 'GET':
                // Verifica se há um ID na URL da requisição
                const path = req.url.split('/');
                const id = path[path.length - 1];

                if (id && !isNaN(id)) {
                    const result = await client.query('SELECT id, username, email, birthdate, role FROM users WHERE id = $1', [id]);
                    if (result.rows.length > 0) {
                        res.status(200).json(result.rows[0]);
                    } else {
                        res.status(404).json({ message: 'Usuário não encontrado' });
                    }
                } else {
                    // Se não houver ID na URL, a rota continua a listar todos os usuários
                    const result = await client.query('SELECT id, username, email, birthdate, role FROM users ORDER BY username');
                    res.status(200).json(result.rows);
                }
                break;

            // Rota POST /api/users - Cria um novo usuário
            case 'POST':
                const { name, email, birthdate, role } = req.body;
                const finalBirthdate = birthdate === '' ? null : birthdate;
                await client.query(
                    'INSERT INTO users (username, email, birthdate, role) VALUES ($1, $2, $3, $4)',
                    [name, email, finalBirthdate, role]
                );
                res.status(201).json({ message: 'Usuário criado com sucesso!' });
                break;

            // Rota PUT /api/users - Atualiza um usuário
            case 'PUT':
                const { id, name: updatedName, email: updatedEmail, birthdate: updatedBirthdate, role: updatedRole } = req.body;
                const finalUpdatedBirthdate = updatedBirthdate === '' ? null : updatedBirthdate;
                await client.query(
                    'UPDATE users SET username = $1, email = $2, birthdate = $3, role = $4 WHERE id = $5',
                    [updatedName, updatedEmail, finalUpdatedBirthdate, updatedRole, id]
                );
                res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
                break;

            // Rota DELETE /api/users - Exclui um usuário
            case 'DELETE':
                const { id: deleteId } = req.body;
                await client.query('DELETE FROM users WHERE id = $1', [deleteId]);
                res.status(200).json({ message: 'Usuário excluído com sucesso!' });
                break;

            default:
                res.status(405).json({ message: 'Método não permitido' });
                break;
            
        }
    } catch (error) {
        console.error('Erro na requisição da API:', error);
        res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    } finally {
        client.release();
    }
}