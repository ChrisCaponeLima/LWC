// concat.js
import fs from "fs";
import path from "path";

// Arquivo final
const outFile = "PROJETO_BOOK.txt";

// Extensões que vamos incluir no "book"
const validExtensions = [
  ".ts",
  ".js",
  ".vue",
  ".json",
  ".prisma",
  ".css",
  ".env",
  ".md"
];

// Pastas que devem ser ignoradas
const ignoreDirs = ["node_modules", ".nuxt", ".git", "dist", ".output", "bkp", "concat.js","PROJETO_BOOK.txt"];

// Função recursiva para varrer diretórios
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        walkDir(filePath, callback);
      }
    } else {
      callback(filePath);
    }
  });
}

let output = "";

walkDir(".", function (filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (validExtensions.includes(ext)) {
    output += `\n\n================= FILE: ${filePath} =================\n\n`;
    output += fs.readFileSync(filePath, "utf8");
  }
});

fs.writeFileSync(outFile, output, "utf8");
console.log(`✅ Arquivo único gerado em ${outFile}`);
