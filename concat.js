// concat.js - Versão Otimizada por Módulos
import fs from "fs";
import path from "path";

// ==========================================================
// 🚨 CONFIGURAÇÃO DOS MÓDULOS 🚨
// Defina aqui o nome do arquivo de saída e a lista de arquivos para cada módulo.
// Use paths relativos à raiz do projeto.
// ==========================================================
const modules = {
  "code-auth.txt": [
    "pages/login.vue",
    "stores/auth.ts",
    "server/api/auth.post.ts",
    "server/middleware/auth.ts",
  ],
  "code-users.txt": [
    "pages/user_management.vue",
    "components/UserTable.vue",
    "server/api/users.get.ts",
    "server/api/users/[id].put.ts",
    "server/api/users/[id].delete.ts",
  ],
  "code-kpis.txt": [
    "pages/index.vue",
    "components/Header.vue",
    "components/KpiCard.vue",
    "server/api/kpis.get.ts",
  ],
  "code-config.txt": [
    "nuxt.config.ts",
    "tailwind.config.js",
    "prisma/schema.prisma",
    "package.json",
    ".env",
  ],
};

// ==========================================================
// FUNÇÕES DE GERAÇÃO
// ==========================================================

function generateModule(outFile, fileList) {
  let output = "";
  let filesFoundCount = 0;

  for (const relativePath of fileList) {
    const fullPath = path.resolve(relativePath);

    // Verifica se o arquivo existe antes de tentar ler
    if (fs.existsSync(fullPath)) {
      output += `\n\n================= FILE: ${relativePath} =================\n\n`;
      output += fs.readFileSync(fullPath, "utf8");
      filesFoundCount++;
    } else {
      console.warn(`⚠️ Aviso: Arquivo não encontrado para o módulo ${outFile}: ${relativePath}`);
    }
  }

  // Só cria o arquivo se houver conteúdo
  if (filesFoundCount > 0) {
    fs.writeFileSync(outFile, output, "utf8");
    console.log(`✅ Pacote gerado: ${outFile} (${filesFoundCount} arquivos)`);
  } else {
    console.log(`❕ Pacote ${outFile} ignorado: Nenhum arquivo encontrado.`);
  }
}

// ==========================================================
// EXECUÇÃO PRINCIPAL
// ==========================================================
console.log("Iniciando geração de pacotes de código...");

// Este loop itera sobre todas as chaves do objeto 'modules'
for (const outFile in modules) {
  generateModule(outFile, modules[outFile]);
}

console.log("Geração de pacotes concluída.");
