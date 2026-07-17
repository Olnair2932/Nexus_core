#!/bin/bash
set -Eeuo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
YTDLP="$ROOT/bin/yt-dlp"

BUSCA="${*:-}"

if [ -z "$BUSCA" ]; then
    echo "ERRO|Busca vazia"
    exit 1
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "📡 Nexus detector: $BUSCA" >&2

"$YTDLP" \
"ytsearch1:$BUSCA" \
--no-playlist \
-f "bestaudio/best" \
--no-check-certificate \
-o "$TMP/%(title)s.%(ext)s"

ARQ=$(find "$TMP" -type f | head -n1)

if [ -z "$ARQ" ]; then
    echo "ERRO|Arquivo não encontrado"
    exit 1
fi

NOME=$(basename "$ARQ")
LIMPO=$(echo "$NOME" | sed 's/[^A-Za-z0-9._-]/_/g')

if command -v ffmpeg >/dev/null; then

    SAIDA="${LIMPO%.*}.mp3"

    ffmpeg -y \
    -i "$ARQ" \
    -vn \
    -codec:a libmp3lame \
    "$DIR/$SAIDA" >/dev/null 2>&1

    chmod 644 "$DIR/$SAIDA"

    echo "OK|$SAIDA"

else

    mv "$ARQ" "$DIR/$LIMPO"
    chmod 644 "$DIR/$LIMPO"

    echo "OK|$LIMPO"

fi
