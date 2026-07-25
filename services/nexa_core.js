
const {
    carregar
} = require("./nexa_memory");


async function processar(texto) {

    return {

        sistema: "NEXA",

        status: "ativo",

        entrada: texto,

        memoria:
            carregar(),

        resposta:
            "NEXA local ativada."

    };

}


module.exports = {
    processar
};
