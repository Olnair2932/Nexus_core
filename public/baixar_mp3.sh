#!/bin/bash

PEDIDO="$1"

echo "📡 Nexus detector: $PEDIDO"

DESTINO="$(pwd)/public"

mkdir -p "$DESTINO"

TMP=$(mktemp -d)

python3 -m yt_dlp \
  --js-runtimes deno \
  "ytsearch1:$PEDIDO" \
  -x \
  --audio-format mp3 \
  --audio-quality 192K \
  -o "$TMP/%(title)s.%(ext)s"


ARQUIVO=$(find "$TMP" -type f -name "*.mp3" | head -1)


if [ -z "$ARQUIVO" ]; then
    echo "ERRO|arquivo não encontrado"
    rm -rf "$TMP"
    exit 1
fi


NOVO_NOME=$(echo "$PEDIDO" \
| tr '[:upper:]' '[:lower:]' \
| sed 'y/áàãâäéèêëíìîïóòõôöúùûüç/aaaaaeeeeiiiiooooouuuuc/' \
| sed 's/[^a-z0-9 ]//g' \
| tr ' ' '_' )


NOVO_NOME="${NOVO_NOME}.mp3"


mv "$ARQUIVO" "$DESTINO/$NOVO_NOME"


rm -rf "$TMP"


echo "OK|$NOVO_NOME"
