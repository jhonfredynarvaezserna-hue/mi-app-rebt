"""
Aplica en index.html:
  1) Sustituye el dibujo antiguo del cuadro de vivienda básica por el unifilar (img/unifilar-vivienda.svg)
  2) Sustituye la foto de Unsplash del wallbox por img/wallbox-ve.svg
  3) Corrige "laboratorio ETS5" -> "Laboratorio ETS5" en la tarjeta de KNX
Antes de tocar nada guarda una copia: index.antes-unifilar.html
Ejecutar desde la carpeta del proyecto:  python aplicar_unifilar.py
"""
import re
import shutil

RUTA = "index.html"

with open(RUTA, encoding="utf-8", newline="") as f:
    html = f.read()

shutil.copy(RUTA, "index.antes-unifilar.html")
informe = []

# 1) Unifilar de vivienda básica
patron = re.compile(
    r'<div class="esquema-caja">\s*<svg viewBox="0 0 520 220"[^>]*'
    r'aria-label="Esquema cuadro eléctrico vivienda básica">.*?</svg>\s*</div>',
    re.S,
)
nuevo = (
    '<div class="esquema-caja">\n'
    '                        <img src="img/unifilar-vivienda.svg" alt="Esquema unifilar vivienda básica" '
    'style="width:100%; max-width:680px;">\n'
    '                    </div>'
)
html, n = patron.subn(lambda m: nuevo, html, count=1)
informe.append(("Unifilar vivienda básica", n))

# 2) Wallbox
viejo_src = "https://images.unsplash.com/photo-1647427145344-9bc0a855365e?auto=format&fit=crop&w=600&q=80"
n = html.count(viejo_src)
html = html.replace(viejo_src, "img/wallbox-ve.svg")
informe.append(("Imagen wallbox", n))

viejo_pie = "Wallbox y conector Tipo 2 para recarga vinculada"
n = html.count(viejo_pie)
html = html.replace(viejo_pie, "Esquema de wallbox Modo 3 con toma Tipo 2")
informe.append(("Pie de la imagen", n))

# 3) Mayúscula en KNX
n = html.count("laboratorio ETS5, topología")
html = html.replace("laboratorio ETS5, topología", "Laboratorio ETS5, topología")
informe.append(("Texto KNX", n))

with open(RUTA, "w", encoding="utf-8", newline="") as f:
    f.write(html)

print("Resultado:")
for nombre, n in informe:
    print(("  OK       " if n else "  NO ENCONTRADO  ") + nombre + " (" + str(n) + ")")
print("Copia de seguridad: index.antes-unifilar.html")
