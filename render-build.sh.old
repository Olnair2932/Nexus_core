#!/usr/bin/env bash
set -o errexit
npm install
mkdir -p bin
cd bin
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
chmod a+rx yt-dlp
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz
tar -xf ffmpeg.tar.xz --strip-components=1
chmod a+rx ffmpeg ffprobe
rm ffmpeg.tar.xz
cd ..
chmod +x public/*.sh
