from pathlib import Path
import sys

arquivo = sys.argv[1]
velho = sys.argv[2]
novo = sys.argv[3]

p = Path(arquivo)

texto = p.read_text(encoding="utf-8")

if velho not in texto:
    print("❌ Texto não encontrado")
    sys.exit(1)

texto = texto.replace(velho, novo)

p.write_text(texto, encoding="utf-8")

print("✅ Alteração aplicada:", arquivo)
