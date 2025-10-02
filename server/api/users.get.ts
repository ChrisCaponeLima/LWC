// /server/api/users.get.ts
import { defineEventHandler } from 'h3';
import { prisma } from '~/server/utils/db';

export default defineEventHandler(async () => {
  return await prisma.users.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      apelido: true,
      photo_perfil_url: true,
      created_at: true,
    },
  });
});
