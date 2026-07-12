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

app.use(cors());
app.use(express.json());
app.use(express.static(BASE_DIR));

function obterBiblioteca() {
    try {
        return fs
            .readdirSync(BASE_DIR)
            .filter(f => /\.(mp3|m4a|webm)$/i.test(f))
            .join(", ");
    } catch {
        return "Vazia";
    }
}

function obterContexto() {
    try {
        if (!fs.existsSync(BRAIN_LOG)) return "Nenhum aprendizado.";

        return fs
            .readFileSync(BRAIN_LOG, "utf8")
            .trim()
            .split("\n")
            .slice(-10)
            .join("\n");
    } catch {
        return "Erro de memória.";
    }
}

async function interpretar(texto) {

    const bib = obterBiblioteca();
    const ctx = obterContexto();

    const prompt = `
Você é o NEXUS SENTINELA.

Sua função é interpretar comandos relacionados à reprodução e download de músicas.

==============================
COMANDO DO USUÁRIO
==============================

"${texto}"

==============================
BIBLIOTECA LOCAL
==============================

${bib}

==============================
HISTÓRICO
==============================

${ctx}

==============================
REGRAS
==============================

1.
Se a música existir na biblioteca:

"acao":"tocar_musica"

2.
Caso contrário:

"acao":"baixar_musica"

3.
"params" deve conter SOMENTE o nome da música solicitado.

4.
Nunca adicione palavras automaticamente.

Nunca acrescente:

remix
funk
phonk
slowed
reverb
speed up
sped up
cover
karaoke
live
edit
mashup
8D
bass boosted

5.
Preserve exatamente:

• artista
• título
• idioma

6.
Ignore completamente músicas presentes no histórico.

7.
Quando a ação for baixar_musica, considere que o sistema pesquisará EXCLUSIVAMENTE NO YOUTUBE.

Prioridade de pesquisa:

1. Canal Oficial do Artista
2. Canal Topic
3. Official Audio
4. Official Music Video

Nunca escolha remix, cover ou vídeos de terceiros quando existir uma versão oficial.

8.
Nunca invente artista.

Nunca invente música.

9.
Nunca escreva texto fora do JSON.

Nunca utilize markdown.

Nunca utilize \`\`\`.

10.
Sempre responda exatamente neste formato:

{
 "acao":"",
 "params":"",
 "resposta":"",
 "reflexao":""
}

Exemplo 1

Usuário:
baixar Linkin Park Numb

Resposta:

{
 "acao":"baixar_musica",
 "params":"Linkin Park Numb",
 "resposta":"Vou procurar a versão oficial no YouTube.",
 "reflexao":"Não encontrada na biblioteca."
}

Exemplo 2

Usuário:
tocar Linkin Park Numb

(se existir)

{
 "acao":"tocar_musica",
 "params":"Linkin Park Numb",
 "resposta":"Reproduzindo da biblioteca.",
 "reflexao":"Arquivo encontrado."
}

Responda SOMENTE JSON.
`;

    try {

        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            },
            {
                timeout: 15000
            }
        );

        let raw = res.data.candidates[0].content.parts[0].text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        return {
            success: true,
            data: JSON.parse(raw)
        };

    } catch (e) {

        console.error(e.message);

        return {
            success: false
        };
    }
}

app.post("/api/chat", async (req, res) => {

    const texto = req.body.texto || "";

    const intentObj = await interpretar(texto);

    const bin = path.join(__dirname, "bin");

    const env = {
        ...process.env,
        PATH: process.env.PATH + ":" + bin
    };

    const intent = intentObj.success
        ? intentObj.data
        : {
              acao: texto.toLowerCase().includes("tocar")
                  ? "tocar_musica"
                  : "baixar_musica",
              params: texto.replace(/^(tocar|baixar)\s+/i, "").trim(),
              resposta: "Modo de emergência.",
              reflexao: "Falha na interpretação."
          };

    const script =
        intent.acao === "tocar_musica"
            ? "tocar_mp3.sh"
            : "baixar_mp3.sh";

    execFile(
        "bash",
        [path.join(BASE_DIR, script), intent.params],
        { env },
        (err, stdout, stderr) => {

            let resp = {
                nexus: intent.resposta || "Processado.",
                log: stdout || stderr
            };

            if (!err && stdout.includes("OK|")) {

                const arq = stdout.split("|")[1].trim();

                resp.url = "/" + encodeURIComponent(arq);

                resp.nexus =
                    `🎶 ${intent.reflexao || "Sucesso"}\n` +
                    `Arquivo: ${arq}`;

            } else if (intent.acao === "baixar_musica") {

                resp.nexus =
                    "📥 Procurando a versão oficial da música no YouTube...";
            }

            try {

                fs.appendFileSync(
                    BRAIN_LOG,
                    `[${new Date().toLocaleString()}] USER: ${texto} | NEXUS: ${resp.nexus}\n`
                );

            } catch {}

            res.json(resp);

        }
    );

});

app.get("/api/arquivos", (req, res) => {

    fs.readdir(BASE_DIR, (err, files) => {

        if (err) return res.json([]);

        res.json(
            files
                .filter(f => /\.(mp3|m4a|webm)$/i.test(f))
                .sort()
        );

    });

});

app.listen(PORT, "0.0.0.0", () => {

    console.log(`🚀 NEXUS MASTER ONLINE NA PORTA ${PORT}`);

});
