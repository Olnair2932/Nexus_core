#!/bin/bash
set -Eeuo pipefail

# ==================================
# NEXUS MASTER - DOWNLOADER MP3
# ==================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
BIN="$ROOT/bin"

export PATH="$BIN:/usr/local/bin:/usr/bin:$PATH"

YTDLP="$(command -v yt-dlp || echo "$BIN/yt-dlp")"
FFMPEG="$(command -v ffmpeg || echo "$BIN/ffmpeg")"


# ==================================
# RECEBE COMANDO
# ==================================

BUSCA_ORIGINAL="${*:-}"

if [ -z "$BUSCA_ORIGINAL" ]; then
    echo "ERRO|Busca vazia"
    exit 1
fi


BUSCA_FINAL="$BUSCA_ORIGINAL"



# ==================================
# GEMINI - ORGANIZA BUSCA
# ==================================

if [ -n "${GEMINI_API_KEY:-}" ]; then

PROMPT="Identifique a música.

Retorne somente:
Artista - Nome da música

Não use:
remix
live
official
set
explicações

Pesquisa:
$BUSCA_ORIGINAL"


PAYLOAD=$(python3 -c '
import json
import sys

print(json.dumps({
    "contents":[
        {
            "parts":[
                {
                    "text":sys.argv[1]
                }
            ]
        }
    ],
    "generationConfig":{
        "temperature":0.1,
        "maxOutputTokens":80
    }
}))
' "$PROMPT")



RESPOSTA=$(curl -s \
-X POST \
"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}" \
-H "Content-Type: application/json" \
-d "$PAYLOAD" || true)



SUGESTAO=$(echo "$RESPOSTA" | python3 -c '
import json,sys

try:
    r=json.load(sys.stdin)
    print(
        r["candidates"][0]
        ["content"]
        ["parts"][0]
        ["text"]
        .strip()
    )
except:
    pass
' 2>/dev/null || true)



if [ -n "$SUGESTAO" ]; then
    BUSCA_FINAL="$SUGESTAO"
fi


fi



# ==================================
# LIMPEZA
# ==================================

BUSCA_FINAL=$(echo "$BUSCA_FINAL" |
sed -E 's/^[Bb]aixar[[:space:]]+//' |
sed -E 's/[Mm][Pp]3//g' |
xargs)



echo "📥 Buscando: $BUSCA_FINAL" >&2



# ==================================
# DOWNLOAD
# ==================================

TMP="$(mktemp -d)"

trap 'rm -rf "$TMP"' EXIT



"$YTDLP" \
"ytsearch1:$BUSCA_FINAL" \
--no-playlist \
--extract-audio \
--audio-format mp3 \
--audio-quality 192K \
--embed-metadata \
--restrict-filenames \
--no-check-certificate \
--ffmpeg-location "$FFMPEG" \
-o "$TMP/%(title)s.%(ext)s"



# ==================================
# LOCALIZA ARQUIVO
# ==================================

ARQUIVO=$(find "$TMP" -type f | grep -E "\.(mp3|webm|m4a|opus)$" | head -n1 || true)



if [ -z "$ARQUIVO" ]; then
    echo "ERRO|Arquivo não encontrado após download"
    exit 1
fi



# ==================================
# CONVERTE PARA MP3
# ==================================

EXT="${ARQUIVO##*.}"


if [ "$EXT" != "mp3" ]; then

    CONVERTIDO="$TMP/audio_convertido.mp3"

    "$FFMPEG" \
    -y \
    -i "$ARQUIVO" \
    -vn \
    -codec:a libmp3lame \
    -q:a 2 \
    "$CONVERTIDO"

    ARQUIVO="$CONVERTIDO"

fi



# ==================================
# MOVE PARA BIBLIOTECA
# ==================================

NOME=$(basename "$ARQUIVO")


mv "$ARQUIVO" "$DIR/$NOME"


chmod 644 "$DIR/$NOME"



echo "OK|$NOME"
