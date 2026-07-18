#!/bin/bash

PEDIDO="$1"

echo "📡 Nexus detector: $PEDIDO"

DESTINO="$(pwd)"
TMP=$(mktemp -d)

yt-dlp \
  --js-runtimes deno \
  --extractor-args "youtube:player_client=android" \
  --no-playlist \
  "$PEDIDO" \
  -f "bestaudio/best" \
  -o "$TMP/%(title)s.%(ext)s" \
  2>&1

STATUS=$?

if [ $STATUS -ne 0 ]; then
    echo "ERRO|yt-dlp falhou"
    rm -rf "$TMP"
    exit 1
fi

ARQUIVO=$(find "$TMP" -type f | head -1)

if [ -z "$ARQUIVO" ]; then
    echo "ERRO|yt-dlp não conseguiu criar arquivo"
    rm -rf "$TMP"
    exit 1
fi

EXT="${ARQUIVO##*.}"

NOVO_NOME=$(echo "$PEDIDO" \
| tr '[:upper:]' '[:lower:]' \
| sed 'y/áàãâäéèêëíìîïóòõôöúùûüç/aaaaaeeeeiiiiooooouuuuc/' \
| sed 's/[^a-z0-9 ]//g' \
| tr ' ' '_' )

NOVO_NOME="${NOVO_NOME}.${EXT}"

mv "$ARQUIVO" "$DESTINO/$NOVO_NOME"

rm -rf "$TMP"

echo "OK|$NOVO_NOME"
