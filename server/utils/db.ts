// /server/utils/db.ts
import { PrismaClient } from '@prisma/client'

// Evita múltiplas instâncias em dev
declare global {
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
  })

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
