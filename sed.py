from pathlib import Path

arquivo = Path("public/index.html")

texto = arquivo.read_text(encoding="utf-8")

# adiciona API do YouTube antes do fechamento do head
marcador = "</head>"

youtube_api = """
<script src="https://www.youtube.com/iframe_api"></script>
"""

if youtube_api.strip() not in texto:
    texto = texto.replace(marcador, youtube_api + "\n" + marcador)


# adiciona container do player youtube após o player de audio
marcador_player = '<audio id="nexusPlayer" controls style="width:100%;height:30px"></audio>'

youtube_box = """
<div id="youtubePlayer" style="display:none;width:100%;height:180px;"></div>
"""

if youtube_box.strip() not in texto:
    texto = texto.replace(
        marcador_player,
        marcador_player + youtube_box
    )


arquivo.write_text(texto, encoding="utf-8")

print("index.html atualizado com suporte inicial YouTube")
