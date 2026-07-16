#!/bin/bash
set -Eeuo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
BIN="$ROOT/bin"

YTDLP="$BIN/yt-dlp"
FFMPEG="$BIN/ffmpeg"

BUSCA="${*:-}"
if [ -z "$BUSCA" ]; then
    echo "ERRO|Busca vazia"
    exit 1
fi

echo "📡 Nexus buscando sinal: $BUSCA" >&2
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Tentativa com cliente WEB e User-Agent real
baixar() {
    "$YTDLP" \
        "ytsearch1:$BUSCA" \
        --no-playlist \
        --extract-audio \
        --audio-format mp3 \
        --audio-quality 0 \
        --no-check-certificate \
        --ffmpeg-location "$FFMPEG" \
        --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36" \
        --extractor-args "youtube:player_client=web,ios" \
        -o "$TMP/%(title)s.%(ext)s"
}

if ! baixar; then
    echo "⚠️ Falha no sinal principal. Tentando frequência de rádio (TV)..." >&2
    "$YTDLP" "ytsearch1:$BUSCA" \
        --no-playlist --extract-audio --audio-format mp3 \
        --ffmpeg-location "$FFMPEG" \
        --extractor-args "youtube:player_client=tv" \
        -o "$TMP/%(title)s.%(ext)s"
fi

ARQUIVO=$(find "$TMP" -type f \( -name "*.mp3" -o -name "*.m4a" -o -name "*.webm" \) | head -n1)

if [ -z "$ARQUIVO" ]; then
    echo "ERRO|O YouTube bloqueou a requisição do Render (403)."
    exit 1
fi

NOME_ORIGINAL=$(basename "$ARQUIVO")
NOME_LIMPO=$(echo "$NOME_ORIGINAL" | sed 's/[^A-Za-z0-9._-]/_/g' | sed 's/__+/_/g')
NOME_FINAL="${NOME_LIMPO%.*}.mp3"

mv "$ARQUIVO" "$DIR/$NOME_FINAL"
chmod 644 "$DIR/$NOME_FINAL"

echo "OK|$NOME_FINAL"
