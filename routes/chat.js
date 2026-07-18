const express = require("express");

const router = express.Router();

const { buscarMusica } = require("../services/music");

const path = require("path");
const fs = require("fs");

const LOG = path.join(__dirname,"../public/nexus_brain.log");


function salvarLog(texto){

    try{

        fs.appendFileSync(
            LOG,
            `[${new Date().toISOString()}] ${texto}\n`
        );

    }catch{}

}



router.post("/chat", async(req,res)=>{

    const texto = req.body.texto || "";


    const resultado = await buscarMusica(texto);


    let retorno = {

        nexus:"",
        fonte:null,
        url:null

    };



    if(resultado){


        retorno.fonte = resultado.fonte;



        if(resultado.url){


            retorno.url = resultado.url;


            retorno.nexus =
                `🎵 Encontrado em ${resultado.fonte}: ${resultado.titulo}`;


        }else{


            retorno.nexus =
                `🔎 Encontrado em ${resultado.fonte}: ${resultado.titulo}`;


        }



    }else{


        retorno.nexus =
            "❌ Nenhuma fonte encontrou esse pedido.";


    }



    salvarLog(
        `USER:${texto} RESULT:${JSON.stringify(retorno)}`
    );



    res.json(retorno);


});



module.exports = router;
