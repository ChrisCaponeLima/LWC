// /server/api/users/get.ts (Exemplo que a página irá ler como texto)
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  if (!query.id) {
    throw createError({ statusCode: 400, statusMessage: 'ID do usuário ausente' })
  }

  // Simulação de busca no banco de dados
  return {
    id: query.id,
    name: `User ${query.id}`,
    role: 'standard',
    lastUpdated: new Date().toISOString()
  }
})