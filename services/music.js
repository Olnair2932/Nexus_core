const local = require("../providers/local");
const podcast = require("../providers/podcast");
const archive = require("../providers/archive");


async function buscarMusica(pedido) {

    const texto = String(pedido || "").toLowerCase();

    let ordem;


    if (
        texto.includes("podcast") ||
        texto.includes("rss") ||
        texto.includes("episodio") ||
        texto.includes("episódio")
    ) {

        ordem = [
            local,
            podcast,
            archive
        ];

    } else {

        ordem = [
            local,
            podcast,
            archive
        ];

    }


    for (const provider of ordem) {

        try {

            const resultado = await provider.buscar(pedido);

            if (resultado) {

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
        "podcast",
        "archive"
    ];

}


module.exports = {
    buscarMusica,
    listarProvedores
};
