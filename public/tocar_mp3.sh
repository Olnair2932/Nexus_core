#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
BUSCA="${1:-}"
BUSCA_L=$(echo "$BUSCA" | sed 's/\.mp3//g; s/\.webm//g' | sed 's/[^a-zA-Z0-9]//g' | tr '[:upper:]' '[:lower:]')
ARQUIVO=$(ls "$DIR" | grep -Ei "\.(mp3|webm|m4a)$" | while read f; do
    F_LIMPO=$(echo "$f" | sed 's/[^a-zA-Z0-9]//g' | tr '[:upper:]' '[:lower:]')
    if [[ "$F_LIMPO" == *"$BUSCA_L"* ]]; then echo "$f"; break; fi
done)
if [ -n "$ARQUIVO" ]; then echo "OK|$ARQUIVO"; else echo "ERRO|Nao encontrado"; fi
