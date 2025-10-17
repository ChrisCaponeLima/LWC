# /clean-and-run.ps1 - SOLUÇÃO EXTREMA PARA ERROS DE CACHE E NODE

Write-Host "🔄 Parando processos Node existentes..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "🧹 Limpando caches do projeto..." -ForegroundColor Cyan
# Listas de pastas para remoção extrema
$pathsToRemove = @(".nuxt", ".nitro", ".output", ".vite", "node_modules", "package-lock.json")
foreach ($p in $pathsToRemove) {
    if (Test-Path $p) {
        Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
        Write-Host "  ✅ Removido: $p"
    }
}

Write-Host "🧼 Limpando cache global do NPM..." -ForegroundColor Cyan
# ESTE É O PASSO CRUCIAL APÓS A TROCA DE NODE.
npm cache clean --force 
# Limpa o diretório de cache do NPM no Windows (garante que não há binários antigos)
Remove-Item -Recurse -Force (npm config get cache) -ErrorAction SilentlyContinue
Write-Host "  ✅ Caches de projeto e global limpos."

Write-Host "🔧 Reinstalando dependências..." -ForegroundColor Cyan
npm install

Write-Host "🛠 Gerando Prisma e módulos do Nitro..." -ForegroundColor Cyan
# npx prisma generate é obrigatório para o Prisma
npx prisma generate
# npx nuxt prepare força a recriação dos módulos virtuais do Nitro
npx nuxt prepare 
Write-Host "  ✅ Módulos preparados."

Write-Host "🚀 Iniciando Nuxt Dev (Se o erro foi resolvido)..." -ForegroundColor Green
npm run dev --o