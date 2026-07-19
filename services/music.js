const local = require("../providers/local");
const podcast = require("../providers/podcast");
const archive = require("../providers/archive");

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




    let ordem;



    if (
        textoBusca.includes("podcast") ||
        textoBusca.includes("rss") ||
        textoBusca.includes("episodio") ||
        textoBusca.includes("episódio")
    ) {


        ordem = [
            local,
            podcast,
            archive
        ];


    } else {


        ordem = [
            local,
            archive,
            podcast
        ];

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
        "podcast"
    ];


}




module.exports = {

    buscarMusica,

    listarProvedores

};
