const express = require("express");
const router = express.Router();

const {
    buscarMusica
} = require("../services/music");

const {
    interpretar,
    interpretarNexa
} = require("../services/gemini");

const {
    carregar,
    adicionar
} = require("../services/nexus_context");

const {
    lerPreferencias
} = require("../services/nexus_preferencias");


const {
    ativarNexa
} = require("../services/nexa_trigger");


const {
    processar
} = require("../services/nexa_core");

const path = require("path");
const fs = require("fs");


const LOG = path.join(
    __dirname,
    "../storage/logs/nexus_brain.log"
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


    let textoProcessado = texto;
    let nexaAtiva = false;

    if (ativarNexa(texto)) {

        nexaAtiva = true;

        const resultadoNexa =
            await interpretarNexa(texto);

        if (resultadoNexa?.pedido) {

            textoProcessado =
                resultadoNexa.pedido;

        }

    }


    let comandoGemini = null;


    try {

        const preferencias = lerPreferencias();

        if (!nexaAtiva) {

            comandoGemini =
                await interpretar(
                    texto,
                    {
                        historico: carregar(),
                        preferencias
                    }
                );

        }

    } catch {}



    let buscaFinal = textoProcessado;


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

console.log("===== DIAGNÓSTICO YOUTUBE =====");
console.log("texto:", texto);
console.log("textoProcessado:", textoProcessado);
console.log("comandoGemini:", JSON.stringify(comandoGemini, null, 2));
console.log("buscaFinal:", buscaFinal);

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
            (resultado.fonte === "youtube" ||
               resultado.fonte === "youtube_memoria") &&
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

        retorno.titulo =
            resultado.titulo || resultado.arquivo || "Vídeo";



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



router.get("/youtube/titulo/:videoId", async (req, res) => {
    const videoId = String(req.params.videoId || "").trim();
    const chave = process.env.YOUTUBE_API_KEY;

    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        return res.status(400).json({
            erro: "videoId do YouTube inválido"
        });
    }

    if (!chave) {
        return res.status(500).json({
            erro: "YouTube API não configurada"
        });
    }

    try {
        const axios = require("axios");

        const resposta = await axios.get(
            "https://www.googleapis.com/youtube/v3/videos",
            {
                params: {
                    key: chave,
                    part: "snippet",
                    id: videoId
                },
                timeout: 10000
            }
        );

        const item = resposta.data?.items?.[0];

        if (!item) {
            return res.status(404).json({
                erro: "Vídeo do YouTube não encontrado"
            });
        }

        return res.json({
            titulo: item.snippet?.title || "Vídeo YouTube",
            canal: item.snippet?.channelTitle || "Desconhecido",
            videoId
        });

    } catch (erro) {
        console.log("YouTube título erro:", erro.message);

        return res.status(500).json({
            erro: "Erro ao consultar o YouTube"
        });
    }
});

module.exports = router;
