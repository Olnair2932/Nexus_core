const local = require("../providers/local");

const providers = [
    local
];

async function buscarMusica(pedido) {

    for (const provider of providers) {

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
    return providers.map(p => p.nome);
}

module.exports = {
    buscarMusica,
    listarProvedores
};
