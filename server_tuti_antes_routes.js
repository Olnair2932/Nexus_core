require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const { buscarMusica, listarProvedores } = require("./services/music");

const app = express();

const PORT = process.env.PORT || 10000;
const BASE_DIR = path.join(__dirname, "public");
const LOG = path.join(BASE_DIR, "nexus_brain.log");


if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
}


app.use(cors());
app.use(express.json());
app.use(express.static(BASE_DIR));


function salvarLog(texto) {
    try {
        fs.appendFileSync(
            LOG,
            `[${new Date().toISOString()}] ${texto}\n`
        );
    } catch {}
}


function arquivos() {
    return fs.readdirSync(BASE_DIR)
        .filter(f =>
            /\.(mp3|mp4|webm|m4a|ogg)$/i.test(f)
        );
}


// =============================
// CHAT
// =============================

app.post("/api/chat", async (req,res)=>{

    const texto = req.body.texto || "";

    const resultado = await buscarMusica(texto);


    let retorno = {
        nexus: "",
        fonte: null,
        url: null
    };


    if (resultado) {

        retorno.fonte = resultado.fonte;


        if (resultado.url) {

            retorno.url = resultado.url;

            retorno.nexus =
                `🎵 Encontrado em ${resultado.fonte}: ${resultado.titulo}`;

        } else {

            retorno.nexus =
                `🔎 Encontrado em ${resultado.fonte}: ${resultado.titulo}`;

        }


    } else {

        retorno.nexus =
            "❌ Nenhuma fonte encontrou esse pedido.";

    }


    salvarLog(
        `USER:${texto} RESULT:${JSON.stringify(retorno)}`
    );


    res.json(retorno);

});


// =============================
// ARQUIVOS
// =============================

app.get("/api/arquivos",(req,res)=>{

    res.json(
        arquivos().sort()
    );

});


// =============================
// STATUS
// =============================

app.get("/api/status",(req,res)=>{

    res.json({

        status:"ONLINE",
        sistema:"NEXUS MULTIFONTE",
        provedores:listarProvedores(),
        biblioteca:arquivos().length,
        porta:PORT

    });

});


// =============================
// START
// =============================

app.listen(PORT,"0.0.0.0",()=>{

    console.log(
        `🚀 NEXUS MULTIFONTE ONLINE PORT ${PORT}`
    );

});
