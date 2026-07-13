require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const os = require("os");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;
const BASE_DIR = path.join(__dirname, "public");
const BRAIN_LOG = path.join(BASE_DIR, "nexus_brain.log");

app.use(cors()); app.use(express.json()); app.use(express.static(BASE_DIR));

function obterBiblioteca() {
    try {
        return fs.readdirSync(BASE_DIR).filter(f => /\.(mp3|webm|m4a)$/i.test(f)).join(", ");
    } catch (e) { return "Vazia"; }
}

function obterContexto() {
    try {
        if (!fs.existsSync(BRAIN_LOG)) return "Nenhum aprendizado.";
        return fs.readFileSync(BRAIN_LOG, "utf8").trim().split("\n").slice(-10).join("\n");
    } catch (e) { return "Erro memória."; }
}

async function interpretar(texto) {
    const bib = obterBiblioteca();
    const ctx = obterContexto();
    const prompt = `Você é o NEXUS SENTINELA. Analise: "${texto}"
    BIBLIOTECA: [${bib}]
    HISTÓRICO: ${ctx}
    REGRAS: 
    1. Se o pedido JÁ ESTÁ na BIBLIOTECA, use acao="tocar_musica".
    2. Se NÃO ESTÁ, use acao="baixar_musica".
    3.params DEVE ser o nome exato da música solicitada agora, ignore nomes de músicas antigas do histórico.
    Responda em JSON puro: {"acao":"", "params":"", "resposta":"", "reflexao":""}`;

    try {
        const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, 
            { contents: [{ parts: [{ text: prompt }] }] }, { timeout: 15000 });
        let raw = res.data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        return { success: true, data: JSON.parse(raw) };
    } catch (e) { return { success: false }; }
}

app.post("/api/chat", async (req, res) => {
    const texto = req.body.texto || "";
    const intentObj = await interpretar(texto);
    const bin = path.join(__dirname, "bin");
    const env = { ...process.env, PATH: process.env.PATH + ":" + bin };

    let intent = intentObj.success ? intentObj.data : { acao: texto.toLowerCase().includes("tocar") ? "tocar_mp3.sh" : "baixar_mp3.sh", params: texto.replace(/tocar|baixar/i, "").trim(), resposta: "⚙️ Emergência." };

    const script = (intent.acao === "tocar_musica" || intent.acao === "tocar_mp3.sh") ? "tocar_mp3.sh" : "baixar_mp3.sh";
    
    exec(`bash public/${script} "${intent.params}"`, { env }, (err, stdout) => {
        let resp = { nexus: intent.resposta || "Processado.", log: stdout };
        if (stdout.includes("OK|")) {
            const arq = stdout.split("|")[1].trim();
            resp.url = "/" + encodeURIComponent(arq);
            resp.nexus = `🎶 [IA: ${intent.reflexao || "OK"}] Sintonizado: ${arq}`;
        } else if (intent.acao === "baixar_musica") {
            resp.nexus = "📥 Comando de captura enviado ao SoundCloud.";
        }
        
        fs.appendFileSync(BRAIN_LOG, `[${new Date().toLocaleString()}] USER: ${texto} | NEXUS: ${resp.nexus}\n`);
        res.json(resp);
    });
});

app.get("/api/arquivos", (req, res) => {
    fs.readdir(BASE_DIR, (err, files) => {
        res.json(err ? [] : files.filter(f => /\.(mp3|webm|m4a)$/i.test(f)).sort());
    });
});

app.listen(PORT, "0.0.0.0", () => console.log(`🚀 NEXUS MASTER ONLINE`));
