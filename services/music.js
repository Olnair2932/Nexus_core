const local = require("../providers/local");
const podcast = require("../providers/podcast");
const archive = require("../providers/archive");
const youtube = require("../providers/youtube");

const {
    salvarMusica,
    procurarMemoria,
    salvarPlaylistFirebase
} = require("./music_memory");



async function buscarMusica(pedido) {


    const texto =
        typeof pedido === "object"
            ? pedido.texto
            : pedido;



    const uid =
        typeof pedido === "object"
            ? pedido.uid
            : null;



    const gemini =
        typeof pedido === "object"
            ? pedido.gemini
            : null;



    const textoBusca =
        String(texto || "")
        .toLowerCase();



    const memoria =
        procurarMemoria(textoBusca);



    if (memoria) {


        if (uid) {

            await salvarPlaylistFirebase(
                memoria,
                uid
            );

        }


        return memoria;

    }




    let ordem = [];



    const preferencia =
        gemini?.fonte_preferida;



    if (preferencia === "youtube") {

        ordem = [
            youtube,
            local,
            archive,
            podcast
        ];

    } else if (preferencia === "podcast") {

        ordem = [
            podcast,
            archive,
            local,
            youtube
        ];

    } else if (preferencia === "local") {

        ordem = [
            local,
            archive,
            youtube,
            podcast
        ];

    } else {


        if (
            textoBusca.includes("podcast") ||
            textoBusca.includes("rss") ||
            textoBusca.includes("episodio") ||
            textoBusca.includes("episódio")
        ) {

            ordem = [
                podcast,
                archive,
                local,
                youtube
            ];


        } else {

            ordem = [
                local,
                archive,
                podcast,
                youtube
            ];

        }

    }




    for (const provider of ordem) {


        try {


            const resultado =
                await provider.buscar(texto);



            if (resultado) {


                salvarMusica(resultado);



                if (uid) {

                    await salvarPlaylistFirebase(
                        resultado,
                        uid
                    );

                }



                return resultado;

            }



        } catch (erro) {


            console.log(
                `Erro no provider ${provider.nome || "desconhecido"}:`,
                erro.message
            );


        }


    }



    return null;

}





function listarProvedores() {

    return [
        "local",
        "archive",
        "podcast",
        "youtube"
    ];

}



module.exports = {

    buscarMusica,

    listarProvedores

};
