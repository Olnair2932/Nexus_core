import sys
import os
import json
import subprocess


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)


PROMPT_FILE = os.path.join(
    BASE_DIR,
    "prompt_nlu.txt"
)



def carregar_prompt(texto):

    try:

        with open(
            PROMPT_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            prompt = f.read()

        return prompt.replace(
            "{{TEXTO}}",
            texto
        )


    except Exception:

        return (
            "Retorne apenas JSON válido. "
            "Interprete: "
            + texto
        )




def chamar_gemini(prompt):

    api_key = os.environ.get(
        "GEMINI_API_KEY"
    )


    if not api_key:

        raise Exception(
            "GEMINI_API_KEY ausente"
        )


    url = (
        "https://generativelanguage.googleapis.com/"
        "v1beta/models/gemini-3.1-flash-lite:generateContent"
        f"?key={api_key}"
    )


    payload = {

        "contents":[
            {
                "parts":[
                    {
                        "text":prompt
                    }
                ]
            }
        ],

        "generationConfig":{

            "response_mime_type":
            "application/json"

        }

    }



    resposta = subprocess.check_output(
        [
            "curl",
            "-s",
            "-X",
            "POST",
            url,
            "-H",
            "Content-Type: application/json",
            "-d",
            json.dumps(payload)
        ]
    ).decode(
        "utf-8"
    )


    dados = json.loads(resposta)


    texto = (
        dados["candidates"][0]
        ["content"]
        ["parts"][0]
        ["text"]
    )


    return json.loads(texto)




def fallback(texto):

    t = texto.lower()


    if "tocar" in t:

        acao = "tocar_musica"

    else:

        acao = "conversar"


    return {

        "acao":acao,

        "resposta":
            "Processamento local executado.",

        "params":texto

    }




def nexus_nlu(texto):

    try:

        resultado = chamar_gemini(
            carregar_prompt(texto)
        )


        print(
            json.dumps(
                resultado,
                ensure_ascii=False
            )
        )


    except Exception as erro:


        print(
            json.dumps(
                fallback(texto),
                ensure_ascii=False
            )
        )




if __name__ == "__main__":


    entrada = " ".join(
        sys.argv[1:]
    )


    nexus_nlu(
        entrada
    )
