#!/bin/bash
set -Eeuo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
BIN="$ROOT/bin"
export PATH="$BIN:/usr/local/bin:/usr/bin:$PATH"

YTDLP="$(command -v yt-dlp || echo "$BIN/yt-dlp")"
FFMPEG="$(command -v ffmpeg || echo "$BIN/ffmpeg")"

BUSCA="${*:-}"
if [ -z "$BUSCA" ]; then
    echo "ERRO|Busca vazia"
    exit 1
fi

echo "📥 Buscando: $BUSCA" >&2
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

baixar(){
    # Usando iOS e Web como clientes para evitar detecção de bot no Render
    "$YTDLP" \
    "ytsearch1:$BUSCA audio" \
    --no-playlist \
    --extract-audio \
    --audio-format mp3 \
    --audio-quality 0 \
    --format "bestaudio/best" \
    --extractor-args "youtube:player_client=ios,web_embedded" \
    --no-check-certificate \
    --ffmpeg-location "$FFMPEG" \
    --no-cache-dir \
    -o "$TMP/%(title)s.%(ext)s"
}

if ! baixar ; then
    echo "⚠️ Modo alternativo (MWeb)..." >&2
    "$YTDLP" \
    "ytsearch1:$BUSCA" \
    --no-playlist \
    --extract-audio \
    --audio-format mp3 \
    --audio-quality 0 \
    --extractor-args "youtube:player_client=mweb" \
    --ffmpeg-location "$FFMPEG" \
    -o "$TMP/%(title)s.%(ext)s"
fi

ARQUIVO=$(find "$TMP" -type f \( -name "*.mp3" -o -name "*.m4a" -o -name "*.webm" \) | head -n1)

if [ -z "$ARQUIVO" ]; then
    echo "ERRO|O YouTube bloqueou a requisição do Render."
    exit 1
fi

NOME=$(basename "$ARQUIVO" | sed 's/\.[^.]*$//').mp3
mv "$ARQUIVO" "$DIR/$NOME"
chmod 644 "$DIR/$NOME"

echo "OK|$NOME"
