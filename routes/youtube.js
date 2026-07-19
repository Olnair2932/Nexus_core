const express = require("express");
const router = express.Router();

const ytdl = require("@distube/ytdl-core");


router.get("/youtube/audio/:id", async (req, res) => {

    const id =
        req.params.id;


    try {

        res.setHeader(
            "Content-Type",
            "audio/mpeg"
        );


        const stream =
            ytdl(
                id,
                {
                    filter:"audioonly",
                    quality:"highestaudio"
                }
            );


        stream.on(
            "error",
            erro => {

                console.log(
                    "YouTube stream erro:",
                    erro.message
                );

                if (!res.headersSent) {
                    res.status(500).end();
                }

            }
        );


        stream.pipe(res);


    } catch(erro) {

        console.log(
            "YouTube rota erro:",
            erro.message
        );

        res.status(500).json({
            erro:"Falha no áudio YouTube"
        });

    }

});


module.exports = router;
