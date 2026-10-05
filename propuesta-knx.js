// ==========================================
// J.F - MÓDULO PROPUESTAS KNX (auto-instalable)
// Solo hay que cargarlo después de main.js. Él mismo añade:
//  · enlace en el menú lateral (junto a Domótica KNX)
//  · tarjeta en la portada
//  · la vista completa, con tus estilos
// Usa tu endpoint existente /api/chat y tu licencia Pro.
// ==========================================
(function () {
    const PROMPT_KNX = `Eres un experto en diseño de instalaciones KNX para integradores y electricistas. Convierte la descripción de una vivienda o local en una propuesta técnica preliminar.

REGLAS
- Responde SOLO con un JSON válido que siga el esquema, sin texto adicional ni markdown.
- Direcciones de grupo de 3 niveles (principal/intermedio/subgrupo): 0 = Iluminación, 1 = Persianas, 2 = Climatización, 3 = Escenas y automatismos, 4 = Sensores y alarmas. Nivel intermedio = planta o zona. Subgrupo = función numerada.
- Propón solo lo que el usuario pidió más lo mínimo necesario (actuadores, fuente de alimentación, acoplador IP).
- Dimensiona actuadores con un 10-15% de canales de reserva.
- NO inventes precios ni referencias de fabricante. Indica el "tipo" de dispositivo y deja precio_unitario en null.
- Si falta información importante, ponla en "preguntas_pendientes" en lugar de suponerla.
- Incluye en "avisos" que la propuesta es preliminar y debe validarla un instalador autorizado.

ESQUEMA JSON
{"resumen":"","estancias":[{"nombre":"","funciones":[""]}],"dispositivos":[{"tipo":"","cantidad":0,"ubicacion":"","notas":"","precio_unitario":null}],"direcciones_grupo":[{"direccion":"0/1/1","nombre":"","tipo_dato":"1.001"}],"escenas":[{"nombre":"","acciones":[""]}],"preguntas_pendientes":[""],"avisos":[""]}`;

    const URL_JSPDF = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    const URL_AUTOTABLE = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";

    let propuesta = null;
    const $ = id => document.getElementById(id);
    const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

    function estado(txt, error) {
        const el = $('knxp-estado');
        if (!el) return;
        el.textContent = txt;
        el.style.color = error ? '#ef4444' : 'var(--azul-brillante)';
    }

    // ---------- Generar propuesta ----------
    async function generarPropuestaKNX() {
        const desc = $('knxp-desc')?.value.trim();
        const btn = $('knxp-btn');
        if (!desc) return estado("Escribe la descripción del proyecto.", true);

        if (btn) btn.disabled = true;
        estado("⏳ Generando propuesta…");
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: PROMPT_KNX + "\n\nDescripción del proyecto:\n" + desc.slice(0, 3000) })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || `Error HTTP ${res.status}`);

            const raw = data.text || data.respuesta || "";
            const ini = raw.indexOf('{'), fin = raw.lastIndexOf('}');
            if (ini < 0 || fin < 0) throw new Error("La respuesta no tiene el formato esperado");
            propuesta = JSON.parse(raw.slice(ini, fin + 1));

            pintar();
            estado("");
        } catch (err) {
            console.error("Error propuesta KNX:", err);
            estado("❌ No se pudo generar la propuesta (" + err.message + "). Inténtalo de nuevo.", true);
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function pintar() {
        const p = propuesta;
        $('knxp-resumen').textContent = p.resumen || "";

        $('knxp-tabla-disp').innerHTML =
            "<tr><th>Tipo</th><th>Cant.</th><th>Ubicación</th><th>Precio ud. (€)</th></tr>" +
            (p.dispositivos || []).map((d, i) =>
                `<tr><td>${esc(d.tipo)}</td><td>${esc(d.cantidad)}</td><td>${esc(d.ubicacion)}</td>
                 <td><input type="number" min="0" step="0.01" data-i="${i}" value="${d.precio_unitario ?? ''}" aria-label="Precio unitario" style="width:100px; padding:4px 6px;"></td></tr>`
            ).join("");
        document.querySelectorAll('#knxp-tabla-disp input').forEach(inp =>
            inp.addEventListener('input', () => {
                propuesta.dispositivos[inp.dataset.i].precio_unitario = inp.value === "" ? null : parseFloat(inp.value);
            }));

        $('knxp-tabla-dir').innerHTML =
            "<tr><th>Dirección</th><th>Nombre</th><th>Tipo de dato</th></tr>" +
            (p.direcciones_grupo || []).map(g => `<tr><td>${esc(g.direccion)}</td><td>${esc(g.nombre)}</td><td>${esc(g.tipo_dato)}</td></tr>`).join("");

        $('knxp-escenas').innerHTML = (p.escenas || []).map(e => `<li><strong>${esc(e.nombre)}:</strong> ${esc((e.acciones || []).join("; "))}</li>`).join("") || "<li>Sin escenas.</li>";
        $('knxp-pend').innerHTML = (p.preguntas_pendientes || []).map(q => `<li>${esc(q)}</li>`).join("") || "<li>Nada pendiente.</li>";
        $('knxp-avisos').textContent = (p.avisos || []).join(" ");
        $('knxp-resultado').classList.remove('oculto');
    }

    // ---------- PDF (las librerías se cargan solo cuando hacen falta) ----------
    function cargarScript(src) {
        return new Promise((ok, ko) => {
            const s = document.createElement('script');
            s.src = src; s.onload = ok;
            s.onerror = () => ko(new Error("No se pudo cargar " + src));
            document.head.appendChild(s);
        });
    }
    async function asegurarPDF() {
        if (!window.jspdf) await cargarScript(URL_JSPDF);
        if (!window.jspdf.jsPDF.API.autoTable) await cargarScript(URL_AUTOTABLE);
    }

    async function descargarPropuestaPDF() {
        if (!propuesta) return;
        try { await asegurarPDF(); } catch (e) { return estado("❌ " + e.message + ". Necesitas conexión para generar el PDF.", true); }

        const p = propuesta;
        const doc = new window.jspdf.jsPDF();
        const eur = n => n.toFixed(2).replace(".", ",") + " €";
        const fecha = new Date().toLocaleDateString("es-ES");
        const empresa = $('knxp-empresa')?.value.trim() || "J.F Clima & Electricidad";
        const cliente = $('knxp-cliente')?.value.trim() || "—";
        let y = 20;

        doc.setFontSize(18); doc.text("Propuesta de instalación KNX", 14, y); y += 8;
        doc.setFontSize(10); doc.text(`${empresa}  |  Cliente: ${cliente}  |  ${fecha}`, 14, y); y += 8;
        const resumen = doc.splitTextToSize(p.resumen || "", 180);
        doc.text(resumen, 14, y); y += resumen.length * 5 + 4;

        const filas = (p.dispositivos || []).map(d => {
            const pu = d.precio_unitario, t = pu == null ? null : pu * d.cantidad;
            return [d.tipo, d.cantidad, d.ubicacion, pu == null ? "—" : eur(pu), t == null ? "—" : eur(t)];
        });
        doc.autoTable({ startY: y, head: [["Dispositivo", "Cant.", "Ubicación", "Precio ud.", "Total"]], body: filas, styles: { fontSize: 9 } });

        const sub = (p.dispositivos || []).reduce((s, d) => s + (d.precio_unitario || 0) * d.cantidad, 0);
        const mo = parseFloat($('knxp-mo')?.value) || 0;
        const iva = parseFloat($('knxp-iva')?.value) || 0;
        const base = sub + mo, total = base * (1 + iva / 100);
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 6, theme: "plain", styles: { fontSize: 10 }, margin: { left: 120 },
            body: [["Material", eur(sub)], ["Mano de obra", eur(mo)], [`IVA (${iva}%)`, eur(base * iva / 100)], ["TOTAL", eur(total)]],
            columnStyles: { 1: { halign: "right" } }
        });

        doc.addPage();
        doc.autoTable({ startY: 20, head: [["Dirección", "Nombre", "Tipo de dato"]],
            body: (p.direcciones_grupo || []).map(g => [g.direccion, g.nombre, g.tipo_dato]), styles: { fontSize: 9 } });

        let y2 = doc.lastAutoTable.finalY + 10;
        const bloque = (titulo, lineas) => {
            doc.setFontSize(11); doc.text(titulo, 14, y2); y2 += 6; doc.setFontSize(9);
            lineas.forEach(t => { const l = doc.splitTextToSize("• " + t, 180); doc.text(l, 14, y2); y2 += l.length * 4.5; });
            y2 += 6;
        };
        bloque("Escenas", (p.escenas || []).map(e => `${e.nombre}: ${(e.acciones || []).join("; ")}`));
        bloque("Pendiente de confirmar", p.preguntas_pendientes || []);
        doc.setFontSize(8);
        doc.text(doc.splitTextToSize((p.avisos || []).join(" "), 180), 14, y2);

        doc.save(`propuesta-knx-${fecha.replace(/\//g, "-")}.pdf`);
    }

    // ---------- Instalación automática en la interfaz ----------
    function instalar() {
        if ($('vista-propuesta')) return;

        // 1) Vista
        const vista = document.createElement('section');
        vista.id = 'vista-propuesta';
        vista.className = 'vista-section oculto';
        vista.innerHTML = `
            <header>
                <button type="button" class="btn-volver" onclick="abrirModuloDirecto('vista-inicio')">⬅ Volver al Menú</button>
                <h1>📐 Propuestas KNX con IA</h1>
            </header>

            <div class="seccion-bloque" style="border-top: 3px solid var(--verde-ia);">
                <p style="color:#94a3b8; font-size:0.9rem; margin-top:0;">Describe la vivienda o el local y la IA propone dispositivos, direcciones de grupo y escenas. Después pon tus precios y descarga el presupuesto en PDF.</p>
                <div class="calc-field" style="margin-bottom:15px;">
                    <label for="knxp-desc">Descripción del proyecto:</label>
                    <textarea id="knxp-desc" rows="6" placeholder="Ej: Vivienda de 2 plantas. Salón: 6 luces regulables, 2 persianas, termostato. Cocina: 4 luces on/off. 3 dormitorios con luz y persiana. Escena 'Buenas noches' que apague todo y baje persianas." style="width:100%; resize:vertical;"></textarea>
                </div>
                <div class="calc-grid">
                    <div class="calc-field"><label for="knxp-cliente">Cliente:</label><input type="text" id="knxp-cliente" placeholder="Nombre del cliente"></div>
                    <div class="calc-field"><label for="knxp-empresa">Empresa:</label><input type="text" id="knxp-empresa" value="J.F Clima & Electricidad"></div>
                </div>
                <button type="button" id="knxp-btn" onclick="generarPropuestaKNX()" style="width:100%; background-color: var(--verde-ia); padding:12px;">⚡ Generar propuesta</button>
                <p id="knxp-estado" role="status" style="margin:12px 0 0 0;"></p>
            </div>

            <div id="knxp-resultado" class="oculto">
                <div class="seccion-bloque">
                    <h3 style="color:var(--azul-brillante); margin-top:0;">📋 Resumen</h3>
                    <p id="knxp-resumen" style="color:#cbd5e1; line-height:1.6;"></p>

                    <h3 style="color:var(--azul-brillante);">🔌 Dispositivos y precios</h3>
                    <div style="overflow-x:auto;"><table class="tabla-normativa" id="knxp-tabla-disp"></table></div>
                    <div class="calc-grid" style="margin-top:15px;">
                        <div class="calc-field"><label for="knxp-mo">Mano de obra (€):</label><input type="number" id="knxp-mo" min="0" value="0"></div>
                        <div class="calc-field"><label for="knxp-iva">IVA (%):</label><input type="number" id="knxp-iva" min="0" value="21"></div>
                    </div>
                </div>

                <div class="seccion-bloque">
                    <h3 style="color:var(--azul-brillante); margin-top:0;">🟢 Direcciones de grupo</h3>
                    <div style="overflow-x:auto;"><table class="tabla-normativa" id="knxp-tabla-dir"></table></div>
                    <h3 style="color:var(--azul-brillante);">🎬 Escenas</h3>
                    <ul id="knxp-escenas" style="color:#cbd5e1; line-height:1.6;"></ul>
                    <h3 style="color:var(--oro-candado);">❓ Pendiente de confirmar</h3>
                    <ul id="knxp-pend" style="color:#cbd5e1; line-height:1.6;"></ul>
                    <div class="resultado-caja" id="knxp-avisos" style="font-size:0.88rem; color:#94a3b8;"></div>
                    <button type="button" onclick="descargarPropuestaPDF()" style="width:100%; margin-top:15px; padding:12px;">📄 Descargar PDF</button>
                </div>
            </div>`;
        (document.querySelector('main.panel-tecnico') || document.body).appendChild(vista);

        // 2) Enlace en el menú lateral, justo debajo de "Domótica KNX & ETS5"
        const aKnx = document.querySelector('.menu-sidebar a[onclick*="vista-knx"]');
        const liKnx = aKnx && aKnx.closest('li');
        if (liKnx) {
            const li = document.createElement('li');
            li.innerHTML = `<a href="javascript:void(0)" onclick="verificarYEntrar('vista-propuesta')"><span>📐 Propuestas KNX con IA</span> <span>🔒</span></a>`;
            liKnx.insertAdjacentElement('afterend', li);
        }

        // 3) Tarjeta en la portada, justo detrás de la de KNX
        const cardKnx = document.querySelector('.portada-grid .tarjeta-modulo[onclick*="vista-knx"]');
        if (cardKnx) {
            cardKnx.insertAdjacentHTML('afterend', `
                <div class="tarjeta-modulo" onclick="verificarYEntrar('vista-propuesta')">
                    <span class="insignia-candado">🔒 PRO</span>
                    <div style="font-size: 2rem; margin-bottom: 10px;">📐</div>
                    <h3>Propuestas KNX con IA</h3>
                    <p style="color: #a0aec0; font-size: 0.9rem;">Describe la vivienda y obtén dispositivos, direcciones de grupo y presupuesto en PDF.</p>
                </div>`);
        }
    }

    window.generarPropuestaKNX = generarPropuestaKNX;
    window.descargarPropuestaPDF = descargarPropuestaPDF;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
    else instalar();
})();