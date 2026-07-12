#!/usr/bin/env bash
set -Eeuo pipefail

# 1. Configuração de Caminhos
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
BIN="$ROOT/bin"

# Tenta usar o binário local do Build, senão o global
export PATH="$BIN:/usr/local/bin:/usr/bin:$PATH"

YTDLP=$(command -v yt-dlp || echo "$BIN/yt-dlp")

if [ ! -x "$YTDLP" ]; then echo "ERRO|yt-dlp não encontrado."; exit 1; fi

BUSCA="${*:-}"
if [ -z "$BUSCA" ]; then echo "ERRO|Nenhuma música informada."; exit 1; fi

# 2. Limpeza da busca e adição de filtro anti-funk/remix
# Adicionamos "original audio" para garantir a versão oficial
BUSCA="$(echo "$BUSCA" | sed -E 's/^[Bb]aixar[[:space:]]+//' | xargs) original audio"

echo "📥 Buscando mídia segura: $BUSCA" >&2

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 3. DOWNLOAD (Uso do scsearch para evitar bloqueios de IP no Render)
"$YTDLP" \
    "scsearch1:${BUSCA}" \
    --no-playlist \
    --extract-audio \
    --audio-format mp3 \
    --audio-quality 0 \
    --restrict-filenames \
    --no-overwrites \
    --no-check-certificate \
    --output "$TMP/%(title)s.%(ext)s" > /dev/null 2>&1

ARQUIVO="$(find "$TMP" -type f -name '*.mp3' | head -n1)"

if [ -z "$ARQUIVO" ]; then
    echo "ERRO|Música oficial não localizada no SoundCloud."
    exit 1
fi

NOME="$(basename "$ARQUIVO")"
DESTINO="$DIR/$NOME"

# 4. Finalização
mv "$ARQUIVO" "$DESTINO"
chmod 644 "$DESTINO"

# Retorna APENAS o OK para o Node.js processar o player
echo "OK|$NOME"
