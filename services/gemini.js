const axios = require("axios");

const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";



async function interpretar(texto, contexto = []) {


    const chave =
        process.env.GEMINI_API_KEY;



    if (!chave) {

        console.log(
            "Gemini API não configurada"
        );

        return null;

    }



    try {


        const prompt = `
Você é o cérebro auxiliar do NEXUS CORE.

Sua função é interpretar o usuário antes de executar qualquer ação.

Classifique a intenção:

- conversa: saudações, perguntas sobre o Nexus ou interação normal.
- musica: pedido de música, cantor, banda ou áudio.
- video: pedido de vídeo, trailer, canal ou conteúdo visual.
- sugestao: pedido de recomendações.

REGRAS:

- Nunca faça busca de música quando o usuário estiver apenas conversando.
- Para "Olá Nexus", "Oi", "Bom dia", "Tudo bem?" responda como conversa.
- Só use buscar_musica quando existir um pedido real de música.
- Se não encontrar exatamente uma música, informe e ofereça alternativas.
- Responda somente JSON válido.

Formato obrigatório:

{
 "intencao":"conversa|musica|video|sugestao",
 "acao":"nenhuma|buscar_musica|buscar_video",
 "resposta":"mensagem curta para o usuário",
 "termos":[],
 "fonte_preferida":"local|youtube|qualquer",
 "memoria":false
}

Usuário:
${texto}

Últimas conversas:
${JSON.stringify(contexto)}
`;




        const resposta =
            await axios.post(
                `${API_URL}?key=${chave}`,
                {
                    contents:[
                        {
                            parts:[
                                {
                                    text:prompt
                                }
                            ]
                        }
                    ]
                },
                {
                    timeout:15000
                }
            );



        const saida =
            resposta.data
            ?.candidates?.[0]
            ?.content?.parts?.[0]
            ?.text;



        if (!saida) {

            return null;

        }



        const limpo =
            saida
            .replace(/```json/g,"")
            .replace(/```/g,"")
            .trim();



        const json =
            JSON.parse(limpo);



        if (!Array.isArray(json.termos)) {

            json.termos = [];

        }



        return json;



    } catch(erro) {


        console.log(
            "Gemini erro:",
            erro.message
        );


        return null;

    }


}



module.exports = {

    interpretar

};
