require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;
const BASE_DIR = path.join(__dirname, "public");

app.use(cors()); app.use(express.json()); app.use(express.static(BASE_DIR));

app.get("/api/arquivos", (req, res) => {
    fs.readdir(BASE_DIR, (err, files) => {
        if (err) return res.json([]);
        res.json(files.filter(f => /\.(mp3|webm|m4a)$/i.test(f)).sort());
    });
});

app.post("/api/chat", (req, res) => {
    const texto = (req.body.texto || "").replace(/"/g, '');
    const bin = path.join(__dirname, "bin");
    const env = { ...process.env, PATH: process.env.PATH + ":" + bin };

    exec(`python3 public/nlu_nexus.py "${texto}"`, { env }, (err, stdout) => {
        let intent;
        try { intent = JSON.parse(stdout.trim()); }
        catch (e) {
            const isTocar = texto.toLowerCase().includes("tocar");
            intent = { 
                acao: isTocar ? "tocar_mp3.sh" : "baixar_mp3.sh", 
                params: texto.replace(/tocar|baixar/i, "").trim(),
                resposta: "⚙️ Núcleo auxiliar assumindo comando." 
            };
        }

        const script = (intent.acao === "tocar_musica" || intent.acao === "tocar_mp3.sh") ? "tocar_mp3.sh" : "baixar_mp3.sh";
        exec(`bash public/${script} "${intent.params}"`, { env }, (errS, stdoutS) => {
            let resp = { nexus: intent.resposta || "Processado.", log: stdoutS };
            if (stdoutS.includes("OK|")) {
                const arq = stdoutS.split("|")[1].trim();
                resp.url = "/" + encodeURIComponent(arq);
                resp.nexus = `🎶 Sintonizado: ${arq}`;
            }
            res.json(resp);
        });
    });
});

app.listen(PORT, "0.0.0.0", () => console.log(`🚀 NEXUS MASTER ONLINE`));
