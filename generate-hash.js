import bcrypt from 'bcryptjs';

// Função para gerar o hash da senha
async function generateHash() {
    // A senha é lida como um argumento da linha de comando
    const password = process.argv[2];

    if (!password) {
        console.error("Erro: Por favor, forneça uma senha como argumento. Ex: node generate-hash.js minha_senha_secreta");
        return;
    }
    
    // Criptografa a senha com bcrypt
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Senha criptografada:");
        console.log(hashedPassword);
    } catch (error) {
        console.error("Ocorreu um erro ao gerar o hash:", error);
    }
}

generateHash();