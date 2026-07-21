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



function registrarPreferencia(memoria, musica) {

    if (!memoria.artistas) {
        memoria.artistas = {};
    }

    if (!memoria.generos) {
        memoria.generos = {};
    }

    const nome = musica.artista || musica.artist;

    if (nome) {
        memoria.artistas[nome] =
            (memoria.artistas[nome] || 0) + 1;
    }

    const genero = musica.genero || musica.genre;

    if (genero) {
        memoria.generos[genero] =
            (memoria.generos[genero] || 0) + 1;
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



    registrarPreferencia(memoria, musica);

    salvarArquivo(memoria);


    console.log(
        "🎵 Música salva na memória:",
        arquivo
    );


}




async function procurarMemoria(texto, uid) {


    if (uid) {

        try {

            const snap =
                await db.ref(`playlists/${uid}`).once("value");

            const playlist =
                snap.val();

            if (playlist) {

                const itens =
                    Object.values(playlist);

                const busca =
                    normalizar(texto).join(" ");

                const encontrado =
                    itens.find(item =>
                        normalizar(item.name || "").join(" ")
                        .includes(busca)
                    );

                if (encontrado && encontrado.url) {

                    return {

                        fonte:
                            encontrado.source ||
                            "cloudinary",

                        titulo:
                            encontrado.name,

                        arquivo:
                            encontrado.name,

                        url:
                            encontrado.url,

                        tipo:
                            encontrado.source === "cloudinary"
                            ? "video"
                            : "audio",

                        adicionada:true

                    };

                }

            }

        } catch(e) {

            console.log(
                "Erro buscando playlist Firebase:",
                e.message
            );

        }

    }


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
