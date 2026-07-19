const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../public/music_memory.json");


function carregarMemoria() {

    if (!fs.existsSync(FILE)) {
        return [];
    }

    try {

        return JSON.parse(
            fs.readFileSync(FILE, "utf8")
        );

    } catch (erro) {

        console.log(
            "Erro lendo memória musical:",
            erro.message
        );

        return [];
    }

}


function salvarMusica(musica) {

    if (!musica) {
        return;
    }


    const memoria = carregarMemoria();


    const identificador =
        musica.url ||
        musica.arquivo ||
        musica.file ||
        musica.nome;


    const existe = memoria.find(item =>
        (
            item.url ||
            item.arquivo ||
            item.file ||
            item.nome
        ) === identificador
    );


    if (!existe) {

        memoria.push({

            titulo:
                musica.titulo ||
                musica.nome ||
                "Desconhecido",

            artista:
                musica.artista ||
                "",

            arquivo:
                musica.arquivo ||
                musica.file ||
                "",

            url:
                musica.url ||
                "",

            fonte:
                musica.fonte ||
                musica.provider ||
                "local",

            adicionada:
                new Date().toISOString()

        });


        fs.writeFileSync(
            FILE,
            JSON.stringify(memoria, null, 2),
            "utf8"
        );


        console.log(
            "🎵 Música salva na memória:",
            identificador
        );

    }

}


function procurarMemoria(texto) {

    const memoria = carregarMemoria();

    const busca = String(texto || "")
        .toLowerCase();


    return memoria.find(item => {

        const nome = (
            (item.titulo || "") +
            " " +
            (item.artista || "") +
            " " +
            (item.arquivo || "")
        ).toLowerCase();


        return nome.includes(busca);

    });

}


module.exports = {

    carregarMemoria,
    salvarMusica,
    procurarMemoria

};
