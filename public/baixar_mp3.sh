#!/usr/bin/env bash

set -Eeuo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
BIN="$ROOT/bin"

YTDLP="$BIN/yt-dlp"
FFMPEG="$BIN/ffmpeg"

export PATH="$BIN:$PATH"

if [ ! -x "$YTDLP" ]; then
    echo "ERRO|yt-dlp não encontrado."
    exit 1
fi

if [ ! -x "$FFMPEG" ]; then
    echo "ERRO|ffmpeg não encontrado."
    exit 1
fi

BUSCA="${*:-}"

if [ -z "$BUSCA" ]; then
    echo "ERRO|Nenhuma música informada."
    exit 1
fi

# Remove apenas o comando inicial "baixar"
BUSCA="$(echo "$BUSCA" | sed -E 's/^[Bb]aixar[[:space:]]+//' | xargs)"

echo "🔎 Procurando no YouTube: $BUSCA"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

"$YTDLP" \
    "ytsearch1:${BUSCA} official audio" \
    --no-playlist \
    --extract-audio \
    --audio-format mp3 \
    --audio-quality 0 \
    --ffmpeg-location "$BIN" \
    --embed-metadata \
    --embed-thumbnail \
    --add-metadata \
    --no-overwrites \
    --newline \
    --ignore-errors \
    --output "$TMP/%(title)s.%(ext)s"

ARQUIVO="$(find "$TMP" -type f -name '*.mp3' | head -n1)"

if [ -z "$ARQUIVO" ]; then
    echo "ERRO|Nenhum resultado encontrado."
    exit 1
fi

NOME="$(basename "$ARQUIVO")"
DESTINO="$DIR/$NOME"

if [ -f "$DESTINO" ]; then
    echo "OK|$NOME"
    exit 0
fi

mv "$ARQUIVO" "$DESTINO"

echo "OK|$NOME"
exit 0
