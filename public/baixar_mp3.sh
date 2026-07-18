#!/bin/bash

PEDIDO="$1"

if [[ "$PEDIDO" =~ ^[a-zA-Z0-9_-]{11}$ ]]; then
    PEDIDO="https://www.youtube.com/watch?v=$PEDIDO"
fi

echo "📡 Nexus detector: $PEDIDO"

DESTINO="$(cd "$(dirname "$0")" && pwd)"
TMP="$DESTINO/tmp_download"

mkdir -p "$TMP"

URL="$PEDIDO"

COOKIES=""

if [ -n "$YOUTUBE_COOKIES" ]; then
    printf "%s\n" "$YOUTUBE_COOKIES" > "$DESTINO/cookies.txt"
fi

if [ -f "$DESTINO/cookies.txt" ]; then
    COOKIES="--cookies $DESTINO/cookies.txt"
    echo "🍪 Cookies YouTube encontrados"
else
    echo "⚠️ Sem cookies YouTube"
fi

yt-dlp \
  --js-runtimes deno \
  --extractor-args "youtube:player_client=web" \
  $COOKIES \
  --no-playlist \
  -x \
  --audio-format mp3 \
  --audio-quality 0 \
  -o "$TMP/%(title)s.%(ext)s" \
  "$URL"

if [ $? -eq 0 ]; then

    ARQUIVO=$(find "$TMP" -type f -name "*.mp3" | head -n 1)

    if [ -n "$ARQUIVO" ]; then

        NOME=$(basename "$ARQUIVO")

        cp "$ARQUIVO" "$DESTINO/$NOME"

        echo "OK|$NOME"

    else

        echo "ERRO|mp3 não encontrado"
        exit 1

    fi

else

    echo "ERRO|yt-dlp falhou"
    exit 1

fi
