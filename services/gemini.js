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

Sua função é interpretar comandos de áudio e música.
Analise o pedido do usuário, use o contexto recente e transforme em uma busca eficiente.

Regras:

- Extraia artista, música, estilo, tema ou palavras importantes.
- Não invente músicas.
- Se o usuário pedir podcast, notícias ou episódios, defina intencao como podcast.
- Se pedir música normal, escolha musica.
- Se a memória puder ajudar, mantenha memoria=true.
- Responda somente JSON válido.

Usuário:
${texto}


Últimas conversas:
${JSON.stringify(contexto)}


Formato obrigatório:

{
 "acao":"buscar_musica",
 "intencao":"musica",
 "termos":["palavra1","palavra2"],
 "fonte_preferida":"local",
 "memoria":true
}


Valores possíveis:

intencao:
- musica
- podcast


fonte_preferida:
- local
- archive
- podcast
- youtube
- qualquer


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
