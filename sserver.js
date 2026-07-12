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

app.use(cors());
app.use(express.json());
app.use(express.static(BASE_DIR));

// --- MEMÓRIA E CONTEXTO ---

function obterBiblioteca() {
    try {
        const files = fs.readdirSync(BASE_DIR);
        return files.filter(f => f.endsWith(".mp3") || f.endsWith(".webm") || f.endsWith(".m4a")).join(", ");
    } catch (e) { return "Vazia"; }
}

function obterContexto() {
    try {
        if (!fs.existsSync(BRAIN_LOG)) return "Nenhum aprendizado prévio.";
        const data = fs.readFileSync(BRAIN_LOG, "utf8");
        return data.trim().split("\n").slice(-10).join("\n");
    } catch (e) { return "Erro ao acessar memória."; }
}

function aprender(user, ai, shell) {
    const log = `[${new Date().toLocaleString()}] USUÁRIO: ${user} | NEXUS: ${ai} | STATUS: ${shell}\n`;
    try { fs.appendFileSync(BRAIN_LOG, log); } catch (e) { console.error("Erro log:", e); }
}

// --- INTERPRETADOR NLU ---

async function interpretar(texto) {
    const contexto = obterContexto();
    const biblioteca = obterBiblioteca();
    const modelo = "gemini-1.5-flash"; 

    const prompt = `Você é o NEXUS SENTINELA. Analise o pedido: "${texto}"
    
    BIBLIOTECA ATUAL (Músicas que já temos): [${biblioteca}]
    HISTÓRICO RECENTE:
    ${contexto}

    REGRAS DE DECISÃO:
    1. Se a música já estiver na BIBLIOTECA ATUAL, use "tocar_musica".
    2. Se não estiver, use "baixar_musica".
    3. Para perguntas gerais, use "conversa".

    Responda APENAS JSON puro:
    {
        "acao": "baixar_musica" | "tocar_musica" | "conversa" | "status_sistema",
        "params": "termo limpo",
        "resposta": "sua fala curta",
        "reflexao": "o que aprendeu agora"
    }`;

    try {
        const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${process.env.GEMINI_API_KEY}`, 
            { contents: [{ parts: [{ text: prompt }] }] }, { timeout: 15000 });
        
        let raw = res.data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        return { success: true, data: JSON.parse(raw) };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// --- EXECUTOR DE SCRIPTS ---

function run(scriptName, params) {
    return new Promise((resolve) => {
        const fullPath = path.join(BASE_DIR, scriptName);
        const binPath = path.join(__dirname, "bin");
        const env = { ...process.env, PATH: `${process.env.PATH}:${binPath}` };

        exec(`bash "${fullPath}" "${params}"`, { cwd: BASE_DIR, env }, (err, stdout) => {
            resolve({ success: !err, stdout: stdout?.trim() || "" });
        });
    });
}

// --- ENDPOINTS ---

app.get("/api/arquivos", (req, res) => {
    fs.readdir(BASE_DIR, (err, files) => {
        if (err) return res.json([]);
        res.json(files.filter(f => /\.(mp3|webm|m4a)$/i.test(f)).sort());
    });
});

app.post("/api/chat", async (req, res) => {
    const textoOriginal = req.body.texto || "";
    const intentObj = await interpretar(textoOriginal);
    
    if (!intentObj.success) {
        const acaoManual = textoOriginal.toLowerCase().includes("tocar") ? "tocar_mp3.sh" : "baixar_mp3.sh";
        const paramsManual = textoOriginal.replace(/tocar|baixar/i, "").trim();
        const r = await run(acaoManual, paramsManual);
        return res.json({ nexus: "⚙️ Modo de Emergência Ativado.", url: r.stdout.includes("OK|") ? "/" + encodeURIComponent(r.stdout.split("|")[1]) : null, log: r.stdout });
    }

    const { acao, params, resposta, reflexao } = intentObj.data;
    let resNexus = resposta;
    let logShell = "";
    let url = null;

    if (acao === "tocar_musica" || acao === "baixar_musica") {
        const script = (acao === "tocar_musica") ? "tocar_mp3.sh" : "baixar_mp3.sh";
        const rs = await run(script, params);
        logShell = rs.stdout;
        if (rs.stdout.includes("OK|")) {
            const arquivo = rs.stdout.split("|")[1].trim();
            url = "/" + encodeURIComponent(arquivo);
            resNexus = `🎶 [IA: ${reflexao}] Executando: ${arquivo}`;
        } else {
            resNexus = "❌ Falha ao localizar ou baixar a mídia.";
        }
    } else if (acao === "status_sistema") {
        resNexus = `ONLINE | CPU: ${os.loadavg()[0]} | RAM: ${Math.round(os.freemem()/1024/1024)}MB`;
    }

    aprender(textoOriginal, resNexus, logShell);
    res.json({ nexus: resNexus, log: logShell, url });
});

app.get("/api/download-brain", (req, res) => {
    if (fs.existsSync(BRAIN_LOG)) res.download(BRAIN_LOG);
    else res.status(404).send("Vazio");
});

app.listen(PORT, "0.0.0.0", () => console.log(`🚀 NEXUS MASTER CORE OPERACIONAL NA PORTA ${PORT}`));
