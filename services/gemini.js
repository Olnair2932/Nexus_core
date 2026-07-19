const axios = require("axios");

const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";


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

Sua função é interpretar pedidos de música.
Converta linguagem natural em intenção de busca.

Usuário:
${texto}

Últimas conversas:
${JSON.stringify(contexto)}

Responda somente JSON válido neste formato:

{
 "acao":"buscar_musica",
 "termos":["palavras importantes"],
 "memoria":true
}
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


        if (!saida) return null;


        const limpo =
            saida
            .replace(/```json/g,"")
            .replace(/```/g,"")
            .trim();


        return JSON.parse(limpo);


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
