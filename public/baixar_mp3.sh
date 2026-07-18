#!/bin/bash

PEDIDO="$1"

echo "📡 Nexus detector: $PEDIDO"

DESTINO="$(pwd)/public"

mkdir -p "$DESTINO"

TMP=$(mktemp -d)


yt-dlp \
  "ytsearch1:$PEDIDO" \
  -f bestaudio \
  -o "$TMP/%(title)s.%(ext)s"


ARQUIVO=$(find "$TMP" -type f | head -1)


if [ -z "$ARQUIVO" ]; then
    echo "ERRO|arquivo não encontrado"
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
