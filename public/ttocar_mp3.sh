#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
BUSCA="${1:-}"

if [ -z "$BUSCA" ]; then echo "ERRO|Vazio"; exit 1; fi

# Limpeza da busca
BUSCA_L=$(echo "$BUSCA" | sed 's/\.mp3//g; s/\.webm//g; s/\.m4a//g' | sed 's/[^a-zA-Z0-9]//g' | tr '[:upper:]' '[:lower:]')

# Procura o arquivo exato ou por parte do nome
ARQUIVO=$(ls "$DIR" | grep -Ei "\.(mp3|webm|m4a)$" | while read f; do
    F_LIMPO=$(echo "$f" | sed 's/[^a-zA-Z0-9]//g' | tr '[:upper:]' '[:lower:]')
    if [[ "$F_LIMPO" == *"$BUSCA_L"* ]]; then
        echo "$f"
        break
    fi
done)

if [ -n "$ARQUIVO" ]; then
    echo "OK|$ARQUIVO"
else
    # REMOVIDO O FALLBACK QUE TOCAVA A MÚSICA ERRADA
    echo "ERRO|Arquivo não localizado no disco."
    exit 1
fi
