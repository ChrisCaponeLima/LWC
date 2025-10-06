// /server/utils/auth.ts - V1.3 - Mesclagem das funções JWT e BCrypt
import jwt from 'jsonwebtoken';
import { createError } from 'h3';
import bcrypt from 'bcryptjs'; // Importação do BCrypt

// Tipo de payload JWT
interface AuthPayload {
    userId: number;
    role: string;
}

// Chave secreta e configurações
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_NAO_USAR_EM_PRODUCAO';
const SALT_ROUNDS = 10; // Custo do hash (padrão seguro)

// ------------------------------------
// FUNÇÕES BCrypt (Hash de Senhas)
// ------------------------------------

/**
 * Cria o hash da senha usando BCrypt.
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica se a senha fornecida corresponde ao hash armazenado.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash); 
}

// ------------------------------------
// FUNÇÕES JWT (Tokens de Sessão)
// ------------------------------------

/**
 * Verifica e decodifica um token JWT.
 * @param token O token JWT (sem o prefixo 'Bearer').
 * @returns O payload decodificado.
 */
export const verifyToken = (token: string): AuthPayload => {
    try {
        const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
        return payload;
    } catch (e) {
        throw createError({ statusCode: 401, statusMessage: 'Token inválido ou expirado.' });
    }
};

/**
 * Cria um novo token JWT.
 */
export const signToken = (payload: AuthPayload): string => {
    return jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: '1d' }
    );
};