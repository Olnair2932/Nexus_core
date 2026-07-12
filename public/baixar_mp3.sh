#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
BIN_DIR="$(cd "$DIR/../bin" && pwd)"
export PATH="$BIN_DIR:$PATH"
BUSCA="${1:-}"
LIMPANDO=$(echo "$BUSCA" | sed 's/[^a-zA-Z0-9 ]//g')
yt-dlp -x --audio-format mp3 --audio-quality 0 --no-check-certificate --restrict-filenames --ffmpeg-location "$BIN_DIR/ffmpeg" --default-search "scsearch1" --output "$DIR/%(title)s.%(ext)s" "scsearch1:$LIMPANDO"
ARQUIVO=$(ls -t "$DIR"/*.mp3 2>/dev/null | head -n 1)
[ -n "$ARQUIVO" ] && echo "OK|$(basename "$ARQUIVO")" || echo "❌ Erro"
