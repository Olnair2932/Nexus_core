#!/usr/bin/env bash
set -Eeuo pipefail

DEBUG="${DEBUG:-0}"

log() {
    printf '[INFO] %s\n' "$*" >&2
}

debug() {
    [ "$DEBUG" = "1" ] && printf '[DEBUG] %s\n' "$*" >&2
}

erro() {
    printf '\n[ERRO] Linha %s\n' "${BASH_LINENO[0]}" >&2
    printf '[ERRO] Comando: %s\n' "$BASH_COMMAND" >&2
}

trap erro ERR

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
BIN="$ROOT/bin"

export PATH="$BIN:/usr/local/bin:/usr/bin:$PATH"

YTDLP="$(command -v yt-dlp || true)"
FFMPEG="$(command -v ffmpeg || true)"

if [ -z "$YTDLP" ]; then
    echo "ERRO|yt-dlp não encontrado"
    exit 1
fi

if [ -z "$FFMPEG" ]; then
    echo "ERRO|ffmpeg não encontrado"
    exit 1
fi

debug "yt-dlp=$YTDLP"
debug "ffmpeg=$FFMPEG"

BUSCA_ORIGINAL="${*:-}"

if [ -z "$BUSCA_ORIGINAL" ]; then
    echo "ERRO|Busca vazia"
    exit 1
fi

BUSCA="$BUSCA_ORIGINAL"

if [ -n "${GEMINI_API_KEY:-}" ]; then

    log "Consultando Gemini..."

    PROMPT="Identifique a música.
Retorne somente artista e nome da música.

Pesquisa:
$BUSCA_ORIGINAL"

    PAYLOAD=$(python3 <<PY
import json
print(json.dumps({
"contents":[{
"parts":[{
"text":"""$PROMPT"""
}]
}],
"generationConfig":{
"temperature":0,
"maxOutputTokens":60
}
}))
PY
)

    RESPONSE=$(curl \
        --silent \
        --connect-timeout 5 \
        --max-time 15 \
        -X POST \
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" || true)

    NOVA_BUSCA=$(echo "$RESPONSE" | python3 -c '
import sys,json
try:
 print(json.load(sys.stdin)["candidates"][0]["content"]["parts"][0]["text"].strip())
except:
 pass
')

    if [ -n "$NOVA_BUSCA" ]; then
        BUSCA="$NOVA_BUSCA"
    fi
fi

BUSCA=$(echo "$BUSCA" \
| sed -E 's/^[Bb]aixar[[:space:]]+//' \
| sed -E 's/[Mm][Pp]3//g' \
| xargs)

log "Buscando: $BUSCA"

TMP=$(mktemp -d)

trap 'rm -rf "$TMP"' EXIT

"$YTDLP" \
    -v \
    --progress \
    --newline \
    "ytsearch1:$BUSCA" \
    --no-playlist \
    --extract-audio \
    --audio-format mp3 \
    --audio-quality 0 \
    --embed-metadata \
    --restrict-filenames \
    --ffmpeg-location "$(dirname "$FFMPEG")" \
    --output "$TMP/%(title)s.%(ext)s"

ARQUIVO=$(find "$TMP" -type f -name "*.mp3" | head -n1)

if [ -z "$ARQUIVO" ]; then
    echo "ERRO|MP3 não gerado"
    exit 1
fi

mv "$ARQUIVO" "$DIR/"

chmod 644 "$DIR/$(basename "$ARQUIVO")"

echo "OK|$(basename "$ARQUIVO")"
