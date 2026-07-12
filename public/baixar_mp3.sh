#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
BIN_DIR="$(cd "$DIR/../bin" && pwd)"
export PATH="$BIN_DIR:$PATH"

BUSCA="${1:-musica}"
# Limpa a busca e remove termos de download
BUSCA_L=$(echo "$BUSCA" | sed 's/^[Bb]aixar //i' | sed 's/[^a-zA-Z0-9 ]//g' | xargs)

echo "📥 Buscando especificamente por: $BUSCA_L"

# Adicionamos "oficial" ou "original" na busca interna para evitar remixes de funk
# Usamos --match-title para tentar filtrar lixo (opcional)
yt-dlp \
    -x --audio-format mp3 --audio-quality 0 \
    --no-check-certificate --restrict-filenames \
    --ffmpeg-location "$BIN_DIR/ffmpeg" \
    --default-search "scsearch1" \
    --output "$DIR/%(title)s.%(ext)s" \
    "scsearch1:$BUSCA_L original audio"

# VERIFICAÇÃO REAL: Só aceita se o arquivo foi criado nos últimos 60 segundos
# Isso impede de tocar a música errada se o download falhar
ARQUIVO=$(find "$DIR" -maxdepth 1 -name "*.mp3" -mmin -1 | head -n 1)

if [ -n "$ARQUIVO" ]; then
    echo "OK|$(basename "$ARQUIVO")"
else
    echo "❌ Erro: Não foi possível encontrar a versão original desta música."
    exit 1
fi
