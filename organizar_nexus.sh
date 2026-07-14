#!/bin/bash

echo "🚀 NEXUS CORE - ORGANIZADOR"

echo ""
echo "📚 Biblioteca atual:"
ls -1 public/*.mp3 2>/dev/null

echo ""
echo "🔎 Verificando arquivos duplicados..."

find public -name "*.mp3" -printf "%f\n" | sort | uniq -d

echo ""
echo "✅ Sistema organizado"
