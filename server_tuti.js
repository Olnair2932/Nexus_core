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
const BIN_DIR = path.join(__dirname, "bin");
const BRAIN_LOG = path.join(BASE_DIR, "nexus_brain.log");

app.use(cors());
app.use(express.json());
app.use(express.static(BASE_DIR));

if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });
if (!fs.existsSync(BRAIN_LOG)) fs.writeFileSync(BRAIN_LOG, "");

async function interpretar(texto) {
    const bib = fs.readdirSync(BASE_DIR).filter(f => /\.(mp3|webm|m4a)$/i.test(f)).join(", ") || "Vazia";
    const prompt = `Analise: "${texto}". BIBLIOTECA: [${bib}]. Responda JSON: {"acao":"baixar_musica|tocar_musica", "params":"nome", "resposta":"ok"}`;
    try {
        const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] });
        return JSON.parse(res.data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    } catch (e) { return { acao: "baixar_musica", params: texto, resposta: "Buscando..." }; }
}

app.get("/api/arquivos", (req, res) => {
    fs.readdir(BASE_DIR, (err, files) => res.json(err ? [] : files.filter(f => /\.(mp3|webm|m4a)$/i.test(f)).sort()));
});

app.post("/api/chat", async (req, res) => {
    const texto = req.body.texto || "";
    const intent = await interpretar(texto);
    const env = { ...process.env, PATH: `${BIN_DIR}:${process.env.PATH}` };
    const script = (intent.acao === "tocar_musica") ? "tocar_mp3.sh" : "baixar_mp3.sh";

    exec(`bash "public/${script}" "${intent.params}"`, { env }, (err, stdout) => {
        let resp = { nexus: intent.resposta, url: null };
        if (stdout.includes("OK|")) {
            const arquivo = stdout.split("|")[1].trim();
            resp.url = "/" + arquivo;
            resp.nexus = `🎶 Sintonizado: ${arquivo}`;
        }
        fs.appendFileSync(BRAIN_LOG, `[${new Date().toLocaleString()}] USER: ${texto} | NEXUS: ${resp.nexus}\n`);
        res.json(resp);
    });
});
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 NEXUS MASTER ONLINE NA PORTA ${PORT}`));
