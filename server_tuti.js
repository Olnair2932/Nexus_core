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

app.use(cors()); app.use(express.json()); app.use(express.static(BASE_DIR));

async function interpretar(texto) {
    const modelo = "gemini-1.5-flash";
    const biblioteca = fs.readdirSync(BASE_DIR).filter(f => f.endsWith(".mp3")).join(", ");

    const prompt = `Você é o NEXUS SENTINELA. 
    DICA: O usuário prefere versões ORIGINAIS e OFICIAIS. Evite remixes ou funk.
    BIBLIOTECA ATUAL: [${biblioteca}]
    
    Analise: "${texto}"
    REGRAS:
    1. Se a música está na BIBLIOTECA, use "tocar_musica".
    2. Se não está, use "baixar_musica". 
    3. Em "params", SEMPRE inclua o ARTISTA + NOME DA MÚSICA para a busca ser precisa.
    
    Responda em JSON: {"acao":"", "params":"", "resposta":"", "reflexao":""}`;

    try {
        const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${process.env.GEMINI_API_KEY}`, 
            { contents: [{ parts: [{ text: prompt }] }] });
        let raw = res.data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        return JSON.parse(raw);
    } catch (e) { return null; }
}

app.post("/api/chat", async (req, res) => {
    const { texto } = req.body;
    const bin = path.join(__dirname, "bin");
    const env = { ...process.env, PATH: process.env.PATH + ":" + bin };

    const intent = await interpretar(texto);
    
    if (!intent) {
        return res.json({ nexus: "⚙️ Núcleo em modo manual. Tente ser mais específico." });
    }

    const script = (intent.acao === "tocar_musica") ? "tocar_mp3.sh" : "baixar_mp3.sh";
    
    exec(`bash public/${script} "${intent.params}"`, { env }, (err, stdout) => {
        if (stdout.includes("OK|")) {
            const arq = stdout.split("|")[1].trim();
            res.json({ nexus: `🎶 Sintonizando: ${arq}`, url: "/" + encodeURIComponent(arq), log: stdout });
        } else {
            res.json({ nexus: "❌ Não encontramos uma versão oficial estável.", log: stdout });
        }
    });
});

app.get("/api/arquivos", (req, res) => {
    fs.readdir(BASE_DIR, (err, files) => {
        res.json(files.filter(f => f.toLowerCase().endsWith(".mp3")).sort());
    });
});

app.listen(PORT, "0.0.0.0", () => console.log(`🚀 NEXUS MASTER ONLINE`));
