#!/bin/bash

PEDIDO="$1"

if [[ "$PEDIDO" =~ ^[a-zA-Z0-9_-]{11}$ ]]; then
    PEDIDO="https://www.youtube.com/watch?v=$PEDIDO"
fi

echo "📡 Nexus detector: $PEDIDO"

DESTINO="$(pwd)"
TMP="$(pwd)/tmp_download"
mkdir -p "$TMP"

