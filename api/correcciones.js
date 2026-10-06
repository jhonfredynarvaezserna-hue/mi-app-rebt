// ==========================================
// J.F - CORRECCIONES Y MEJORAS
// Cargar DESPUÉS de main.js y propuesta-knx.js
// ==========================================
(function () {
    'use strict';
    const $ = id => document.getElementById(id);

    // ---------- 1) Elena se identifica como IA y avisa de que es orientativa ----------
    window.conInstrucciones = function (consulta) {
        return INSTRUCCIONES_ELENA +
            "\nFORMATO: escribe en texto plano, como si hablaras. No uses asteriscos, almohadillas, guiones de lista, tablas ni emojis. Para dar pasos usa 'Primero', 'Después' y 'Por último'. Frases cortas." +
            "\nEres un asistente virtual con IA: si te lo preguntan, dilo con claridad. Tus respuestas son orientativas y deben verificarse en el texto oficial vigente. Si no estás segura de un valor o de un artículo, dilo en vez de inventarlo." +
            "\n\nConsulta del cliente:\n" + consulta;
    };

    // ---------- 2) Buscador REBT/RITE: base local con datos corregidos ----------
    const BASE_LOCAL = [
        { k: "diferencial", t: "ITC-BT-24 / Tipos de Interruptores Diferenciales",
          d: "• <strong>Tipo AC:</strong> Solo corriente alterna senoidal.<br>• <strong>Tipo A:</strong> Alterna y continua pulsante (electrónica doméstica).<br>• <strong>Tipo F:</strong> Monofásicos con variador de frecuencia (bombas de calor, lavadoras inverter).<br>• <strong>Tipo B:</strong> Corriente continua pura (fotovoltaica trifásica, cargadores VE rápidos)." },
        { k: "itc-bt-14", t: "ITC-BT-14: Línea General de Alimentación (LGA)",
          d: "Enlaza la CGP con los contadores. Caída de tensión máxima: <strong>0,5%</strong> con contadores totalmente concentrados y <strong>1%</strong> con contadores concentrados por plantas. Conductores unipolares 0,6/1 kV libres de halógenos." },
        { k: "itc-bt-15", t: "ITC-BT-15: Derivaciones Individuales",
          d: "Caída de tensión máxima: <strong>0,5%</strong> con contadores totalmente concentrados, <strong>1%</strong> con contadores concentrados por plantas y <strong>1,5%</strong> en suministros de un único usuario sin línea general de alimentación. Sección mínima 6 mm² Cu, libre de halógenos." },
        { k: "itc-bt-19", t: "ITC-BT-19: Instalaciones Interiores",
          d: "Caída de tensión máxima en la instalación interior: <strong>3%</strong> para alumbrado y <strong>5%</strong> para los demás usos." },
        { k: "itc-bt-25", t: "ITC-BT-25: Circuitos en Viviendas",
          d: "C1 Iluminación (10 A, 1,5 mm²), C2 Tomas generales (16 A, 2,5 mm²), C3 Cocina y horno (25 A, 6 mm²), C4 Lavadora, lavavajillas y termo (20 A, 4 mm²), C5 Baños y auxiliares de cocina (16 A, 2,5 mm²). Electrificación elevada: C6 y C7 adicionales de C1 y C2, C8 calefacción, C9 aire acondicionado, C10 secadora, C11 automatización, C12 circuitos adicionales." },
        { k: "itc-bt-52", t: "ITC-BT-52: Vehículos Eléctricos",
          d: "Diferencial con protección contra corriente continua (6 mA DC) Clase A o Tipo B, magnetotérmico curva C y protección contra sobretensiones." },
        { k: "rite", t: "RITE IT 1.1.4: Calidad del Aire Interior (IDA)",
          d: "Caudales mínimos de aire exterior: IDA 1 (20 dm³/s·persona), IDA 2 (12,5), IDA 3 (8), IDA 4 (5)." }
    ];

    window.ejecutarBusquedaNormativa = async function () {
        const input = $('entrada-busqueda');
        const resBox = $('resultados-busqueda');
        const query = input ? input.value.trim() : '';
        if (!query || !resBox) { alert("Escribe una consulta técnica o normativa."); return; }

        resBox.innerHTML = `<div style="color:var(--azul-brillante); padding:10px 0;">⏳ <em>Elena está analizando tu consulta…</em></div>`;
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: conInstrucciones(`Consulta de normativa técnica REBT/RITE/ICT: "${query}". Responde con precisión, indicando las ITC que apliquen y los valores clave.`) })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || `Error HTTP ${res.status}`);
            const raw = data.text || data.respuesta || "No se obtuvo respuesta.";
            resBox.innerHTML = `
                <div style="padding:10px 0;">
                    <strong style="color:var(--verde-ia); font-size:1.05rem;">🤖 Respuesta de Elena (IA):</strong>
                    <div style="line-height:1.6; font-size:0.95rem; max-height:450px; overflow-y:auto; padding-right:10px; margin-top:10px;">${formatearTextoElena(raw)}</div>
                    <p style="font-size:0.78rem; color:#64748b; margin:12px 0 0 0;">Respuesta orientativa. Verifícala en el texto oficial vigente (BOE).</p>
                </div>`;
            hablarComoElena(raw);
        } catch (err) {
            const q = query.toLowerCase();
            const m = BASE_LOCAL.filter(i => i.k.includes(q) || i.t.toLowerCase().includes(q) || i.d.toLowerCase().includes(q));
            resBox.innerHTML = m.length
                ? m.map(x => `<div style="padding:10px 0;"><strong style="color:var(--azul-brillante);">${x.t}</strong><p style="margin:6px 0 0 0; color:#cbd5e1; font-size:0.92rem; line-height:1.5;">${x.d}</p></div>`).join('<hr style="border-color:var(--bordes); margin:12px 0;">')
                : `<p style="color:#ef4444;"><strong>❌ No se pudo conectar con Elena</strong><br>${err.message}</p>`;
        }
    };


    // ---------- 2b) Sin símbolos raros al hablar ni en pantalla ----------
    function limpiarParaVoz(t) {
        const lineas = String(t || '')
            .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/<[^>]*>/g, '')
            .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
            .split('\n')
            .map(l => l
                .replace(/^\s{0,3}#{1,6}\s*/, '')
                .replace(/^\s*[*\-•]\s+/, '')
                .replace(/^\s*\d+[.)]\s+/, '')
                .replace(/[*_`~#>|]/g, '')
                .replace(/([A-Za-z0-9])-(?=[A-Za-z0-9])/g, '$1 ')
                .trim())
            .filter(Boolean)
            .map(l => l.replace(/[.:;,]+$/, ''));
        return lineas.join('. ');
    }
    window.limpiarParaVoz = limpiarParaVoz;

    const hablarOriginal = window.hablarComoElena;
    if (typeof hablarOriginal === 'function') {
        window.hablarComoElena = function (texto) { return hablarOriginal(limpiarParaVoz(texto)); };
    }

    const formatearOriginal = window.formatearTextoElena;
    if (typeof formatearOriginal === 'function') {
        window.formatearTextoElena = function (t) {
            const limpio = String(t || '')
                .replace(/^\s{0,3}#{1,6}\s*(.+)$/gm, '**$1**')
                .replace(/^\s*[*\-]\s+/gm, '• ');
            return formatearOriginal(limpio);
        };
    }

    // ---------- 2c) Elena como recepcionista: valora la urgencia y lleva al cliente a J.F ----------
    const REGLA_URGENCIA = "\n\nAl terminar tu respuesta añade, en una última línea aparte, exactamente 'URGENCIA: ALTA', 'URGENCIA: MEDIA' o 'URGENCIA: BAJA'. ALTA solo si hay riesgo para las personas o la instalación (olor a quemado, chispas, humo, descargas, cuadro caliente, sin suministro en un negocio, fuga de gas refrigerante).";

    function botonesJF(nivel, nombre, tipo, mensaje, diagnostico) {
        const tel = (typeof TELEFONO_JF !== 'undefined') ? TELEFONO_JF : '34642269680';
        const resumen = limpiarParaVoz(diagnostico).slice(0, 350);
        const cab = nivel === 'ALTA' ? 'URGENCIA 24h - J.F' : 'CONSULTA - J.F';
        const texto = `*${cab}*\nNombre: ${nombre || 'Cliente'}\nTipo: ${tipo}\nProblema: ${mensaje}\nDiagnóstico previo de Elena (IA): ${resumen}`;
        const url = `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
        const btn = 'display:inline-block; padding:11px 18px; border-radius:50px; text-decoration:none; color:#fff; font-weight:bold; font-size:0.9rem;';
        if (nivel === 'ALTA') {
            return `<div style="margin-top:16px; padding:14px; border:1px solid #ef4444; border-radius:8px; background:rgba(239,68,68,0.12);">
                <strong style="color:#fca5a5;">🚨 Parece una urgencia. Si hay humo, chispas, olor a quemado o alguien herido, llama al 112.</strong>
                <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
                    <a href="${url}" target="_blank" rel="noopener noreferrer" style="${btn} background:#16a34a;">⚡ Urgencia por WhatsApp a J.F</a>
                    <a href="tel:+${tel}" style="${btn} background:#1e293b; border:1px solid #475569;">📞 Llamar a J.F</a>
                </div></div>`;
        }
        return `<div style="margin-top:16px;"><a href="${url}" target="_blank" rel="noopener noreferrer" style="${btn} background:#16a34a;">📱 Pedir visita o presupuesto a J.F</a></div>`;
    }

    window.diagnosticarConIA = async function () {
        const nombre = $('gestor-nombre')?.value.trim();
        const tipo = $('gestor-tipo')?.value;
        const mensaje = $('gestor-mensaje')?.value.trim();
        const resBox = $('gestor-ia-resultado');

        if (!mensaje) { alert("Por favor, escribe una descripción de la avería o consulta técnica."); return; }
        if (resBox) { resBox.classList.remove('oculto'); resBox.innerHTML = '<em>⏳ Elena está analizando la consulta…</em>'; }

        const prompt = `Consulta técnica: ${tipo}. Cliente: ${nombre || 'No especificado'}. Descripción del problema: ${mensaje}` + REGLA_URGENCIA;
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: conInstrucciones(prompt) })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || `Error HTTP ${res.status}`);

            const raw = data.text || data.respuesta || "Diagnóstico completado.";
            const m = raw.match(/URGENCIA:\s*(ALTA|MEDIA|BAJA)/i);
            const nivel = m ? m[1].toUpperCase() : 'MEDIA';
            const texto = raw.replace(/URGENCIA:\s*(ALTA|MEDIA|BAJA)\.?/gi, '').trim();

            if (resBox) {
                resBox.innerHTML = `
                    <h4 style="margin:0 0 10px 0; color:var(--verde-ia);">📋 Diagnóstico de Elena (IA, orientativo):</h4>
                    <div style="line-height:1.6; max-height:450px; overflow-y:auto; padding-right:10px;">${formatearTextoElena(texto)}</div>
                    ${botonesJF(nivel, nombre, tipo, mensaje, texto)}
                    <p style="font-size:0.78rem; color:#64748b; margin:12px 0 0 0;">Orientativo. Cualquier trabajo eléctrico debe hacerlo un instalador autorizado.</p>`;
            }
            hablarComoElena(texto);
        } catch (err) {
            console.error("Error en diagnóstico IA:", err);
            if (resBox) {
                resBox.innerHTML = `<p style="color:#ef4444;"><strong>❌ No se pudo conectar con Elena</strong><br>${err.message}<br><br>Puedes pulsar <strong>Enviar por WhatsApp</strong> para hablar directamente con J.F.</p>`;
            }
        }
    };

    // ---------- 3) Función que faltaba: validar arquitectura IoT ----------
    window.verificarArquitecturaIoT = function () {
        const disp = $('dom-dispositivo')?.value, hub = $('dom-pasarela')?.value, eco = $('dom-eco')?.value;
        const esZwave = disp === 'termostato-zwave';
        const hubLocal = hub === 'bridge-local';
        const msg = [];

        if (esZwave) {
            msg.push("❌ El hub elegido es Zigbee y el termostato es Z-Wave (868 MHz): son protocolos distintos y no se hablan. Necesitas un controlador Z-Wave (por ejemplo una memoria USB Z-Wave en Home Assistant).");
        } else if (hubLocal) {
            msg.push("✅ Zigbee con coordinador local: la opción más fiable. Funciona sin nube y admite dispositivos de varias marcas.");
        } else {
            msg.push("⚠️ Pasarela propietaria: funciona bien con dispositivos de su misma marca, pero depende de su nube y de que la marca mantenga el servicio. Con otras marcas puede dar problemas de compatibilidad.");
        }

        if (eco === 'google-home') {
            msg.push(hubLocal
                ? "ℹ️ Para llevarlo a Google Home con un hub local necesitas un puente (Matter o la nube de Home Assistant)."
                : "ℹ️ Con la pasarela propietaria, Google Home se enlaza desde la app de la marca (cuenta en la nube).");
        } else {
            msg.push("ℹ️ Sin ecosistema de voz: control solo desde la app local, sin órdenes por voz.");
        }
        msg.push("Recuerda: los micromódulos que van en el cuadro o en cajas de mecanismos deben instalarlos y validarlos instaladores autorizados.");

        const txt = $('domotica-texto-resultado'), box = $('domotica-res-box');
        if (txt) txt.innerHTML = msg.join('<br><br>');
        if (box) box.classList.remove('oculto');
    };

    // ---------- 4) Correcciones sobre la pantalla (se aplican al cargar) ----------
    function reemplazarTextos(mapa) {
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = w.nextNode())) {
            const p = n.parentElement;
            if (p && /^(SCRIPT|STYLE)$/i.test(p.tagName)) continue;
            let t = n.nodeValue, cambio = false;
            for (const [a, b] of mapa) if (t.includes(a)) { t = t.split(a).join(b); cambio = true; }
            if (cambio) n.nodeValue = t;
        }
    }

    function corregirCalculadoraCaida() {
        const mat = $('calc-material'), pct = $('calc-porcentaje-max');
        if (mat) mat.innerHTML =
            '<option value="48">Cobre a 70 °C (PVC) – 48 m/(Ω·mm²)</option>' +
            '<option value="44">Cobre a 90 °C (XLPE / RZ1) – 44 m/(Ω·mm²)</option>' +
            '<option value="30">Aluminio a 70 °C – 30 m/(Ω·mm²)</option>' +
            '<option value="28">Aluminio a 90 °C – 28 m/(Ω·mm²)</option>';
        if (pct) {
            pct.innerHTML =
                '<option value="0.5">0,5% (DI con contadores totalmente concentrados / LGA)</option>' +
                '<option value="1">1% (DI o LGA con contadores concentrados por plantas)</option>' +
                '<option value="1.5">1,5% (DI de un único usuario)</option>' +
                '<option value="3">3% (Alumbrado interior)</option>' +
                '<option value="5">5% (Usos generales / Fuerza)</option>';
            pct.value = '3';
        }
    }

    function corregirCircuitosElevada() {
        const svg = document.querySelector('svg[aria-label*="electrificación elevada"]');
        if (!svg) return;
        const mapa = { C6: 'C8', C7: 'C9', C8: 'C10', C9: 'C11', C10: 'C12' };
        svg.querySelectorAll('text').forEach(t => { const k = t.textContent.trim(); if (mapa[k]) t.textContent = mapa[k]; });
        const bloque = svg.closest('.seccion-bloque');
        if (!bloque) return;
        const lista = bloque.querySelector('.resultado-caja ul');
        bloque.querySelectorAll('li').forEach(li => {
            const t = li.textContent;
            if (t.includes('Calefacción')) li.textContent = '✅ C8 Calefacción';
            else if (t.includes('Aire')) li.textContent = '✅ C9 Aire acondicionado';
            else if (t.includes('Secadora')) li.textContent = '✅ C10 Secadora';
            else if (t.includes('Automatización')) li.textContent = '✅ C11 Automatización';
            else if (t.includes('especiales')) li.textContent = '✅ C12 Circuitos adicionales';
        });
        if (lista) {
            const li = document.createElement('li');
            li.textContent = 'ℹ️ C6 y C7: circuitos adicionales de alumbrado y tomas generales, cuando se supera el número máximo de puntos de C1 y C2.';
            lista.appendChild(li);
        }
    }

    function avatarElena() {
        const AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#122434"/>' +
            '<circle cx="50" cy="38" r="18" fill="#188fa7"/><path d="M14 92c4-22 20-32 36-32s32 10 36 32z" fill="#188fa7"/>' +
            '<text x="50" y="46" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" font-weight="bold" fill="#fff">E</text></svg>');
        document.querySelectorAll('img[src*="photo-1573496359142"]').forEach(img => {
            img.src = AVATAR; img.alt = 'Elena, asistente virtual con IA';
        });
    }

    function ocultarImagenesRotas() {
        document.querySelectorAll('img[src="tu-imagen-taller.jpg"]').forEach(img => {
            const ocultar = () => { if (img.parentElement) img.parentElement.style.display = 'none'; };
            if (img.complete && img.naturalWidth === 0) ocultar();
            else img.addEventListener('error', ocultar);
        });
        document.querySelectorAll('a[download$=".cad"]').forEach(a => {
            fetch(a.getAttribute('href'), { method: 'HEAD' })
                .then(r => { if (!r.ok) a.style.display = 'none'; })
                .catch(() => { });
        });
    }

    function avisoIA() {
        const hdr = document.querySelector('#vista-inicio header');
        if (hdr && !$('aviso-ia')) {
            hdr.insertAdjacentHTML('afterend',
                '<div id="aviso-ia" class="resultado-caja" style="margin:0 0 20px 0; font-size:0.82rem; color:#94a3b8;">ℹ️ Elena es un asistente de IA y las calculadoras son orientativas. Los trabajos eléctricos deben realizarlos y validarlos instaladores autorizados, conforme al REBT y la normativa vigente.</div>');
        }
    }

    function aplicar() {
        corregirCalculadoraCaida();
        corregirCircuitosElevada();
        avatarElena();
        ocultarImagenesRotas();
        avisoIA();
        reemplazarTextos([
            ['Dictamen Técnico Oficial', 'Respuesta técnica (IA, orientativa)'],
            ['Asesoría técnica oficial con Elena & Gemini', 'Asesoría técnica orientativa con Elena (IA)'],
            ['con resolución técnica oficial', 'con respuesta técnica orientativa']
        ]);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicar);
    else aplicar();
})();