#!/bin/bash
set -Eeuo pipefail

# 1. Configuração de Caminhos
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
BIN="$ROOT/bin"
export PATH="$BIN:/usr/local/bin:/usr/bin:$PATH"

YTDLP=$(command -v yt-dlp || echo "$BIN/yt-dlp")
BUSCA_ORIGINAL="${*:-}"

if [ -z "$BUSCA_ORIGINAL" ]; then echo "ERRO|Vazio"; exit 1; fi

# 2. LIMPEZA E FILTRAGEM (Banindo Funk e Remix)
# Removemos a palavra 'baixar' e adicionamos termos de qualidade e exclusão
BUSCA_LIMPA=$(echo "$BUSCA_ORIGINAL" | sed -E 's/^[Bb]aixar[[:space:]]+//' | xargs)
BUSCA_REFRESH="${BUSCA_LIMPA} official audio -funk -remix -set"

echo "📥 Buscando no YouTube (Filtro Anti-Lixo): $BUSCA_REFRESH" >&2

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 3. MODO BYPASS: Simulando cliente iOS para evitar Bloqueio e Throttling
# Usamos player-client=ios que é o mais difícil de o YouTube bloquear no Render
"$YTDLP" \
    "ytsearch1:${BUSCA_REFRESH}" \
    --no-playlist \
    --extract-audio \
    --audio-format mp3 \
    --audio-quality 5 \
    --restrict-filenames \
    --no-check-certificate \
    --user-agent "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1" \
    --extractor-args "youtube:player-client=ios,web" \
    --ffmpeg-location "$BIN/ffmpeg" \
    --output "$TMP/%(title)s.%(ext)s" > /dev/null 2>&1

ARQUIVO="$(find "$TMP" -type f -name '*.mp3' | head -n1)"

if [ -z "$ARQUIVO" ]; then
    echo "ERRO|YouTube bloqueou o servidor ou não achou a versão oficial."
    exit 1
fi

NOME="$(basename "$ARQUIVO")"
mv "$ARQUIVO" "$DIR/$NOME"
chmod 644 "$DIR/$NOME"

# Retorno para o Player
echo "OK|$NOME"
