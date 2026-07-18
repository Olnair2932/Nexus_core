const axios = require("axios");

const API = "https://itunes.apple.com/search";


function normalizar(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}



async function buscar(pedido) {

    try {

        const texto = normalizar(pedido);


        const resposta = await axios.get(API, {

            params: {

                media: "podcast",

                term: texto,

                limit: 10

            },

            timeout: 10000

        });



        const resultados = resposta.data.results || [];



        if (!resultados.length) {

            return null;

        }



        const item = resultados.find(p => 
            p.collectionName &&
            p.feedUrl
        ) || resultados[0];



        return {

            fonte: "podcast",

            titulo: item.collectionName || "Podcast",

            autor: item.artistName || "Desconhecido",

            url: item.feedUrl || null,

            artwork: item.artworkUrl600 || item.artworkUrl100 || null

        };



    } catch (erro) {


        console.log(
            "Podcast erro:",
            erro.message
        );


        return null;

    }

}



module.exports = {

    nome: "podcast",

    buscar

};
