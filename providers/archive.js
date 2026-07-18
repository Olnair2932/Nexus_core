const axios = require("axios");

const API = "https://archive.org/advancedsearch.php";


function normalizar(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


function parecePodcastOuRadio(titulo) {

    const bloqueados = [
        "radio",
        "forum",
        "podcast",
        "episode",
        "episodio",
        "news",
        "interview",
        "lecture",
        "talk",
        "program"
    ];

    const texto = normalizar(titulo);

    return bloqueados.some(p => texto.includes(p));

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

                rows: 20,

                output: "json"

            },

            timeout: 10000

        });



        const docs = resposta.data
            ?.response
            ?.docs || [];



        const valido = docs.find(item => {

            const titulo = item.title || item.identifier;

            return !parecePodcastOuRadio(titulo);

        });



        if (!valido) {

            return null;

        }



        return {

            fonte: "archive",

            titulo: valido.title || valido.identifier,

            id: valido.identifier,

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
