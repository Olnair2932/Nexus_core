#!/usr/bin/env bash
# Encerrar se houver erro
set -o errexit

echo "--- INICIANDO BUILD NEXUS ---"

# Instalar dependências do Node
npm install

# Criar pasta bin se não existir
mkdir -p bin
cd bin

echo "--- BAIXANDO FERRAMENTAS ---"
# Baixar yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
chmod a+rx yt-dlp

# Baixar FFmpeg (versão estática Linux 64 bits para o Render)
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz
tar -xf ffmpeg.tar.xz --strip-components=1
chmod a+rx ffmpeg ffprobe
rm ffmpeg.tar.xz

cd ..
# Dar permissão aos seus scripts
chmod +x public/*.sh

echo "--- BUILD FINALIZADO ---"
