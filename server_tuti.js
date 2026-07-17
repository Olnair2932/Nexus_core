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
const LOG = path.join(BASE_DIR,"nexus_brain.log");

if(!fs.existsSync(BASE_DIR)){
    fs.mkdirSync(BASE_DIR,{recursive:true});
}

app.use(cors());
app.use(express.json());
app.use(express.static(BASE_DIR));


// ==============================
// NORMALIZAÇÃO
// ==============================

function normalizar(txt){

    return String(txt || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g," ")
    .replace(/\s+/g," ")
    .trim();

}


// ==============================
// BIBLIOTECA
// ==============================

function arquivos(){

    return fs.readdirSync(BASE_DIR)
    .filter(f =>
        /\.(mp3|mp4|webm|m4a|ogg)$/i.test(f)
    );

}


function biblioteca(){

    return arquivos().join(", ") || "Vazia";

}


// ==============================
// BUSCA MUSICAL
// ==============================

function encontrarMusica(pedido){

    const busca = normalizar(pedido);

    const lista = arquivos();


    return lista.find(arq=>{

        const nome = normalizar(arq);

        const palavras = busca.split(" ");

        return palavras.every(p =>
            nome.includes(p)
        );

    });

}


// ==============================
// MEMÓRIA
// ==============================

function salvar(texto){

    try{

        fs.appendFileSync(
            LOG,
            `[${new Date().toISOString()}] ${texto}\n`
        );

    }catch{}

}


// ==============================
// GEMINI
// ==============================

async function pensar(texto){

try{

const prompt = `
Você é o NEXUS.

Transforme a frase do usuário em comando.

Responda somente JSON:

{
"acao":"",
"musica":"",
"resposta":""
}

Usuário:
${texto}
`;


const r = await axios.post(

`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,

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
}

);


let saida =
r.data.candidates[0]
.content.parts[0]
.text
.replace(/```json/g,"")
.replace(/```/g,"")
.trim();


return JSON.parse(saida);


}catch(e){

console.log(
"Gemini:",
e.response?.data || e.message
);

return null;

}

}

// ==============================
// EXECUTAR SCRIPT
// ==============================

function executar(script,parametro){

return new Promise(resolve=>{

const arquivo = path.join(BASE_DIR,script);

const nome = String(parametro || "")
.replace(/"/g,"")
.trim();


exec(
`bash "${arquivo}" "${nome}"`,
{
timeout:120000
},
(err,stdout,stderr)=>{

resolve({

ok: !err,
stdout: stdout || "",
stderr: stderr || ""

});

});

});

}



// ==============================
// CHAT PRINCIPAL
// ==============================

app.post("/api/chat", async(req,res)=>{


const texto = req.body.texto || "";


let comando = await pensar(texto);


// Extrai pedido humano mesmo sem Gemini

let pedido = normalizar(texto)
.replace(
/tocar|toca|play|ouvir|quero ouvir|coloca|bota|executa|rodar/g,
""
)
.trim();



if(comando?.musica){

pedido = comando.musica;

}



let encontrado = encontrarMusica(pedido);



let acao;
let parametro;
let resposta;



if(encontrado){


acao = "tocar_musica";
parametro = encontrado;

resposta =
"Arquivo encontrado. Tocando.";


}else{


acao = "baixar_musica";
parametro = pedido;

resposta =
"Arquivo não encontrado. Baixando.";

}




let script =
acao === "tocar_musica"
?
"tocar_mp3.sh"
:
"baixar_mp3.sh";



const execucao =
await executar(
script,
parametro
);



let retorno={

nexus: resposta,

log:
execucao.stdout ||
execucao.stderr ||
"",

url:null

};



if(execucao.stdout.includes("OK|")){


const arquivo =
execucao.stdout
.split("OK|")[1]
.trim();


retorno.url =
"/" + encodeURIComponent(arquivo);


retorno.nexus =
"🎵 Tocando: " + arquivo;


}



if(acao==="baixar_musica"){

retorno.nexus =
"📥 Baixando para biblioteca local.";

}



salvar(
`USER:${texto} | ${retorno.nexus}`
);



res.json(retorno);


});




// ==============================
// LISTA DE ARQUIVOS
// ==============================


app.get("/api/arquivos",(req,res)=>{

res.json(
arquivos().sort()
);

});




// ==============================
// STATUS
// ==============================


app.get("/api/status",(req,res)=>{


res.json({

status:"ONLINE",

sistema:"NEXUS MASTER",

biblioteca:biblioteca(),

porta:PORT

});


});



// ==============================
// START SERVER
// ==============================

app.listen(PORT,"0.0.0.0",()=>{

console.log(
`🚀 NEXUS MASTER ONLINE PORT ${PORT}`
);

});

