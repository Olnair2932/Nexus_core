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
const BRAIN_LOG = path.join(BASE_DIR, "nexus_brain.log");


// cria public se não existir
if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
}


app.use(cors());
app.use(express.json());
app.use(express.static(BASE_DIR));


// ===============================
// BIBLIOTECA
// ===============================

function obterBiblioteca() {

    try {

        return fs.readdirSync(BASE_DIR)
        .filter(file =>
            /\.(mp3|mp4|webm|m4a|ogg)$/i.test(file)
        )
        .join(", ") || "Vazia";

    } catch {

        return "Vazia";

    }

}


// ===============================
// MEMÓRIA
// ===============================

function obterContexto() {

    try {

        if (!fs.existsSync(BRAIN_LOG))
            return "Nenhum aprendizado.";

        return fs.readFileSync(
            BRAIN_LOG,
            "utf8"
        )
        .split("\n")
        .slice(-20)
        .join("\n");

    } catch {

        return "Erro memória.";

    }

}


function salvarMemoria(texto) {

    fs.appendFileSync(
        BRAIN_LOG,
        `[${new Date().toLocaleString()}] ${texto}\n`
    );

}


// ===============================
// GEMINI
// ===============================

async function interpretar(texto) {


const prompt = `

Você é o NEXUS.

Biblioteca:
${obterBiblioteca()}

Histórico:
${obterContexto()}


REGRAS:

Se música existir:
acao="tocar_musica"

Se música não existir:
acao="baixar_musica"

Nunca usar SoundCloud.

Responder somente JSON:

{
"acao":"",
"params":"",
"resposta":"",
"reflexao":""
}


Usuário:
${texto}

`;



try {


const resposta = await axios.post(

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



let textoIA =
resposta.data
.candidates[0]
.content
.parts[0]
.text
.replace(/```json/g,"")
.replace(/```/g,"")
.trim();



return {

success:true,

data:JSON.parse(textoIA)

};



} catch(e) {


console.log(
"Erro Gemini:",
e.message
);


return {

success:false

};


}


}



// ===============================
// EXECUTAR SCRIPT
// ===============================

function executar(script,parametro){


return new Promise(resolve=>{


const arquivo =
path.join(BASE_DIR,script);


const nome =
String(parametro || "")
.replace(/"/g,"")
.trim();



exec(

`bash "${arquivo}" "${nome}"`,

{
timeout:120000
},

(err,stdout,stderr)=>{


resolve({

ok:!err,

stdout:stdout || "",

stderr:stderr || ""

});


}

);


});


}



// ===============================
// CHAT
// ===============================

app.post("/api/chat", async(req,res)=>{

const texto = req.body.texto || "";

let resultado = await interpretar(texto);

if (!resultado.success) {
    resultado = {
        success:true,
        data:{
            acao:"baixar_musica",
            params:texto,
            resposta:"Executando protocolo local."
        }
    };
}


// Correção: tocar somente se existir
const normalizar = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const bibliotecaAtual = normalizar(obterBiblioteca());
const pedido = normalizar(texto)
.replace(/tocar|toca/g,"")
.trim();


if (
    pedido &&
    (texto.toLowerCase().includes("tocar") ||
     texto.toLowerCase().includes("toca"))
) {

    if (bibliotecaAtual.includes(pedido)) {

        resultado.data = {
            acao:"tocar_musica",
            params:pedido,
            resposta:"Arquivo encontrado. Tocando."
        };

    } else {

        resultado.data = {
            acao:"baixar_musica",
            params:pedido,
            resposta:"Arquivo não encontrado. Baixando."
        };

    }

}


const intent = resultado.data;

let script;

if(intent.acao==="tocar_musica"){
    script="tocar_mp3.sh";
}else{
    script="baixar_mp3.sh";
}


const execucao = await executar(
    script,
    intent.params
);


let retorno = {

nexus:
intent.resposta || "Processado.",

log:
execucao.stdout || execucao.stderr || "",

reflexao:
intent.reflexao || ""

};


if(execucao.stdout.includes("OK|")){

const arquivo =
execucao.stdout.split("OK|")[1].trim();

retorno.url =
"/" + encodeURIComponent(arquivo);

retorno.nexus =
"🎵 Tocando: " + arquivo;

}


if(intent.acao==="baixar_musica"){
retorno.nexus =
"📥 Baixando para biblioteca local.";
}


salvarMemoria(
`USER:${texto} | ${retorno.nexus}`
);


res.json(retorno);

});


// ===============================
// ARQUIVOS

// ===============================

app.get("/api/arquivos",(req,res)=>{


try {


const arquivos =
fs.readdirSync(BASE_DIR)
.filter(f =>
 /\.(mp3|mp4|webm|m4a|ogg)$/i.test(f)
)
.sort();



res.json(arquivos);



} catch {


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

memoria:"ATIVA",

porta:PORT

});


});



// ===============================
// START
// ===============================

app.listen(PORT,"0.0.0.0",()=>{

console.log(
`🚀 NEXUS MASTER ONLINE PORT ${PORT}`
);

});
