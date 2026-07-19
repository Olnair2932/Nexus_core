require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");


const { listarProvedores } = require("./services/music");


const chatRoute = require("./routes/chat");
const filesRoute = require("./routes/files");
const statusRoute = require("./routes/status");


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
app.use("/api",filesRoute);
app.use("/api",statusRoute);





app.listen(PORT,"0.0.0.0",()=>{


    console.log(
        `🚀 NEXUS MULTIFONTE ONLINE PORT ${PORT}`
    );


});
