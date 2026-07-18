require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");


const { listarProvedores } = require("./services/music");


const chatRoute = require("./routes/chat");


const app = express();


const PORT = process.env.PORT || 10000;

const BASE_DIR = path.join(__dirname,"public");



if(!fs.existsSync(BASE_DIR)){

    fs.mkdirSync(BASE_DIR,{recursive:true});

}



app.use(cors());

app.use(express.json());

app.use(express.static(BASE_DIR));



// ROTAS

app.use("/api",chatRoute);



// ARQUIVOS

app.get("/api/arquivos",(req,res)=>{


    const arquivos = fs.readdirSync(BASE_DIR)
    .filter(f =>
        /\.(mp3|mp4|webm|m4a|ogg)$/i.test(f)
    );


    res.json(
        arquivos.sort()
    );


});



// STATUS

app.get("/api/status",(req,res)=>{


    res.json({

        status:"ONLINE",

        sistema:"NEXUS MULTIFONTE",

        provedores:listarProvedores(),

        biblioteca:
        fs.readdirSync(BASE_DIR)
        .filter(f=>/\.(mp3|mp4|webm|m4a|ogg)$/i.test(f))
        .length,

        porta:PORT

    });


});





app.listen(PORT,"0.0.0.0",()=>{


    console.log(
        `🚀 NEXUS MULTIFONTE ONLINE PORT ${PORT}`
    );


});
