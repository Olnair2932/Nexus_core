const fs = require("fs");
const path = require("path");
const db = require("./firebase_admin");


const FILE = path.join(
    __dirname,
    "../public/music_memory.json"
);



function carregarMemoria() {

    if (!fs.existsSync(FILE)) {

        return {
            musicas: {}
        };

    }


    try {

        const dados =
            JSON.parse(
                fs.readFileSync(FILE, "utf8")
            );


        return dados.musicas
            ? dados
            : { musicas:{} };


    } catch (erro) {

        console.log(
            "Erro lendo memória musical:",
            erro.message
        );


        return {
            musicas:{}
        };

    }

}




function salvarArquivo(memoria) {

    fs.writeFileSync(
        FILE,
        JSON.stringify(memoria, null, 2),
        "utf8"
    );

}




function ehStreaming(musica) {

    if (!musica) return false;


    return (
        musica.stream === true ||
        musica.tipo === "rss" ||
        musica.fonte === "podcast"
    );

}





function salvarMusica(musica) {


    if (!musica) return;


    if (ehStreaming(musica)) {

        console.log(
            "📡 Stream não salvo na memória local:",
            musica.titulo
        );

        return;

    }



    const arquivo =
        musica.arquivo ||
        musica.file ||
        musica.titulo;



    if (!arquivo) return;



    const palavras =
        arquivo
            .replace(/\.[^/.]+$/, "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, " ")
            .split(" ")
            .filter(
                p => p.length >= 3
            );



    const memoria =
        carregarMemoria();



    if (!memoria.musicas) {

        memoria.musicas = {};

    }



    for (const palavra of palavras) {


        memoria.musicas[palavra] = {

            arquivo,

            vezes:
                (memoria.musicas[palavra]?.vezes || 0) + 1

        };


    }



    salvarArquivo(memoria);



    console.log(
        "🎵 Música salva na memória:",
        arquivo
    );


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
        .ref(`playlists/${uid}/${chave}`)
        .set({


            name:
                nome,


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








function procurarMemoria(texto) {


    const palavras =
        String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, " ")
            .split(" ")
            .filter(
                p => p.length >= 3
            );



    const memoria =
        carregarMemoria();



    for (const palavra of palavras) {


        const item =
            memoria.musicas?.[palavra];



        if (item?.arquivo) {


            return {


                fonte:"memoria",


                titulo:
                    item.arquivo,


                arquivo:
                    item.arquivo,


                url:
                    "/" +
                    encodeURIComponent(
                        item.arquivo
                    ),


                adicionada:true


            };


        }


    }



    return null;


}






module.exports = {


    carregarMemoria,

    salvarMusica,

    procurarMemoria,

    salvarPlaylistFirebase


};
