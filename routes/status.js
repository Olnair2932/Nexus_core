const express = require("express");
const fs = require("fs");
const path = require("path");

const { listarProvedores } = require("../services/music");

const router = express.Router();

const BASE_DIR = path.join(__dirname,"../public");


function totalArquivos(){

    return fs.readdirSync(BASE_DIR)
        .filter(f =>
            /\.(mp3|mp4|webm|m4a|ogg)$/i.test(f)
        )
        .length;

}



router.get("/status",(req,res)=>{

    res.json({

        status:"ONLINE",

        sistema:"NEXUS MULTIFONTE",

        provedores:listarProvedores(),

        biblioteca:totalArquivos(),

        porta:process.env.PORT || 10000

    });

});



module.exports = router;
