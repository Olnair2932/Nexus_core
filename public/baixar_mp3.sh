#!/bin/bash
set -Eeuo pipefail

# ==============================
# CONFIGURAÇÃO
# ==============================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
BIN="$ROOT/bin"

export PATH="$BIN:/usr/local/bin:/usr/bin:$PATH"

YTDLP="$(command -v yt-dlp || echo "$BIN/yt-dlp")"
FFMPEG="$(command -v ffmpeg || echo "$BIN/ffmpeg")"

BUSCA_ORIGINAL="${*:-}"

if [ -z "$BUSCA_ORIGINAL" ]; then
    echo "ERRO|Busca vazia"
    exit 1
fi


# ==============================
# GEMINI 3.1 FLASH-LITE
# ==============================

BUSCA_REFRESH=""

if [ -n "${GEMINI_API_KEY:-}" ]; then

PROMPT="Identifique a música pesquisada.
Retorne somente artista e nome da música.
Não adicione explicações.
Não adicione palavras como remix, live, set ou official.

Pesquisa:
$BUSCA_ORIGINAL"


PAYLOAD=$(python3 - <<PY
import json
print(json.dumps({
 "contents":[
  {
   "parts":[
    {
     "text": "$PROMPT"
    }
   ]
  }
 ],
 "generationConfig":{
  "temperature":0.1,
  "maxOutputTokens":80
 }
}))
PY
)


RESPONSE=$(curl -s \
-X POST \
"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}" \
-H "Content-Type: application/json" \
-d "$PAYLOAD" || true)


IA_SUGGESTION=$(echo "$RESPONSE" | python3 -c '
import sys,json
try:
    print(
    json.load(sys.stdin)
    ["candidates"][0]
    ["content"]
    ["parts"][0]
    ["text"]
    .strip()
    )
except:
    pass
' 2>/dev/null || true)


if [ -n "$IA_SUGGESTION" ]; then
    BUSCA_REFRESH="$IA_SUGGESTION"
fi


fi


# ==============================
# FALLBACK
# ==============================

if [ -z "$BUSCA_REFRESH" ]; then

    BUSCA_REFRESH=$(echo "$BUSCA_ORIGINAL" |
    sed -E 's/^[Bb]aixar[[:space:]]+//' |
    sed -E 's/[Mm][Pp]3//g' |
    xargs)

fi


echo "📥 Buscando: $BUSCA_REFRESH" >&2


# ==============================
# DOWNLOAD MP3
# ==============================

TMP="$(mktemp -d)"

trap 'rm -rf "$TMP"' EXIT


"$YTDLP" \
"ytsearch1:$BUSCA_REFRESH" \
--no-playlist \
--extract-audio \
--audio-format mp3 \
--audio-quality 0 \
--embed-metadata \
--restrict-filenames \
--no-check-certificate \
--ffmpeg-location "$FFMPEG" \
--output "$TMP/%(title)s.%(ext)s"


ARQUIVO="$(find "$TMP" -type f -name "*.mp3" | head -n1)"


if [ -z "$ARQUIVO" ]; then
    echo "ERRO|Música não encontrada ou bloqueada."
    exit 1
fi


NOME="$(basename "$ARQUIVO")"

mv "$ARQUIVO" "$DIR/$NOME"

chmod 644 "$DIR/$NOME"


echo "OK|$NOME"
