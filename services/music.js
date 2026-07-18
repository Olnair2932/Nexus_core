const local = require("../providers/local");
const archive = require("../providers/archive");
const podcast = require("../providers/podcast");

async function buscarMusica(pedido) {

    const texto = String(pedido || "").toLowerCase();

    let ordem = [
        local,
        archive
    ];

    if (
        texto.includes("podcast") ||
        texto.includes("rss") ||
        texto.includes("episodio")
    ) {
        ordem = [
            local,
            podcast,
            archive
        ];
    } else {
        ordem.push(podcast);
    }


    for (const provider of ordem) {

        try {

            const resultado = await provider.buscar(pedido);

            if (resultado) {
                return resultado;
            }

        } catch (erro) {

            console.log(
                `Erro no provider ${provider.nome}:`,
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
