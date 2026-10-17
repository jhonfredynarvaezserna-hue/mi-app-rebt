#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Aplica las correcciones a index.html (en la carpeta donde lo ejecutes).
- Hace copia de seguridad: index.backup.html
- Es seguro repetirlo: si un cambio ya está puesto, lo salta.
Uso (Windows):  py aplicar_correcciones.py
Uso (Mac/Linux): python3 aplicar_correcciones.py
"""
import re, shutil, sys

ARCHIVO = "index.html"

MENU = '''<li><a href="javascript:void(0)" onclick="abrirModuloDirecto('vista-vuelta-auto')"><span>🔁 Inversión de giro</span></a></li>
                            '''

SECCION = r'''
            <!-- ==================== VISTA INVERSIÓN DE GIRO ==================== -->
            <section id="vista-vuelta-auto" class="vista-section oculto">
                <header>
                    <button type="button" class="btn-volver" onclick="abrirModuloDirecto('vista-inicio')">⬅ Volver al Menú</button>
                    <h1>🔁 Inversión de giro con vuelta automática</h1>
                </header>

                <div class="seccion-bloque">
                    <h3 style="color:var(--azul-brillante); margin-top:0;">Elementos del circuito</h3>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px;">
                        <div style="background:var(--input-bg); padding:12px; border-radius:6px; border-left:3px solid var(--azul-brillante);"><strong>S1 (NA)</strong><br><span style="font-size:.88rem; color:#94a3b8;">Marcha del giro 1.</span></div>
                        <div style="background:var(--input-bg); padding:12px; border-radius:6px; border-left:3px solid #ef4444;"><strong>S3 (NC)</strong><br><span style="font-size:.88rem; color:#94a3b8;">Paro general.</span></div>
                        <div style="background:var(--input-bg); padding:12px; border-radius:6px; border-left:3px solid var(--verde-ia);"><strong>Q11 / Q12</strong><br><span style="font-size:.88rem; color:#94a3b8;">Contactores de cada sentido, con autorretención 13-14.</span></div>
                        <div style="background:var(--input-bg); padding:12px; border-radius:6px; border-left:3px solid var(--oro-candado);"><strong>B1 (NC + NA)</strong><br><span style="font-size:.88rem; color:#94a3b8;">Corta Q11 y conecta Q12.</span></div>
                        <div style="background:var(--input-bg); padding:12px; border-radius:6px; border-left:3px solid var(--oro-candado);"><strong>B2 (NC)</strong><br><span style="font-size:.88rem; color:#94a3b8;">Corta Q12 al final de la vuelta.</span></div>
                    </div>
                    <div class="resultado-caja">
                        <ol style="margin:0;">
                            <li>S1 activa Q11 y se mantiene por autorretención.</li>
                            <li>Al llegar a B1: su NC desconecta Q11 y su NA conecta Q12.</li>
                            <li>Q12 se mantiene y el motor retrocede hasta B2.</li>
                            <li>B2 corta Q12. S3 para todo en cualquier momento.</li>
                        </ol>
                    </div>
                    <p style="font-size:.85rem; color:#f59e0b; margin-bottom:0;">⚠️ En el montaje real añade un NC de Q12 en serie con Q11 (y al revés) como enclavamiento.</p>
                </div>

                <div class="seccion-bloque">
                    <h3 style="margin-top:0;">🎮 Simulador de vuelta automática</h3>
                    <div class="cade-cuadro">
                        <div style="position:relative; height:46px; background:#1e293b; border-radius:6px; margin:10px 0 20px 0;" id="va-riel">
                            <div id="va-fc2" style="position:absolute; left:0; top:-8px; width:34px; height:60px; border-radius:4px; background:#334155; border:2px solid #475569; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:bold;">B2</div>
                            <div id="va-fc1" style="position:absolute; right:0; top:-8px; width:34px; height:60px; border-radius:4px; background:#334155; border:2px solid #475569; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:bold;">B1</div>
                            <div id="va-carro" style="position:absolute; left:0; top:6px; width:40px; height:34px; border-radius:6px; background:#188fa7; border:2px solid #fff;"></div>
                        </div>
                        <div class="circuito-grid">
                            <div style="display:flex; gap:12px; flex-wrap:wrap;">
                                <button type="button" id="va-s1" style="background-color:#10b981; width:75px; height:75px; border-radius:50%; font-size:11px;">S1 (MARCHA)</button>
                                <button type="button" id="va-s3" style="background-color:#ef4444; width:75px; height:75px; border-radius:50%; font-size:11px;">S3 (PARO)</button>
                                <button type="button" id="va-reset" style="background-color:#475569; width:75px; height:75px; border-radius:50%; font-size:11px;">↺ REINICIAR</button>
                            </div>
                            <div>
                                <div class="estado-borne"><span>Q11 (giro 1):</span><strong id="va-q11" style="color:#94a3b8;">DESACTIVADO</strong></div>
                                <div class="estado-borne"><span>Q12 (giro 2):</span><strong id="va-q12" style="color:#94a3b8;">DESACTIVADO</strong></div>
                                <div class="estado-borne"><span>Motor:</span><strong id="va-motor" style="color:#94a3b8;">PARADO</strong></div>
                            </div>
                        </div>
                    </div>
                </div>

                <script>
                (function () {
                    var q11 = false, q12 = false, pos = 0, s1 = false, MAX = 100;
                    var $ = function (i) { return document.getElementById(i); };
                    function pintar(id, on, t) { var e = $(id); e.textContent = t; e.style.color = on ? '#10b981' : '#94a3b8'; }
                    function ciclo() {
                        var b1 = pos >= MAX - 2, b2 = pos <= 2;
                        var n11 = (s1 || q11) && !b1;
                        var n12 = (b1 || q12) && !b2;
                        if (n11 && n12) n11 = false;
                        q11 = n11; q12 = n12; s1 = false;
                        if (q11) pos = Math.min(MAX, pos + 1);
                        if (q12) pos = Math.max(0, pos - 1);
                        var ancho = $('va-riel').clientWidth - 40;
                        $('va-carro').style.left = (pos / MAX * ancho) + 'px';
                        $('va-fc1').style.background = b1 ? '#f59e0b' : '#334155';
                        $('va-fc2').style.background = b2 ? '#f59e0b' : '#334155';
                        pintar('va-q11', q11, q11 ? 'ACTIVADO' : 'DESACTIVADO');
                        pintar('va-q12', q12, q12 ? 'ACTIVADO' : 'DESACTIVADO');
                        pintar('va-motor', q11 || q12, q11 ? 'GIRO 1 (ida)' : q12 ? 'GIRO 2 (vuelta)' : 'PARADO');
                    }
                    $('va-s1').addEventListener('click', function () { s1 = true; });
                    $('va-s3').addEventListener('click', function () { q11 = false; q12 = false; s1 = false; });
                    $('va-reset').addEventListener('click', function () { q11 = false; q12 = false; s1 = false; pos = 0; });
                    setInterval(ciclo, 40);
                })();
                </script>
            </section>

'''

ELEVADA = r'''
                    <div class="esquema-caja">
                        <svg id="svg-elevada" viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cuadro electrificación elevada"></svg>
                    </div>
                    <script>
                    (function () {
                        var s = '<rect x="5" y="5" width="630" height="190" rx="10" style="fill:#0f1923;stroke:#223347;stroke-width:2"/>' +
                            '<text x="20" y="30" style="fill:#188fa7;font:bold 15px system-ui,sans-serif">CGMP · Electrificación Elevada</text>' +
                            '<rect x="20" y="50" width="45" height="110" rx="4" style="fill:#1a2936;stroke:#188fa7;stroke-width:2"/><text x="42" y="110" text-anchor="middle" style="fill:#fff;font:bold 10px monospace">IGA</text>' +
                            '<rect x="75" y="50" width="45" height="110" rx="4" style="fill:#1a2936;stroke:#f59e0b;stroke-width:2"/><text x="97" y="110" text-anchor="middle" style="fill:#fff;font:bold 9px monospace">ID-1</text>' +
                            '<rect x="130" y="50" width="45" height="110" rx="4" style="fill:#1a2936;stroke:#f59e0b;stroke-width:2"/><text x="152" y="110" text-anchor="middle" style="fill:#fff;font:bold 9px monospace">ID-2</text>';
                        for (var i = 1; i <= 12; i++) {
                            var x = 185 + (i - 1) * 37, extra = i > 5;
                            s += '<rect x="' + x + '" y="50" width="32" height="110" rx="4" style="fill:#1a2936;stroke:' + (extra ? '#10b981' : '#188fa7') + ';stroke-width:1.5"/>' +
                                 '<text x="' + (x + 16) + '" y="110" text-anchor="middle" style="fill:#e2e8f0;font:bold 9px monospace">C' + i + '</text>';
                        }
                        s += '<text x="20" y="185" style="fill:#5b7086;font:9px system-ui,sans-serif">Esquema orientativo · C6 a C12 solo en electrificación elevada (ITC-BT-25)</text>';
                        document.getElementById('svg-elevada').innerHTML = s;
                    })();
                    </script>
                    <div class="resultado-caja" style="margin-top:12px;">
                        <h4 style="color:var(--azul-brillante); margin-top:0;">Circuitos adicionales (elevada)</h4>
                        <ul style="margin-bottom:0; padding-left:20px;">
                            <li>✅ C6 Alumbrado adicional</li>
                            <li>✅ C7 Tomas de uso general adicionales</li>
                            <li>✅ C8 Calefacción</li>
                            <li>✅ C9 Aire acondicionado</li>
                            <li>✅ C10 Secadora</li>
                            <li>✅ C11 Automatización</li>
                            <li>✅ C12 Circuitos adicionales de otro tipo</li>
                        </ul>
                    </div>
                </div>

                '''

informe = []

def ok(msg):    informe.append("  [OK]       " + msg)
def ya(msg):    informe.append("  [YA ESTABA] " + msg)
def fallo(msg): informe.append("  [REVISAR]  " + msg)

try:
    with open(ARCHIVO, encoding="utf-8") as f:
        h = f.read()
except FileNotFoundError:
    sys.exit("No encuentro index.html. Ejecuta el script dentro de la carpeta del proyecto.")

import os
if not os.path.exists("index.backup.html"):
    shutil.copyfile(ARCHIVO, "index.backup.html")

# 1. Viewport: permitir zoom
viejo = 'content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"'
if viejo in h:
    h = h.replace(viejo, 'content="width=device-width, initial-scale=1.0"'); ok("Viewport: zoom permitido")
else:
    ya("Viewport (o no coincide)")

# 2. Menú lateral
if "vista-vuelta-auto')" in h and "Inversión de giro</span>" in h:
    ya("Enlace de menú Inversión de giro")
else:
    ancla = "<li><a href=\"javascript:void(0)\" onclick=\"verificarYEntrar('vista-industrial')\">"
    if ancla in h:
        h = h.replace(ancla, MENU + ancla, 1); ok("Enlace de menú Inversión de giro")
    else:
        fallo("No encontré el enlace de vista-industrial en el menú")

# 3. Sección nueva
if 'id="vista-vuelta-auto"' in h:
    ya("Sección Inversión de giro")
else:
    if "</main>" in h:
        h = h.replace("</main>", SECCION + "        </main>", 1); ok("Sección Inversión de giro")
    else:
        fallo("No encontré </main>")

# 4. Circuitos elevada
if 'id="svg-elevada"' in h:
    ya("Circuitos elevada C6-C12")
else:
    m = re.search(r'(<h3[^>]*>⚡ Cuadro Vivienda Electrificación Elevada</h3>)(.*?)(<!-- DIFERENCIAL -->)', h, re.S)
    if m:
        h = h[:m.end(1)] + ELEVADA + h[m.start(3):]; ok("Circuitos elevada C6-C12 (ITC-BT-25)")
    else:
        fallo("No encontré el bloque de Electrificación Elevada")

# 5. KNX
k_viejo = "Hasta 256 con fuentes desacopladas y sin repetidores."
if k_viejo in h:
    h = h.replace(k_viejo, "Hasta 256 por línea usando repetidores o acopladores."); ok("Texto KNX")
else:
    ya("Texto KNX")

# 6. Caída de tensión de la DI (ITC-BT-15)
c_viejo = '<option value="1.5">1,5% (Derivación Individual Centralizada)</option>'
if c_viejo in h:
    c_nuevo = ('<option value="1">1% (DI con contadores totalmente centralizados)</option>\n'
               '                                <option value="1.5" selected>1,5% (DI de un único usuario)</option>\n'
               '                                <option value="2">2% (DI con contadores parcialmente centralizados)</option>')
    h = h.replace(c_viejo, c_nuevo); ok("Caída de tensión DI (1 % / 1,5 % / 2 %) - verifica en el texto oficial")
else:
    ya("Caída de tensión DI")

# 7. PayPal comentado fuera
h2 = re.sub(r'\s*<!-- Enlace de PayPal neutralizado.*?-->', '', h, flags=re.S)
if h2 != h:
    h = h2; ok("Comentario con el enlace de PayPal eliminado")
else:
    ya("Comentario PayPal")

# 8. Script de módulos extra
if "modulos-extra.js" in h:
    ya("Script modulos-extra.js")
else:
    a = '<script src="correcciones.js" defer></script>'
    if a in h:
        h = h.replace(a, a + '\n    <script src="modulos-extra.js" defer></script>'); ok("Script modulos-extra.js enlazado")
    else:
        fallo("No encontré la línea de correcciones.js")

with open(ARCHIVO, "w", encoding="utf-8") as f:
    f.write(h)

print("\nRESULTADO (copia de seguridad: index.backup.html)")
print("\n".join(informe))
print("\nPendiente a mano: Instagram/Facebook reales, tu-imagen-taller.jpg y las fotos de Unsplash.")