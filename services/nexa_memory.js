
const fs = require("fs");
const path = require("path");


const FILE =
    path.join(
        __dirname,
        "nexa_brain.json"
    );


function carregar() {

    try {

        return JSON.parse(
            fs.readFileSync(
                FILE,
                "utf8"
            )
        );

    } catch {

        return {};

    }

}


function salvar(dados) {

    fs.writeFileSync(
        FILE,
        JSON.stringify(
            dados,
            null,
            2
        ),
        "utf8"
    );

}


function aprender(chave, valor) {

    const brain =
        carregar();


    if (!brain.preferencias) {

        brain.preferencias = {};

    }


    brain.preferencias[chave] =
        valor;


    salvar(brain);


    return brain;

}


module.exports = {

    carregar,

    salvar,

    aprender

};
