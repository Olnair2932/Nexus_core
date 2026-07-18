require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { google } = require("googleapis");

const app = express();

const PORT = process.env.PORT || 10000;
const BASE_DIR = path.join(__dirname, "public");
const LOG = path.join(BASE_DIR,"nexus_brain.log");

const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY
});


async function buscarYoutube(pedido){

    const resposta = await youtube.search.list({

        part:"snippet",
        q:pedido,
        type:"video",
        maxResults:1

    });


    if(!resposta.data.items.length){

        return null;

    }


    const video = resposta.data.items[0];


    return {

        id: video.id.videoId,
        titulo: video.snippet.title

    };

}


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
// MUSIC BRAIN
// ==============================

const BRAIN_FILE = path.join(BASE_DIR,"music_memory.json");


function carregarBrain(){

    try{

        return JSON.parse(
            fs.readFileSync(BRAIN_FILE,"utf8")
        );

    }catch{

        return {
            musicas:{}
        };

    }

}


function salvarBrain(brain){

    try{

        fs.writeFileSync(
            BRAIN_FILE,
            JSON.stringify(brain,null,2)
        );

    }catch{}

}


function normalizarBusca(txt){

    return normalizar(txt)
    .replace(/[^a-z0-9]/g,"")
    .trim();

}


function procurarBrain(pedido){

    const brain = carregarBrain();

    const busca = normalizar(pedido)
        .split(" ")
        .filter(p=>p.length>=3);

    for(const chave in brain.musicas){

        if(busca.some(p=>chave.includes(p) || p.includes(chave))){

            return brain.musicas[chave];

        }

    }

    return null;

}


function aprenderMusica(pedido,arquivo){

    const brain = carregarBrain();

    const chave = normalizarBusca(pedido);

    if(!chave) return;


    if(!brain.musicas[chave]){

        brain.musicas[chave] = {
            arquivo: arquivo,
            vezes: 1
        };

    }else{

        brain.musicas[chave].arquivo = arquivo;
        brain.musicas[chave].vezes++;

    }


    salvarBrain(brain);

}


// ==============================
// BUSCA MUSICAL
// ==============================

function encontrarMusica(pedido){

    const aprendida = procurarBrain(pedido);

    if(aprendida){

        return aprendida.arquivo;

    }


    const busca = normalizar(pedido)
        .replace(/[^a-z0-9]/g,"")
        .trim();

    const lista = arquivos();

    return lista.find(arq=>{

        const nome = normalizar(arq)
            .replace(/[^a-z0-9]/g,"")
            .trim();

        if(nome.includes(busca)){
            return true;
        }

        const partes = busca.match(/[a-z]{4,}/g) || [];

        return partes.some(p => nome.includes(p));

    });

}



// ==============================
// INDEXADOR AUTOMATICO DA BIBLIOTECA
// ==============================

function indexarBiblioteca(){

    const brain = {
        musicas:{}
    };

    const lista = arquivos();

    lista.forEach(arq=>{

        const base = arq
            .replace(/\.[^/.]+$/,"");

        const palavras = normalizar(base)
            .split(" ")
            .filter(p => p.length >= 4);

        palavras.forEach(p=>{

            const chave = p
                .replace(/[^a-z0-9]/g,"")
                .trim();

            if(chave){

                brain.musicas[chave] = {
                    arquivo: arq,
                    vezes: brain.musicas[chave]?.vezes || 0
                };

            }

        });

    });

    salvarBrain(brain);

}


// ==============================

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

console.log("SCRIPT:", script);
console.log("PARAM:", parametro);
console.log("STDOUT:", stdout);
console.log("STDERR:", stderr);

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

aprenderMusica(pedido,encontrado);


acao = "tocar_musica";
parametro = encontrado;

resposta =
"Arquivo encontrado. Tocando.";


}else{


acao = "baixar_musica";


const video = await buscarYoutube(pedido);


if(video){

    parametro =
    `https://www.youtube.com/watch?v=${video.id}`;

    resposta =
    `🎵 Encontrado no YouTube: ${video.titulo}`;

}else{

    parametro = pedido;

    resposta =
    "YouTube não encontrou. Tentando busca local.";

}


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
.split("\n")
.find(l => l.startsWith("OK|"))
?.replace("OK|","")
.trim();


retorno.url =
"/" + encodeURIComponent(arquivo);


retorno.nexus =
"🎵 Tocando: " + arquivo;


}



if(acao==="baixar_musica" && !retorno.url){

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

indexarBiblioteca();

app.listen(PORT,"0.0.0.0",()=>{

console.log(
`🚀 NEXUS MASTER ONLINE PORT ${PORT}`
);

});

