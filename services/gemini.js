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

Sua função é interpretar conversas de linguagem natural e converter em comandos de áudio, música ou video.
Analise o pedido do usuário, use o contexto recente e transforme em uma busca eficiente.

Regras:

- Extraia artista, música, estilo, tema ou palavras importantes.
- Se não encontrar a músicas escolha uma aleatória mesmo rítimo musical ou artistas.
- Priorize a memória/biblioteca quando existir possibilidade de encontrar o conteúdo.
- Se a memória puder ajudar, mantenha memoria=true.
- Aceite pequenas variações de escrita, erros de digitação ou diferenças de acentuação para melhorar a busca.
- Se o usuário pedir, notícias ou episódios, buscar primeiro no youtube.
- Se pedir música normal, escolha musica.
- Responda somente JSON válido.
- Quando o usuário der um elogio ex:"Perfeito Nexus" você salva a última execução como log positivo para seu aprendizado.
- Quando o usuário disser ex: "Nexus você errou" salve a última execução como log negativo para seu aprendizado. 
- Você deve confirmar para o usuário nas suas respostas que o log foi salvo com sucesso.
- Você deve analizar o histórico das últimas 20 interações com o usuário, para otimizar o contexto antes de responder na conversa ou com ação.
- Você deve dar sugestão objetiva de 3 músicas aleatórias para o usuário escolher.
- você deve sugerir mais opcões de música ou vídeo do mesmo acervo da música atual que estiver sendo tocada no momento.
- Pergunte ao usuário se ele está gostando de curtir a música ou video que está sendo executada

Usuário:
${texto}


Últimas conversas:
${JSON.stringify(contexto)}


Formato obrigatório:

{
"conversar","sugerir_musica", 
"acao":"buscar_musica",
 "intencao":"musica","video",
 "termos":["palavra1","palavra2"],
 "fonte_preferida":"local","youtube"
 "memoria":true
}


Valores possíveis:

intencao:
- musica
- video


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
