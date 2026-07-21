const express = require("express");
const router = express.Router();

const {
    buscarMusica
} = require("../services/music");

const {
    interpretar
} = require("../services/gemini");

const {
    carregar,
    adicionar
} = require("../services/nexus_context");

const {
    lerPreferencias
} = require("../services/nexus_preferencias");

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


    let comandoGemini = null;


    try {

        const preferencias = lerPreferencias();

        comandoGemini =
            await interpretar(
                texto,
                {
                    historico: carregar(),
                    preferencias
                }
            );

    } catch {}



    let buscaFinal = texto;


    if (
        comandoGemini &&
        Array.isArray(comandoGemini.termos)
    ) {

        buscaFinal =
            comandoGemini.termos.join(" ");

    }



    
      if (
          comandoGemini &&
          (
            comandoGemini.intencao === "conversa" ||
            comandoGemini.intencao === "sugestao"
        )
      ) {

          let retorno = {
              nexus:"",
              fonte:null,
              url:null,
              videoId:null,
              arquivo:null,
              memoria:false
          };

          retorno.nexus =
              comandoGemini.resposta ||
              "Olá! Sou o Nexus. Como posso ajudar?";

          adicionar(
              texto,
              retorno.nexus
          );

          salvarLog(
              `CONVERSA:${texto} RESP:${retorno.nexus}`
          );

          return res.json(retorno);
      }

const resultado =
        await buscarMusica({

            texto: buscaFinal,

            uid,

            gemini: comandoGemini

        });



    let retorno = {

        nexus:"",

        fonte:null,

        url:null,

        videoId:null,

        arquivo:null,

        memoria:false

    };



    if (resultado) {


        retorno.fonte =
            resultado.fonte;



        if (
            resultado.fonte === "youtube" &&
            resultado.videoId
        ) {

            retorno.videoId =
                resultado.videoId;
            retorno.titulo = resultado.titulo || "Vídeo YouTube";

            retorno.url =
                resultado.url || null;


        } else {

            retorno.url =
                resultado.url || null;

        }



        retorno.arquivo =
            resultado.arquivo || null;



        if (resultado.adicionada) {

            retorno.memoria = true;

        }



        retorno.nexus =
            retorno.memoria
            ? `🎵 Recuperado da biblioteca: ${resultado.titulo}`
            : `🎵 Encontrado em ${resultado.fonte}: ${resultado.titulo}`;



    } else {


        retorno.nexus =
            "❌ Nenhuma fonte encontrou esse pedido.";

    }



    adicionar(
        texto,
        retorno.nexus
    );



    salvarLog(
        `USER:${texto} UID:${uid || "anonimo"} GEMINI:${JSON.stringify(comandoGemini)} RESULT:${JSON.stringify(retorno)}`
    );



    res.json(retorno);

});



module.exports = router;
