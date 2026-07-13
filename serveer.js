require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 10000;

const BASE_DIR = path.join(__dirname, "public");
const BIN_DIR = path.join(__dirname, "bin");

const BRAIN_LOG = path.join(BASE_DIR, "nexus_brain.log");

app.use(cors());
app.use(express.json());
app.use(express.static(BASE_DIR));


// ===============================
// BIBLIOTECA DE MÚSICAS
// ===============================

function obterBiblioteca(){

    try{

        return fs.readdirSync(BASE_DIR)
        .filter(file =>
            /\.(mp3|webm|m4a|ogg)$/i.test(file)
        )
        .join(", ") || "Vazia";

    }catch{

        return "Vazia";

    }

}


// ===============================
// MEMÓRIA DO NEXUS
// ===============================

function obterContexto(){

    try{

        if(!fs.existsSync(BRAIN_LOG))
            return "Nenhum aprendizado.";

        return fs.readFileSync(
            BRAIN_LOG,
            "utf8"
        )
        .split("\n")
        .slice(-20)
        .join("\n");


    }catch{

        return "Memória indisponível.";

    }

}


function salvarMemoria(texto){

    fs.appendFileSync(

        BRAIN_LOG,

        `[${new Date().toLocaleString()}] ${texto}\n`

    );

}



// ===============================
// GEMINI NEXUS
// ===============================

async function interpretar(texto){

const prompt = `

Você é o NEXUS.

Biblioteca atual:

${obterBiblioteca()}


Memória:

${obterContexto()}


REGRAS:

1 - Se a música existe na biblioteca:
acao = tocar_musica


2 - Se não existe:
acao = baixar_musica


3 - Nunca use SoundCloud.


4 - params deve ser somente o nome solicitado.


5 - Responda somente JSON válido:

{
"acao":"",
"params":"",
"resposta":"",
"reflexao":""
}


Usuário:
${texto}

`;


try{


const r = await axios.post(

`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,

{
contents:[
{
parts:[
{
text:prompt
}
]
}
]
},

{
timeout:20000
}

);


let json =
r.data
.candidates[0]
.content
.parts[0]
.text
.replace(/```json/g,"")
.replace(/```/g,"")
.trim();


return {

success:true,

data:JSON.parse(json)

};


}catch(e){

console.log(e.message);

return {

success:false

};

}

}


// ===============================
// EXECUTOR DE SCRIPTS
// ===============================

function executar(script,parametros){


return new Promise(resolve=>{


const env = {

...process.env,

PATH:
process.env.PATH +
":" +
BIN_DIR

};


const arquivo =
path.join(
BASE_DIR,
script
);


const comando =
`bash "${arquivo}" "${parametros.replace(/"/g,'')}"`
;


exec(

comando,

{
env,
timeout:120000
},

(err,stdout,stderr)=>{


resolve({

ok:!err,

stdout,

stderr

});


});


});


}// ===============================
// API CHAT NEXUS
// ===============================

app.post("/api/chat", async (req, res) => {

    const texto = req.body.texto || "";

    const resultado = await interpretar(texto);


    let intent = resultado.success
    ? resultado.data
    : {
        acao: texto.toLowerCase().includes("tocar")
        ? "tocar_musica"
        : "baixar_musica",

        params: texto,

        resposta:"Modo emergência ativado.",

        reflexao:"Fallback local."
    };


    let script =
    intent.acao === "tocar_musica"
    ? "tocar_mp3.sh"
    : "baixar_mp3.sh";


    const execucao =
    await executar(script, intent.params);



    let resposta = {

        nexus:
        intent.resposta ||
        "Processamento concluído.",

        reflexao:
        intent.reflexao || "",

        log:
        execucao.stdout ||
        execucao.stderr ||
        ""

    };



    // Retorno do script no formato OK|arquivo.mp3

    if(execucao.stdout &&
       execucao.stdout.includes("OK|")){


        const arquivo =
        execucao.stdout
        .split("OK|")[1]
        .trim();



        resposta.url =
        "/" + encodeURIComponent(arquivo);



        resposta.nexus =
        "🎵 Disponível: " + arquivo;

    }



    if(intent.acao === "baixar_musica"){

        resposta.nexus =
        "📥 Música adicionada à biblioteca local.";

    }



    salvarMemoria(
        `USER: ${texto} | NEXUS: ${resposta.nexus}`
    );



    res.json(resposta);


});




// ===============================
// LISTAR ARQUIVOS
// ===============================

app.get("/api/arquivos",(req,res)=>{


    try{


        const arquivos =
        fs.readdirSync(BASE_DIR)
        .filter(file =>
            /\.(mp3|webm|m4a|ogg)$/i.test(file)
        )
        .sort();



        res.json(arquivos);


    }catch(e){

        res.json([]);

    }


});




// ===============================
// STATUS
// ===============================

app.get("/api/status",(req,res)=>{


    res.json({

        status:"ONLINE",

        sistema:"NEXUS MASTER",

        biblioteca:
        obterBiblioteca(),

        memoria:
        "ATIVA",

        porta:
        PORT

    });


});




// ===============================
// INÍCIO
// ===============================

app.listen(PORT,"0.0.0.0",()=>{

    console.log(
        `🚀 NEXUS MASTER ONLINE - PORTA ${PORT}`
    );

});
