const axios = require("axios");

const SEARCH_API = "https://itunes.apple.com/search";
const LOOKUP_API = "https://itunes.apple.com/lookup";


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


        const busca = await axios.get(
            SEARCH_API,
            {
                params:{
                    media:"podcast",
                    term:texto,
                    limit:10
                },
                timeout:10000
            }
        );


        const resultados =
            busca.data.results || [];


        if(!resultados.length){

            return null;

        }



        const item =
            resultados.find(p =>
                p.collectionId &&
                p.feedUrl
            ) || resultados[0];



        let audio = null;



        if(item.collectionId){

            try {

                const episodios =
                    await axios.get(
                        LOOKUP_API,
                        {
                            params:{
                                id:item.collectionId,
                                entity:"podcastEpisode",
                                limit:1
                            },
                            timeout:10000
                        }
                    );


                const ep =
                    episodios.data.results
                    ?.find(x =>
                        x.episodeUrl
                    );


                if(ep){

                    audio = ep.episodeUrl;

                }


            } catch {}

        }



        return {

            fonte:"podcast",

            titulo:
                item.collectionName ||
                "Podcast",

            autor:
                item.artistName ||
                "Desconhecido",

            url:
                audio ||
                item.feedUrl ||
                null,

            tipo:
                audio ?
                "audio" :
                "rss",

            artwork:
                item.artworkUrl600 ||
                item.artworkUrl100 ||
                null

        };



    } catch(erro){

        console.log(
            "Podcast erro:",
            erro.message
        );

        return null;

    }

}



module.exports = {

    nome:"podcast",

    buscar

};
