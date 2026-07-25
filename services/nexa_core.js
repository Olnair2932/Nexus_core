
const {
    carregar,
    aprender
} = require("./nexa_memory");


async function processar(texto) {

    const comando =
        texto
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();


    if (comando.includes("aprenda")) {

        const partes =
            comando.split("aprenda")[1]
            .trim()
            .split(" ");


        const chave =
            partes.shift();


        const valor =
            partes.join(" ");


        if (chave && valor) {

            aprender(
                chave,
                valor
            );

            return {

                sistema: "NEXA",

                status: "aprendido",

                entrada: texto,

                memoria:
                    carregar(),

                resposta:
                    `Aprendi: ${chave} = ${valor}`

            };

        }

    }


    if (comando.includes("lembre")) {

        const chave =
            comando.split("lembre")[1]
            .trim();


        const memoria =
            carregar();


        const valor =
            memoria
            ?.preferencias
            ?. [chave];


        return {

            sistema: "NEXA",

            status: "consulta",

            entrada: texto,

            memoria,

            resposta:
                valor
                ? `${chave}: ${valor}`
                : `Não encontrei ${chave} na memória.`

        };

    }


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
