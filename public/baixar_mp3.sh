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

echo "📡 Nexus detector: $BUSCA" >&2

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT


baixar() {
    CLIENTE="$1"

    echo "🔄 Cliente: $CLIENTE" >&2

    "$YTDLP" \
    "ytsearch1:$BUSCA" \
    --no-playlist \
    --extractor-args "youtube:player_client=$CLIENTE" \
    -f "bestaudio/best[ext=m4a]/best[ext=webm]/best" \
    --no-check-certificate \
    -o "$TMP/%(title)s.%(ext)s"
}


SUCESSO=0

for C in android web ios; do
    if baixar "$C"; then
        ARQ=$(find "$TMP" -type f | head -n1)

        if [ -n "$ARQ" ]; then
            SUCESSO=1
            break
        fi
    fi
done


if [ "$SUCESSO" = "0" ]; then
    echo "ERRO|Nenhum formato compatível encontrado"
    exit 1
fi


NOME=$(basename "$ARQ")

LIMPO=$(echo "$NOME" | sed 's/[^A-Za-z0-9._-]/_/g')

mv "$ARQ" "$DIR/$LIMPO"

chmod 644 "$DIR/$LIMPO"

echo "OK|$LIMPO"
