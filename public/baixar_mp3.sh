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

"$YTDLP" \
"ytsearch1:$BUSCA" \
--no-playlist \
--extract-audio \
--audio-format mp3 \
--audio-quality 0 \
--format "bestaudio/best" \
--extractor-args "youtube:player_client=android" \
--restrict-filenames \
--no-check-certificate \
--ffmpeg-location "$FFMPEG" \
-o "$TMP/%(title)s.%(ext)s"

}



if ! baixar ; then

echo "⚠️ Tentando modo alternativo..." >&2


"$YTDLP" \
"ytsearch1:$BUSCA" \
--no-playlist \
--extract-audio \
--audio-format mp3 \
--audio-quality 0 \
--format "worstaudio/worst" \
--restrict-filenames \
--no-check-certificate \
--ffmpeg-location "$FFMPEG" \
-o "$TMP/%(title)s.%(ext)s"


fi



ARQUIVO=$(find "$TMP" -type f \( -name "*.mp3" -o -name "*.m4a" -o -name "*.webm" \) | head -n1)


if [ -z "$ARQUIVO" ]; then

echo "ERRO|Arquivo não encontrado"

exit 1

fi



NOME=$(basename "$ARQUIVO")


mv "$ARQUIVO" "$DIR/$NOME"



chmod 644 "$DIR/$NOME"



echo "OK|$NOME"
