from pathlib import Path

arquivo = Path("public/index.html")

texto = arquivo.read_text(encoding="utf-8")

antigo = """                if(data.url) {

                    document.getElementById('track-info').innerText =
                        data.fonte.toUpperCase() + " : " +
                        decodeURIComponent(data.url).split('/').pop();

                    const p = document.getElementById('nexusPlayer');

                    p.src = data.url;
                    p.load();
                    p.play().catch(()=>{});

                } else if(data.fonte) {
"""

novo = """                if(data.videoId) {

                    document.getElementById('track-info').innerText =
                        "YOUTUBE : " + data.videoId;

                    const audio =
                        document.getElementById('nexusPlayer');

                    audio.pause();
                    audio.style.display = "none";

                    const yt =
                        document.getElementById('youtubePlayer');

                    yt.style.display = "block";

                    if(window.nexusYT) {
                        window.nexusYT.loadVideoById(data.videoId);
                    } else {

                        window.nexusYT =
                            new YT.Player('youtubePlayer', {
                                height: '180',
                                width: '100%',
                                videoId: data.videoId,
                                playerVars: {
                                    autoplay: 1
                                }
                            });

                    }


                } else if(data.url) {

                    const yt =
                        document.getElementById('youtubePlayer');

                    yt.style.display = "none";

                    const audio =
                        document.getElementById('nexusPlayer');

                    audio.style.display = "block";

                    document.getElementById('track-info').innerText =
                        data.fonte.toUpperCase() + " : " +
                        decodeURIComponent(data.url).split('/').pop();

                    audio.src = data.url;
                    audio.load();
                    audio.play().catch(()=>{});

                } else if(data.fonte) {
"""

if antigo not in texto:
    raise SystemExit("Bloco antigo não encontrado")

texto = texto.replace(antigo, novo)

arquivo.write_text(texto, encoding="utf-8")

print("send() atualizado para player duplo")
