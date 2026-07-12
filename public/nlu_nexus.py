import sys, os, json, subprocess
def nexus_nlu(texto):
    api_key = os.environ.get("GEMINI_API_KEY")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    prompt = f"Converta em JSON para NEXUS. Acoes: tocar_musica, baixar_musica. Entrada: {texto}"
    payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"response_mime_type": "application/json"}}
    try:
        res = subprocess.check_output(["curl", "-s", "-X", "POST", url, "-H", "Content-Type: application/json", "-d", json.dumps(payload)]).decode('utf-8')
        print(json.loads(res)['candidates'][0]['content']['parts'][0]['text'].strip())
    except:
        acao = "tocar_musica" if "tocar" in texto.lower() else "baixar_musica"
        print(json.dumps({"acao": acao, "params": texto}))
if __name__ == "__main__":
    nexus_nlu(" ".join(sys.argv[1:]))
