"""
fix_po_duplicates.py
Elimina entradas duplicadas de un archivo .po manteniendo la primera aparición.

Uso:
    python fix_po_duplicates.py locale/en/LC_MESSAGES/django.po
"""

import sys
import re

def fix_po(filepath):
    with open(filepath, encoding="utf-8") as f:
        content = f.read()

    # Separar el header (todo antes del primer msgid real) del resto
    # El header termina antes del primer bloque msgid que no sea ""
    header_match = re.match(r'^(.*?)(^msgid "(?!"\n))', content, re.DOTALL | re.MULTILINE)
    if header_match:
        header = header_match.group(1)
        body = content[len(header):]
    else:
        header = ""
        body = content

    # Separar en bloques individuales (cada entrada es un bloque separado por línea vacía)
    # Un bloque puede tener comentarios (#) + msgid + msgstr
    blocks = re.split(r'\n{2,}', body.strip())

    seen_msgids = {}   # msgid -> índice del bloque donde apareció primero
    clean_blocks = []
    duplicates_removed = 0

    for block in blocks:
        # Extraer el msgid completo del bloque
        # Puede ser una sola línea: msgid "algo"
        # O multilinea: msgid ""\n"parte1"\n"parte2"
        msgid_match = re.search(r'^msgid\s+"((?:[^"\\]|\\.)*)"\s*$(.*?)^msgstr', block, re.MULTILINE | re.DOTALL)
        
        if not msgid_match:
            # Bloque sin msgid reconocible (ej: header), lo conservamos
            clean_blocks.append(block)
            continue

        # Reconstruir el msgid completo (incluyendo líneas de continuación)
        msgid_raw = re.search(r'^(msgid\s+(?:"[^"]*"\s*\n?)+)', block, re.MULTILINE)
        if msgid_raw:
            msgid_key = msgid_raw.group(1).strip()
        else:
            msgid_key = msgid_match.group(0)

        if msgid_key in seen_msgids:
            duplicates_removed += 1
            print(f"  ✗ Duplicado eliminado: {msgid_key[:60].strip()}...")
        else:
            seen_msgids[msgid_key] = len(clean_blocks)
            clean_blocks.append(block)

    clean_content = header + "\n\n".join(clean_blocks) + "\n"

    # Sobrescribir el archivo original
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(clean_content)

    print(f"\n✓ Listo. {duplicates_removed} duplicado(s) eliminado(s).")
    print(f"✓ Archivo guardado: {filepath}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python fix_po_duplicates.py <ruta/al/django.po>")
        sys.exit(1)
    fix_po(sys.argv[1])
