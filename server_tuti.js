require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");

const app = express();
const PORT = process.env.PORT || 10000;
const BASE_DIR = path.join(__dirname, "public");
const BRAIN_LOG = path.join(BASE_DIR, "nexus_brain.log");

// Garante que a pasta public existe
if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.static(BASE_DIR));

function obterBiblioteca() {
    try {
        const files = fs.readdirSync(BASE_DIR);
        const musicas = files.filter(f => /\.(mp3|m4a|webm|wav)$/i.test(f));
        return musicas.length > 0 ? musicas.join(", ") : "Vazia";
    } catch (e) {
        return "Erro ao ler biblioteca";
    }
}

async function interpretar(texto) {
    const bib = obterBiblioteca();
    const prompt = `Você é o NEXUS SENTINELA. Responda APENAS JSON puro.
    
    OBJETIVO: Decidir se toca local ou baixa do YouTube.
    COMANDO: "${texto}"
    BIBLIOTECA: ${bib}
    
    REGRAS:
    1. Se a música EXATA ou muito similar estiver na BIBLIOTECA, use "acao":"tocar_musica".
    2. Caso contrário, use "acao":"baixar_musica".
    3. No campo "params", coloque apenas "Artista - Nome da Música".
    4. Nunca adicione gêneros como funk, remix, etc, a menos que solicitado.
    
    RESPOSTA ESPERADA (JSON):
    {
      "acao": "tocar_musica ou baixar_musica",
      "params": "nome da musica",
      "resposta": "frase curta para o usuário",
      "reflexao": "por que tomou essa decisão"
    }`;

    try {
        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { timeout: 12000 }
        );

        let raw = res.data.candidates[0].content.parts[0].text;
        
        // Limpeza de Markdown e lixo de texto
        raw = raw.replace(/```json/gi, "").replace(/```/gi, "").trim();
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start !== -1 && end !== -1) raw = raw.substring(start, end + 1);

        return { success: true, data: JSON.parse(raw) };
    } catch (e) {
        console.error("Erro IA:", e.message);
        return { success: false };
    }
}

app.post("/api/chat", async (req, res) => {
    const texto = req.body.texto || "";
    const intentObj = await interpretar(texto);

    // Lógica de fallback se a IA falhar
    const intent = intentObj.success ? intentObj.data : {
        acao: texto.toLowerCase().includes("tocar") ? "tocar_musica" : "baixar_musica",
        params: texto.replace(/tocar|baixar/gi, "").trim(),
        resposta: "Processando em modo de emergência.",
        reflexao: "IA indisponível."
    };

    const script = intent.acao === "tocar_musica" ? "tocar_mp3.sh" : "baixar_mp3.sh";
    const scriptPath = path.join(BASE_DIR, script);
    const binPath = path.join(__dirname, "bin");

    // Configura o ambiente para encontrar os scripts e binários
    const customEnv = { 
        ...process.env, 
        PATH: `${process.env.PATH}:${binPath}:${BASE_DIR}` 
    };

    execFile("bash", [scriptPath, intent.params], { env: customEnv }, (err, stdout, stderr) => {
        let resp = {
            nexus: intent.resposta,
            log: stdout || stderr
        };

        if (!err && stdout.includes("OK|")) {
            const arq = stdout.split("|")[1].trim();
            resp.url = "/" + encodeURIComponent(arq);
            resp.nexus = `🎶 ${intent.reflexao}\nSintonizado: ${arq}`;
        } else if (intent.acao === "baixar_musica") {
            resp.nexus = "📥 Comando de busca enviado ao YouTube. Verifique a biblioteca em instantes.";
        }

        // Registrar no log do sistema
        try {
            fs.appendFileSync(BRAIN_LOG, `[${new Date().toLocaleString()}] USER: ${texto} | NEXUS: ${resp.nexus}\n`);
        } catch (e) {}

        res.json(resp);
    });
});

// Listar arquivos para o Frontend
app.get("/api/arquivos", (req, res) => {
    fs.readdir(BASE_DIR, (err, files) => {
        if (err) return res.json([]);
        const musicas = files
            .filter(f => /\.(mp3|m4a|webm|wav)$/i.test(f))
            .sort();
        res.json(musicas);
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 NEXUS SENTINELA ONLINE NA PORTA ${PORT}`);
});
