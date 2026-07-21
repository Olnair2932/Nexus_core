#!/bin/bash

DIR="$(cd "$(dirname "$0")" && pwd)"
BUSCA="${1:-}"

if [ -z "$BUSCA" ]; then
    echo "ERRO|Busca vazia"
    exit 1
fi

BUSCA_L=$(echo "$BUSCA" \
| sed 's/\.[a-zA-Z0-9]*//g' \
| sed 's/[^a-zA-Z0-9]//g' \
| tr '[:upper:]' '[:lower:]')

ARQUIVO=$(find "$DIR" -maxdepth 1 -type f \
\( -iname "*.mp3" -o -iname "*.mp4" -o -iname "*.webm" -o -iname "*.m4a" -o -iname "*.ogg" \) \
| while read f; do

    NOME=$(basename "$f")

    NOME_L=$(echo "$NOME" \
    | sed 's/\.[a-zA-Z0-9]*//g' \
    | sed 's/[^a-zA-Z0-9]//g' \
    | tr '[:upper:]' '[:lower:]')

    if [[ "$NOME_L" == *"$BUSCA_L"* ]]; then
        echo "$NOME"
        break
    fi

done)

if [ -n "$ARQUIVO" ]; then
    echo "OK|$ARQUIVO"
else
    echo "ERRO|Arquivo não localizado."
    exit 1
fi
