import { sql } from "@vercel/postgres";
import { put } from "@vercel/blob";
import bcrypt from "bcrypt";

export default async function handler(request, response) {
  if (request.method === "POST") {
    // Código para salvar dados do formulário...
    // ...
    return response.status(200).json({ result: "success" });

  } else if (request.method === "GET") {
    // Código para buscar dados...
    // ...
    return response.status(200).json(rows);

  } else if (request.method === "PUT") {
    // Este novo método PUT será para criar usuários de forma segura
    try {
      const { username, password, email, role = 'user', birthdate } = JSON.parse(request.body);

      if (!username || !password || !email) {
        return response.status(400).json({ result: "error", error: "Username, password, and email are required." });
      }

      // 1. Gerar o hash da senha com 10 salt rounds (nível de segurança)
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 2. Inserir o novo usuário no banco de dados com a senha hasheada
      await sql`
        INSERT INTO users (
          username,
          password_hash,
          role,
          email,
          birthdate
        ) VALUES (
          ${username},
          ${passwordHash},
          ${role},
          ${email},
          ${birthdate}
        );
      `;

      return response.status(201).json({ result: "success", message: "User created successfully." });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ result: "error", error: error.message });
    }
  } else {
    return response
      .status(405)
      .json({ result: "error", error: "Method Not Allowed" });
  }
}
