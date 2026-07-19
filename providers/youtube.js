const axios = require("axios");

const API =
    "https://www.googleapis.com/youtube/v3/search";


function normalizar(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}



async function buscar(pedido) {


    const chave =
        process.env.YOUTUBE_API_KEY;



    if (!chave) {

        console.log(
            "YouTube API não configurada"
        );

        return null;

    }



    try {


        const termo =
            normalizar(pedido);



        const resposta =
            await axios.get(
                API,
                {
                    params: {

                        key: chave,

                        part: "snippet",

                        q: termo,

                        type: "video",

                        maxResults: 5

                    },

                    timeout: 10000

                }
            );



        const item =
            resposta.data?.items?.[0];



        if (!item) {

            return null;

        }



        return {

            fonte: "youtube",

            titulo:
                item.snippet?.title ||
                "Vídeo YouTube",

            autor:
                item.snippet?.channelTitle ||
                "Desconhecido",

            videoId:
                item.id.videoId,

            url:
                `https://www.youtube.com/watch?v=${item.id.videoId}`,

            tipo:
                "youtube",

            stream:
                true

        };



    } catch (erro) {


        console.log(
            "YouTube erro:",
            erro.message
        );


        return null;

    }


}



module.exports = {

    nome: "youtube",

    buscar

};
