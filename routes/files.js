const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const BASE_DIR = path.join(__dirname,"../public");


function arquivos(){

    return fs.readdirSync(BASE_DIR)
        .filter(f =>
            /\.(mp3|mp4|webm|m4a|ogg)$/i.test(f)
        );

}



router.get("/arquivos",(req,res)=>{

    res.json(
        arquivos().sort()
    );

});



module.exports = router;
