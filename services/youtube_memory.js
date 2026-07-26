const fs = require("fs");
const path = require("path");

const FILE = path.join(
    __dirname,
    "../public/youtube_memory.json"
);


function carregar() {

    try {

        if (!fs.existsSync(FILE)) {
            return {
                musicas:{},
                falhas:[]
            };
        }

        return JSON.parse(
            fs.readFileSync(FILE,"utf8")
        );

    } catch {

        return {
            musicas:{},
            falhas:[]
        };

    }

}


function salvar(memoria) {

    fs.writeFileSync(
        FILE,
        JSON.stringify(
            memoria,
            null,
            2
        ),
        "utf8"
    );

}


function normalizar(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"")
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g," ")
        .trim();

}


function salvarResultado(pedido, musica) {

    if (!musica || !musica.videoId || !musica.url) {
        return;
    }

    const memoria = carregar();

    const chave = normalizar(
        pedido || musica.titulo
    );


    if (!chave) {
        return;
    }


    memoria.musicas[chave] = {

        titulo: musica.titulo,

        pedido: pedido,

        url: musica.url,

        videoId: musica.videoId,

        vezes:
            (memoria.musicas[chave]?.vezes || 0) + 1,

        atualizado:
            Date.now()

    };


    salvar(memoria);

}


function buscar(texto) {

    const memoria = carregar();

    const chave =
        normalizar(texto);


    for (const item of Object.values(memoria.musicas)) {

        if (
            normalizar(item.titulo).includes(chave) ||
            normalizar(item.pedido).includes(chave) ||
            chave.includes(normalizar(item.pedido))
        ) {

            return {
                ...item,
                fonte:"youtube_memoria"
            };

        }

    }


    return null;

}


module.exports = {

    carregar,

    salvar,

    salvarResultado,

    buscar

};
