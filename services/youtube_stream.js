const ytdl = require("@distube/ytdl-core");

async function criarStream(resultado) {

    if (!resultado) {
        return null;
    }


    if (
        resultado.fonte !== "youtube" ||
        !resultado.videoId
    ) {
        return resultado;
    }


    try {

        const info =
            await ytdl.getInfo(
                resultado.videoId
            );


        const formato =
            ytdl.chooseFormat(
                info.formats,
                {
                    quality: "highestaudio",
                    filter: "audioonly"
                }
            );


        if (!formato?.url) {

            return resultado;

        }


        return {

            ...resultado,

            url:
                formato.url,

            tipo:
                "audio",

            stream:
                true

        };


    } catch (erro) {

        console.log(
            "YouTube stream erro:",
            erro.message
        );


        return resultado;

    }

}


module.exports = {
    criarStream
};
