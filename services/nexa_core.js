
const brain = require("./nexa_brain.json");


async function processar(texto) {

    return {

        sistema: "NEXA",

        status: "ativo",

        entrada: texto,

        memoria:
            brain,

        resposta:
            "NEXA local ativada."

    };

}


module.exports = {
    processar
};
