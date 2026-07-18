const axios = require("axios");

const API = "https://archive.org/advancedsearch.php";

function normalizar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

async function buscar(pedido) {

    try {

        const termo = normalizar(pedido);

        const resposta = await axios.get(API, {
            params: {
                q: `${termo} AND mediatype:audio`,
                fl: [
                    "identifier",
                    "title"
                ],
                rows: 5,
                output: "json"
            },
            timeout: 10000
        });


        const docs = resposta.data
            ?.response
            ?.docs || [];


        if (!docs.length) {
            return null;
        }


        const item = docs[0];


        return {
            fonte: "archive",
            titulo: item.title || item.identifier,
            id: item.identifier,
            url: null
        };


    } catch (erro) {

        console.log(
            "Archive erro:",
            erro.message
        );

        return null;
    }
}


module.exports = {
    nome: "archive",
    buscar
};
