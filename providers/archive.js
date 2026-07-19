const axios = require("axios");

const SEARCH_API = "https://archive.org/advancedsearch.php";
const META_API = "https://archive.org/metadata";



function normalizar(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}



function ehPodcast(titulo, metadata) {

    const texto =
        normalizar(
            titulo + " " +
            JSON.stringify(metadata || {})
        );

    return [
        "podcast",
        "episode",
        "episodio",
        "radio",
        "rss"
    ].some(x => texto.includes(x));

}





async function buscar(pedido) {

    try {

        const termo =
            normalizar(pedido);

        const querPodcast =
            termo.includes("podcast") ||
            termo.includes("episodio") ||
            termo.includes("episódio") ||
            termo.includes("rss");



        const busca =
            await axios.get(
                SEARCH_API,
                {
                    params: {
                        q: `${termo} AND mediatype:audio`,
                        fl: [
                            "identifier",
                            "title"
                        ],
                        rows: 20,
                        output: "json"
                    },
                    timeout: 30000
                }
            );



        const docs =
            busca.data?.response?.docs || [];



        for (const item of docs) {

            const titulo =
                item.title ||
                item.identifier;



            const meta =
                await axios.get(
                    `${META_API}/${item.identifier}`,
                    {
                        timeout: 15000
                    }
                );



            const arquivos =
                meta.data?.files || [];



            const candidatos =
                arquivos.filter(file => {

                    const nome =
                        String(file.name || "")
                            .toLowerCase();

                    const tamanho =
                        Number(file.size || 0);

                    return (
                        /\.(mp3|ogg|wav|m4a)$/.test(nome) &&
                        !file.private &&
                        tamanho > 0
                    );

                });



            if (!candidatos.length) {

                continue;

            }



            candidatos.sort(
                (a, b) =>
                    Number(a.size || 0) -
                    Number(b.size || 0)
            );



            const audio =
                candidatos[0];



            if (
                !querPodcast &&
                ehPodcast(
                    titulo,
                    meta.data?.metadata
                )
            ) {

                continue;

            }



            return {

                fonte: "archive",

                titulo,

                id: item.identifier,

                arquivo: audio.name,

                url:
                    `https://archive.org/download/${item.identifier}/${encodeURIComponent(audio.name)}`,

                tamanho:
                    Number(audio.size || 0),

                tipo: "audio",

                stream: true

            };

        }



        return null;

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
