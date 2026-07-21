const fs = require("fs");
const path = require("path");
const db = require("./firebase_admin");

const FILE = path.join(
    __dirname,
    "../public/music_memory.json"
);


const PALAVRAS_IGNORADAS = new Set([
    "oficial",
    "official",
    "clipe",
    "videoclipe",
    "video",
    "audio",
    "udio",
    "mp3",
    "m4a",
    "live",
    "vivo",
    "ao",
    "hd",
    "lyrics",
    "letra"
]);


function normalizar(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .split(/\s+/)
        .filter(
            p =>
                p.length >= 3 &&
                !PALAVRAS_IGNORADAS.has(p)
        );

}



function carregarMemoria() {

    if (!fs.existsSync(FILE)) {

        return {
            musicas:{}
        };

    }


    try {

        const dados =
            JSON.parse(
                fs.readFileSync(FILE,"utf8")
            );


        return dados.musicas
            ? dados
            : {musicas:{}};


    } catch(e) {

        console.log(
            "Erro lendo memória musical:",
            e.message
        );


        return {
            musicas:{}
        };

    }

}



function salvarArquivo(memoria) {

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



function ehStreaming(musica) {

    return musica &&
    (
        musica.stream === true ||
        musica.tipo === "rss" ||
        musica.fonte === "podcast"
    );

}




function salvarMusica(musica) {


    if (!musica || ehStreaming(musica)) {

        return;

    }


    const arquivo =
        musica.arquivo ||
        musica.file ||
        musica.titulo;


    if (!arquivo) return;



    const palavras =
        normalizar(
            arquivo.replace(/\.[^/.]+$/, "")
        );



    const memoria =
        carregarMemoria();



    if (!memoria.musicas) {

        memoria.musicas = {};

    }



    for (const palavra of palavras) {


        if (!Array.isArray(memoria.musicas[palavra])) {

            memoria.musicas[palavra] = [];

        }



        const existente =
            memoria.musicas[palavra]
            .find(
                item =>
                    item.arquivo === arquivo
            );



        if (existente) {

            existente.vezes =
                (existente.vezes || 0) + 1;

        } else {


            memoria.musicas[palavra].push({

                arquivo,

                vezes:1

            });


        }


    }



    salvarArquivo(memoria);


    console.log(
        "🎵 Música salva na memória:",
        arquivo
    );


}




function procurarMemoria(texto) {


    const palavras =
        normalizar(texto);



    const memoria =
        carregarMemoria();



    const resultados = {};



    for (const palavra of palavras) {


        const lista =
            memoria.musicas?.[palavra];



        if (!Array.isArray(lista)) {

            continue;

        }



        for (const item of lista) {


            if (!resultados[item.arquivo]) {

                resultados[item.arquivo] = {

                    arquivo:item.arquivo,

                    pontos:0,

                    vezes:item.vezes || 0

                };

            }



            resultados[item.arquivo].pontos += 1;

        }


    }



    const melhor =
        Object.values(resultados)
        .sort(
            (a,b) =>
                (b.pontos * 10 + b.vezes)
                -
                (a.pontos * 10 + a.vezes)
        )[0];



    if (!melhor) {

        return null;

    }



    return {

        fonte:"memoria",

        titulo:melhor.arquivo,

        arquivo:melhor.arquivo,

        url:
            "/" +
            encodeURIComponent(
                melhor.arquivo
            ),

        adicionada:true

    };


}





async function salvarPlaylistFirebase(musica, uid) {


    if (!uid || !musica) return;



    const nome =
        musica.arquivo ||
        musica.file ||
        musica.titulo;



    if (!nome) return;



    const chave =
        nome.replace(
            /[.#$\[\]\/]/g,
            "_"
        );



    await db
        .ref(`historico/${uid}/${chave}`)
        .set({

            name:nome,

            url:
                musica.url ||
                "/" +
                encodeURIComponent(nome),

            fonte:
                musica.fonte ||
                "local",

            tipo:
                musica.tipo ||
                "audio",

            stream:
                musica.stream === true,

            date:
                Date.now()

        });



    console.log(
        "☁️ Música salva no Firebase:",
        nome
    );

}




module.exports = {

    carregarMemoria,

    salvarMusica,

    procurarMemoria,

    salvarPlaylistFirebase

};
