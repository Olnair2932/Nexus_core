const fs = require("fs");
const path = require("path");

const BASE_DIR = path.join(__dirname, "..", "public");

function normalizar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function limparPedido(texto) {
    return normalizar(texto)
        .replace(
            /\b(tocar|toca|play|ouvir|escutar|quero|coloca|bota|musica|música)\b/g,
            ""
        )
        .replace(/\s+/g, " ")
        .trim();
}

function listar() {
    if (!fs.existsSync(BASE_DIR)) {
        return [];
    }

    return fs.readdirSync(BASE_DIR)
        .filter(arquivo => {
            if (arquivo.startsWith(".")) return false;

            return /\.(mp3|m4a|ogg|wav|webm)$/i.test(arquivo);
        });
}

async function buscar(pedido) {

    const busca = limparPedido(pedido);

    if (!busca) return null;

    const palavras = busca
        .split(" ")
        .filter(p => p.length >= 3);

    const arquivos = listar();


    const encontrado = arquivos.find(arquivo => {

        const nome = normalizar(
            arquivo.replace(/\.[^/.]+$/, "")
        );


        return palavras.some(palavra =>
            nome.includes(palavra)
        );

    });


    if (!encontrado) {
        return null;
    }


    return {
        fonte: "local",
        titulo: encontrado,
        arquivo: encontrado,
        url: "/" + encodeURIComponent(encontrado)
    };
}


module.exports = {
    nome: "local",
    buscar,
    listar
};
