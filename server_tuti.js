require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

// Configuração de Caminhos
const BASE_DIR = path.join(__dirname, "public");
const BIN_DIR = path.join(__dirname, "bin");
const BRAIN_LOG = path.join(BASE_DIR, "nexus_brain.log");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(BASE_DIR));

// Garante que as pastas e arquivos básicos existam
if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });
if (!fs.existsSync(BRAIN_LOG)) fs.writeFileSync(BRAIN_LOG, "");

// --- FUNÇÕES DE SUPORTE ---

function obterBiblioteca() {
    try {
        return fs.readdirSync(BASE_DIR)
            .filter(f => /\.(mp3|webm|m4a)$/i.test(f))
            .join(", ") || "Vazia";
    } catch (e) { return "Erro ao ler biblioteca."; }
}

function obterContexto() {
    try {
        const logs = fs.readFileSync(BRAIN_LOG, "utf8").trim().split("\n");
        return logs.slice(-10).join("\n");
    } catch (e) { return "Sem memória recente."; }
}

async function interpretar(texto) {
    const bib = obterBiblioteca();
    const ctx = obterContexto();
    
    // Prompt refinado para o Nexus Sentinela
    const prompt = `Você é o NEXUS SENTINELA, IA de elite. Analise: "${texto}"
    BIBLIOTECA ATUAL: [${bib}]
    HISTÓRICO: ${ctx}
    
    REGRAS:
    1. Se a música já está na BIBLIOTECA, use acao="tocar_musica".
    2. Se não está, use acao="baixar_musica".
    3. params deve ser o nome exato do arquivo (se tocar) ou nome da música (se baixar).
    Responda apenas JSON puro: {"acao":"baixar_musica|tocar_musica", "params":"", "resposta":"frase curta", "reflexao":"por que escolheu isso"}`;

    try {
        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { timeout: 15000 }
        );

        let raw = res.data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        return JSON.parse(raw);
    } catch (e) {
        console.error("Erro na IA:", e.message);
        // Fallback caso a IA falhe
        return { 
            acao: texto.toLowerCase().includes("tocar") ? "tocar_musica" : "baixar_musica", 
            params: texto.replace(/tocar|baixar/i, "").trim(), 
            resposta: "⚙️ Ativando protocolos de emergência." 
        };
    }
}

// --- ROTAS DA API ---

// Listar arquivos para a aba "BIBLIOTECA"
app.get("/api/arquivos", (req, res) => {
    fs.readdir(BASE_DIR, (err, files) => {
        if (err) return res.status(500).json([]);
        const musicas = files.filter(f => /\.(mp3|webm|m4a)$/i.test(f)).sort();
        res.json(musicas);
    });
});

// Chat e Processamento de Comandos
app.post("/api/chat", async (req, res) => {
    const texto = req.body.texto || "";
    const intent = await interpretar(texto);
    
    // Prepara o ambiente para os binários locais (yt-dlp e ffmpeg)
    const env = { ...process.env, PATH: `${BIN_DIR}:${process.env.PATH}` };

    // Determina qual script rodar
    const script = (intent.acao === "tocar_musica") ? "tocar_mp3.sh" : "baixar_mp3.sh";
    const scriptPath = path.join(BASE_DIR, script);

    console.log(`📡 Executando: ${script} com params: ${intent.params}`);

    // Executa o script Bash
    exec(`bash "${scriptPath}" "${intent.params}"`, { env }, (err, stdout, stderr) => {
        let resp = { 
            nexus: intent.resposta || "Processado.", 
            url: null,
            log: stdout 
        };

        if (err) {
            console.error("Erro no script:", stderr);
            resp.nexus = "⚠️ Falha tática na operação de busca.";
        }

        // Se o script retornar OK|nome_do_arquivo.mp3
        if (stdout.includes("OK|")) {
            const arquivo = stdout.split("|")[1].trim();
            resp.url = "/" + arquivo; // O frontend concatena com a URL base
            resp.nexus = `🎶 [NEXUS] Sintonizado: ${arquivo}`;
        } else if (intent.acao === "baixar_musica" && !err) {
            // Caso o script não retorne OK mas esteja baixando em background (se você mudar o script)
            resp.nexus = "📥 Captura iniciada no banco de dados remoto.";
        }

        // Salva no log para aprendizado futuro (Contexto)
        const logMsg = `[${new Date().toLocaleString()}] USER: ${texto} | NEXUS: ${resp.nexus}\n`;
        fs.appendFileSync(BRAIN_LOG, logMsg);

        res.json(resp);
    });
});

// Inicialização do Servidor
app.listen(PORT, "0.0.0.0", () => {
    console.log(`
    =========================================
    🚀 NEXUS MASTER ONLINE - CORE SYSTEM
    📡 PORTA: ${PORT}
    📂 BASE: ${BASE_DIR}
    🛠️ BINS: ${BIN_DIR}
    =========================================
    `);
});
