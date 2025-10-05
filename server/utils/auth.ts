// /server/utils/auth.ts - V1.1 - Funções JWT Centralizadas
import jwt from 'jsonwebtoken';
import { createError } from 'h3';

// Tipo de payload JWT
interface AuthPayload {
    userId: number;
    role: string;
}

// A chave secreta deve ser lida de forma segura
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_NAO_USAR_EM_PRODUCAO';

/**
 * Verifica e decodifica um token JWT.
 * @param token O token JWT (sem o prefixo 'Bearer').
 * @returns O payload decodificado.
 */
export const verifyToken = (token: string): AuthPayload => {
    try {
        // Usa a função real da biblioteca 'jsonwebtoken'
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