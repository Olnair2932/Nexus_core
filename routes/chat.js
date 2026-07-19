const express = require("express");
const router = express.Router();

const {
    buscarMusica
} = require("../services/music");

const path = require("path");
const fs = require("fs");


const LOG = path.join(
    __dirname,
    "../public/nexus_brain.log"
);



function salvarLog(texto) {

    try {

        fs.appendFileSync(
            LOG,
            `[${new Date().toISOString()}] ${texto}\n`
        );

    } catch {}

}





router.post("/chat", async (req, res) => {


    const texto =
        req.body.texto || "";


    const uid =
        req.body.uid || null;



    const resultado =
        await buscarMusica({

            texto,

            uid

        });




    let retorno = {

        nexus: "",

        fonte: null,

        url: null,

        arquivo: null,

        memoria: false

    };





    if (resultado) {



        retorno.fonte =
            resultado.fonte;



        retorno.url =
            resultado.url || null;



        retorno.arquivo =
            resultado.arquivo || null;




        if (resultado.adicionada) {

            retorno.memoria = true;

        }




        if (resultado.url) {



            if (retorno.memoria) {


                retorno.nexus =
                    `🎵 Recuperado da biblioteca: ${resultado.titulo}`;


            } else {


                retorno.nexus =
                    `🎵 Encontrado em ${resultado.fonte}: ${resultado.titulo}`;


            }




        } else {



            retorno.nexus =
                `🔎 Encontrado em ${resultado.fonte}: ${resultado.titulo}`;


        }





    } else {



        retorno.nexus =
            "❌ Nenhuma fonte encontrou esse pedido.";


    }




    salvarLog(
        `USER:${texto} UID:${uid || "anonimo"} RESULT:${JSON.stringify(retorno)}`
    );



    res.json(retorno);


});





module.exports = router;
