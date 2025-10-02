// ~/server/utils/db.ts
import { PrismaClient } from '@prisma/client'

/**
 * Em ambiente de desenvolvimento, criamos o client no escopo global
 * para evitar múltiplas instâncias quando o Nuxt reinicia em HMR.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // opcional: logs do prisma
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
