// ==========================================
// J.F - LÓGICA PRINCIPAL
// ==========================================

let destinoPendiente = null;

// --- PERSONALIDAD DE ELENA (se envía con cada consulta) ---
const INSTRUCCIONES_ELENA = `Eres Elena, ingeniera técnica de J.F Clima & Electricidad. La empresa es J.F; nunca digas "SM" ni otro nombre.
Habla en español de España, cercana y natural, de tú, como una compañera de oficio.
Ve al grano: no te presentes ni saludes largo, sin frases de relleno. Respuestas cortas (unas 120 palabras) salvo que te pidan detalle. Si das pasos, numerados y breves.
Cita la ITC o el artículo del RITE solo cuando aporte algo.
Si hay riesgo (olor a quemado, chispas, humo, descarga): primero baja el IGA y no toques nada; llama al 112 si hay peligro.
Si no estás segura, dilo y recomienda escribir a J.F por WhatsApp. No inventes normativa ni cifras.`;

const AVISO_ORIENTATIVO = '<p style="margin:12px 0 0 0; font-size:0.78rem; color:#64748b;">Orientativo. Consulta siempre el texto oficial del REBT / RITE.</p>';

function conInstrucciones(consulta) {
    return INSTRUCCIONES_ELENA + "\n\nConsulta del cliente:\n" + consulta;
}

// --- ESCAPE HTML ---
function escaparHTML(texto) {
    return String(texto == null ? "" : texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- FORMATEO DE TEXTO DE ELENA (CON PROTECCIÓN XSS) ---
function formatearTextoElena(texto) {
    if (!texto) return "";
    let seguro = escaparHTML(texto);
    seguro = seguro.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--azul-brillante); text-decoration:underline; font-weight:bold;">$1 ↗</a>');
    seguro = seguro.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    seguro = seguro.replace(/\n/g, '<br>');
    return seguro;
}

// --- LLAMADA A ELENA (/api/chat) ---
async function consultarElena(prompt) {
    let res;
    try {
        res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });
    } catch (e) {
        throw new Error("Sin conexión con el servidor. Comprueba tu internet.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || data.details || ("El servidor no respondió bien (error " + res.status + ")."));
    }
    return data.text || data.respuesta || "";
}

// --- ALMACENAMIENTO SEGURO ---
function leerLicencia() {
    try { return localStorage.getItem("licencia_sm_activa"); } catch (e) { return null; }
}
function guardarLicencia(v) {
    try { localStorage.setItem("licencia_sm_activa", v); } catch (e) { }
}
function borrarLicencia() {
    try { localStorage.removeItem("licencia_sm_activa"); } catch (e) { }
}

// --- SISTEMA DE LICENCIAS PRO (validación en el servidor) ---
function tieneLicencia() {
    return !!leerLicencia();
}

async function comprobarClave(clave) {
    try {
        const res = await fetch('/api/licencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clave: clave })
        });
        const data = await res.json().catch(() => ({}));
        return data.ok === true;
    } catch (e) {
        return null; // sin conexión
    }
}

function verificarYEntrar(idVista) {
    if (tieneLicencia()) {
        abrirModuloDirecto(idVista);
    } else {
        destinoPendiente = idVista;
        const inputClave = document.getElementById('input-clave-licencia');
        const errClave = document.getElementById('error-clave-licencia');
        const modal = document.getElementById('modal-licencia');

        if (inputClave) inputClave.value = '';
        if (errClave) errClave.style.display = 'none';
        if (modal) modal.style.display = 'flex';
    }
}

function cerrarModalLicencia() {
    const modal = document.getElementById('modal-licencia');
    if (modal) modal.style.display = 'none';
    destinoPendiente = null;
}

async function validarClaveAcceso() {
    const inputEl = document.getElementById('input-clave-licencia');
    const val = inputEl ? inputEl.value.trim().toUpperCase() : '';
    const err = document.getElementById('error-clave-licencia');

    if (!val) {
        if (err) { err.textContent = "❌ Por favor introduce una clave."; err.style.display = 'block'; }
        return;
    }
    if (err) { err.textContent = "⏳ Comprobando..."; err.style.display = 'block'; }

    const ok = await comprobarClave(val);

    if (ok === true) {
        const destino = destinoPendiente; // guardarlo ANTES de cerrar el modal
        guardarLicencia(val);
        cerrarModalLicencia();
        actualizarBotonEstado();
        if (destino) abrirModuloDirecto(destino);
    } else if (ok === null) {
        if (err) err.textContent = "❌ Sin conexión. Inténtalo de nuevo.";
    } else {
        if (err) err.textContent = "❌ Clave incorrecta o no válida";
    }
}

function gestionarBotonLicencia() {
    if (tieneLicencia()) {
        if (confirm("¿Deseas cerrar sesión y bloquear los módulos Pro de nuevo?")) {
            borrarLicencia();
            actualizarBotonEstado();
            abrirModuloDirecto('vista-inicio');
        }
    } else {
        verificarYEntrar('vista-ve');
    }
}

function actualizarBotonEstado() {
    const b = document.getElementById('btn-estado-licencia');
    if (b) {
        b.innerHTML = tieneLicencia() ? '🟢 Licencia Activa (Cerrar)' : '🔑 Activar Licencia Pro';
        b.style.color = tieneLicencia() ? '#10b981' : '#94a3b8';
    }
}

// --- NAVEGACIÓN ENTRE MÓDULOS ---
function abrirModuloDirecto(idVista) {
    document.querySelectorAll('.vista-section').forEach(sec => sec.classList.add('oculto'));
    const destino = document.getElementById(idVista);
    if (destino) destino.classList.remove('oculto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- SÍNTESIS DE VOZ DE ELENA ---
function hablarComoElena(texto) {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const avatarBox = document.getElementById('elena-avatar-container');
    const limpio = String(texto)
        .replace(/<[^>]*>?/gm, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\*+/g, '')
        .replace(/[#_`]/g, '');

    const utterance = new SpeechSynthesisUtterance(limpio);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.15;

    utterance.onstart = () => {
        if (avatarBox) {
            avatarBox.style.borderColor = 'var(--verde-ia)';
            avatarBox.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.8)';
            avatarBox.style.transform = 'scale(1.05)';
        }
    };

    utterance.onend = () => {
        if (avatarBox) {
            avatarBox.style.borderColor = 'var(--azul-brillante)';
            avatarBox.style.boxShadow = '0 0 15px rgba(24, 143, 167, 0.4)';
            avatarBox.style.transform = 'scale(1)';
        }
    };

    const voces = window.speechSynthesis.getVoices();
    const vozFemenina = voces.find(v =>
        (v.lang.includes('es') || v.lang.includes('ES')) &&
        (
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('monica') ||
            v.name.toLowerCase().includes('helena') ||
            v.name.toLowerCase().includes('lucia') ||
            v.name.toLowerCase().includes('laura') ||
            v.name.toLowerCase().includes('sofia') ||
            v.name.toLowerCase().includes('google español')
        )
    );
    if (vozFemenina) utterance.voice = vozFemenina;

    window.speechSynthesis.speak(utterance);
}

function silenciarAElena() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// --- GESTOR TÉCNICO Y WHATSAPP ---
const TELEFONO_JF = "34642269680";

function enviarConsultaWhatsApp() {
    const nombre = document.getElementById('gestor-nombre')?.value.trim() || 'Cliente';
    const tipo = document.getElementById('gestor-tipo')?.value || 'Consulta General';
    const mensaje = document.getElementById('gestor-mensaje')?.value.trim() || 'Sin detalles adicionales.';

    const texto =
        `*CONSULTA TÉCNICA - J.F*\n` +
        `👤 *Nombre:* ${nombre}\n` +
        `🏷️ *Tipo:* ${tipo}\n` +
        `📝 *Detalle:* ${mensaje}`;

    // location.href funciona correctamente dentro de WebView/PWA/App empaquetada
    window.location.href = `https://wa.me/${TELEFONO_JF}?text=${encodeURIComponent(texto)}`;
}

// ==========================================
// DIAGNÓSTICO CON ELENA
// ==========================================
async function diagnosticarConIA() {
    const nombre = document.getElementById('gestor-nombre')?.value.trim();
    const tipo = document.getElementById('gestor-tipo')?.value;
    const mensaje = document.getElementById('gestor-mensaje')?.value.trim();
    const resBox = document.getElementById('gestor-ia-resultado');

    if (!mensaje) {
        alert("Por favor, escribe una descripción de la avería o consulta técnica.");
        return;
    }

    if (resBox) {
        resBox.classList.remove('oculto');
        resBox.innerHTML = `<em>Elena está analizando la consulta técnica...</em>`;
    }

    const promptCompleto = `Consulta técnica: ${tipo}. Cliente: ${nombre || 'No especificado'}. Descripción del problema: ${mensaje}`;

    try {
        const raw = (await consultarElena(conInstrucciones(promptCompleto))) || "Diagnóstico completado.";
        if (resBox) {
            resBox.innerHTML = `
                <h4 style="margin: 0 0 10px 0; color: var(--verde-ia);">📋 Diagnóstico Técnico de Elena:</h4>
                <div style="line-height: 1.6; max-height: 450px; overflow-y: auto; padding-right: 10px;">
                    ${formatearTextoElena(raw)}
                </div>
                ${AVISO_ORIENTATIVO}
            `;
        }
        hablarComoElena(raw);
    } catch (err) {
        console.error("Error en diagnóstico IA:", err);
        if (resBox) {
            resBox.innerHTML = `
                <p style="color:#ef4444;">
                    <strong>❌ Error al conectar con Elena</strong><br><br>
                    ${escaparHTML(err.message)}<br><br>
                    Puedes pulsar en <strong>Enviar por WhatsApp</strong> para soporte directo.
                </p>
            `;
        }
    }
}

// --- BUSCADOR NORMATIVO ---
function buscarTermino(term) {
    const input = document.getElementById('entrada-busqueda');
    if (input) input.value = term;
    ejecutarBusquedaNormativa();
}

async function ejecutarBusquedaNormativa() {
    const input = document.getElementById('entrada-busqueda');
    const resBox = document.getElementById('resultados-busqueda');
    const query = input ? input.value.trim() : '';

    if (!query || !resBox) {
        alert("Escribe una consulta técnica o normativa.");
        return;
    }

    resBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; color:var(--azul-brillante); padding:10px 0;">
            <span>⏳</span>
            <em>Elena está analizando tu consulta en el REBT, RITE e ITCs...</em>
        </div>
    `;

    try {
        const raw = (await consultarElena(conInstrucciones(
            `Consulta de normativa técnica REBT/RITE/ICT: "${query}". Responde con precisión, indicando las ITCs, fórmulas, tipos de protección y requisitos legales que apliquen.`
        ))) || "No se obtuvo respuesta.";

        resBox.innerHTML = `
            <div style="padding:10px 0;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                    <span style="font-size:1.3rem;">👩‍💼⚡</span>
                    <strong style="color:var(--verde-ia); font-size:1.05rem;">Respuesta de Elena:</strong>
                </div>
                <div style="line-height:1.6; color:var(--texto-principal); font-size:0.95rem; max-height:450px; overflow-y:auto; padding-right:10px;">
                    ${formatearTextoElena(raw)}
                </div>
                ${AVISO_ORIENTATIVO}
            </div>
        `;
        hablarComoElena(raw);
    } catch (err) {
        console.warn("Fallo de API, usando base local de respaldo:", err);
        const baseDatos = [
            {
                k: "diferencial",
                t: "Tipos de Interruptores Diferenciales",
                d: "• <strong>Tipo AC:</strong> Solo corriente alterna senoidal.<br>• <strong>Tipo A:</strong> Alterna y continua pulsante (electrónica doméstica).<br>• <strong>Tipo F:</strong> Para monofásicos con variador de frecuencia (bombas de calor, lavadoras inverter).<br>• <strong>Tipo B:</strong> Corriente continua pura (fotovoltaica, cargadores VE rápidos)."
            },
            {
                k: "itc-bt-14",
                t: "ITC-BT-14: Línea General de Alimentación (LGA)",
                d: "Enlaza la CGP con los contadores. Caída de tensión máxima: 0,5% con contadores totalmente centralizados y 1% con contadores parcialmente centralizados. Verifica en el texto oficial."
            },
            {
                k: "itc-bt-15",
                t: "ITC-BT-15: Derivaciones Individuales",
                d: "Caída de tensión máxima: 1% con contadores totalmente centralizados, 2% con contadores parcialmente centralizados y 1,5% para un único usuario. Sección mínima 6 mm² Cu. Verifica en el texto oficial."
            },
            {
                k: "itc-bt-19",
                t: "ITC-BT-19: Instalaciones Interiores",
                d: "Caída de tensión máxima desde el origen de la instalación interior: 3% en alumbrado y 5% en el resto de usos."
            },
            {
                k: "itc-bt-25",
                t: "ITC-BT-25: Circuitos en Viviendas",
                d: "C1 (Iluminación 10A - 1,5mm²), C2 (Tomas generales 16A - 2,5mm²), C3 (Cocina/Horno 25A - 6mm²), C4 (Lavadora/Lavavajillas/Termo 20A - 4mm²), C5 (Baños/Cocina 16A - 2,5mm²)."
            },
            {
                k: "itc-bt-52",
                t: "ITC-BT-52: Vehículos Eléctricos",
                d: "Diferencial con detección de 6 mA DC (o Tipo B), magnetotérmico y protección contra sobretensiones. Consulta el esquema aplicable en el texto oficial."
            },
            {
                k: "rite",
                t: "RITE IT 1.1.4: Calidad del Aire Interior (IDA)",
                d: "Caudales mínimos de aire exterior: IDA 1 (20 dm³/s·p), IDA 2 (12,5 dm³/s·p), IDA 3 (8 dm³/s·p), IDA 4 (5 dm³/s·p)."
            }
        ];

        const qMin = query.toLowerCase();
        const matches = baseDatos.filter(item =>
            item.k.includes(qMin) || item.t.toLowerCase().includes(qMin) || item.d.toLowerCase().includes(qMin)
        );

        if (matches.length > 0) {
            resBox.innerHTML = matches.map(m => `
                <div style="padding:10px 0;">
                    <strong style="color:var(--azul-brillante); font-size:1.05rem;">${m.t}</strong>
                    <p style="margin:6px 0 0 0; color:#cbd5e1; font-size:0.92rem; line-height:1.5;">${m.d}</p>
                </div>
            `).join('<hr style="border-color:var(--bordes); margin:12px 0;">') + AVISO_ORIENTATIVO;
        } else {
            resBox.innerHTML = `
                <p style="color:#ef4444;">
                    <strong>❌ Error al conectar con Elena</strong><br><br>
                    ${escaparHTML(err.message)}<br><br>
                    Inténtalo de nuevo en unos segundos o escribe a J.F por WhatsApp.
                </p>
            `;
        }
    }
}

// --- CONSULTOR ICT-2 ---
function buscarTerminoICT(term) {
    const input = document.getElementById('ict-busqueda-input');
    if (input) input.value = term;
    consultarICTConIA();
}

async function consultarICTConIA() {
    const input = document.getElementById('ict-busqueda-input');
    const resBox = document.getElementById('ict-ia-resultado');
    const consulta = input ? input.value.trim() : '';

    if (!consulta || !resBox) {
        alert("Escribe una consulta técnica o avería de ICT.");
        return;
    }

    resBox.classList.remove('oculto');
    resBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; color:var(--azul-brillante);">
            <span>⏳</span>
            <em>Elena está analizando la normativa ICT-2 (RD 346/2011) y REBT...</em>
        </div>
    `;

    try {
        const raw = (await consultarElena(conInstrucciones(
            `Responde a esta consulta de ICT-2: "${consulta}". Organiza la respuesta en: 1. Normativa y Requisitos, 2. Canalizaciones y Cableados, 3. Cuadro Eléctrico y 4. Enlaces Oficiales del BOE/Ministerio.`
        ))) || "No se obtuvo respuesta del servidor.";

        resBox.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                <span style="font-size:1.3rem;">📡⚡</span>
                <strong style="color:var(--verde-ia); font-size:1.05rem;">Resolución Técnica de Elena:</strong>
            </div>
            <div style="line-height:1.6; font-size:0.95rem; max-height:450px; overflow-y:auto; padding-right:10px;">
                ${formatearTextoElena(raw)}
            </div>
            ${AVISO_ORIENTATIVO}
        `;
        hablarComoElena(raw);
    } catch (err) {
        console.warn("Error en consulta ICT online, cargando base local:", err);
        resBox.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                <span style="font-size:1.3rem;">📡📘</span>
                <strong style="color:var(--azul-brillante); font-size:1.05rem;">Normativa ICT-2 (RD 346/2011) · Resumen orientativo</strong>
            </div>
            <div style="line-height:1.6; font-size:0.92rem; color:#cbd5e1;">
                <p style="color:#f59e0b;"><strong>⚠️ Sin conexión con Elena.</strong> Las cifras siguientes son orientativas: verifícalas en el texto oficial antes de aplicarlas.</p>
                <p><strong>Dimensiones de recintos (RITI y RITS):</strong></p>
                <table class="tabla-normativa" style="margin-bottom:15px;">
                    <tr><th>Edificación</th><th>RITI (Inferior)</th><th>RITS (Superior)</th></tr>
                    <tr><td>Hasta 20 PAU</td><td>2,00 × 1,00 × 2,30 m</td><td>2,00 × 1,00 × 2,30 m</td></tr>
                    <tr><td>De 21 a 45 PAU</td><td>2,00 × 1,50 × 2,30 m</td><td>2,00 × 1,50 × 2,30 m</td></tr>
                    <tr><td>Más de 45 PAU</td><td>2,00 × 2,00 × 2,30 m</td><td>2,00 × 2,00 × 2,30 m</td></tr>
                </table>
                <p><strong>Cuadro eléctrico y REBT:</strong><br>
                • Barra equipotencial conectada a la tierra general del edificio.<br>
                • Protecciones según el REBT y el anexo del RD 346/2011.</p>
                <p><strong>Enlaces oficiales:</strong><br>
                • <a href="https://www.boe.es/buscar/act.php?id=BOE-A-2011-5900" target="_blank" rel="noopener noreferrer" style="color:var(--azul-brillante); font-weight:bold;">Real Decreto 346/2011 (Reglamento ICT) ↗</a>
                </p>
            </div>
        `;
    }
}

// --- CÁLCULO DE CAÍDA DE TENSIÓN ---
function calcularSeccionCable() {
    const sistema = document.getElementById('calc-sistema')?.value || 'mono';
    const P = parseFloat(document.getElementById('calc-potencia')?.value) || 0;
    const L = parseFloat(document.getElementById('calc-longitud')?.value) || 0;
    const conductividad = parseFloat(document.getElementById('calc-material')?.value) || 56;
    const ePorc = parseFloat(document.getElementById('calc-porcentaje-max')?.value) || 1.5;

    const V = (sistema === 'mono') ? 230 : 400;
    const eVoltios = (V * ePorc) / 100;

    const seccionCalculada = (sistema === 'mono')
        ? ((2 * L * P) / (conductividad * eVoltios * V))
        : ((L * P) / (conductividad * eVoltios * V));

    const seccionesNormalizadas = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
    const seccionComercial = seccionesNormalizadas.find(s => s >= seccionCalculada) || "Superior a 240";
    const resBox = document.getElementById('resultado-caida-box');

    if (resBox) {
        resBox.classList.remove('oculto');
        resBox.innerHTML = `
            <h4 style="margin:0 0 10px 0; color:var(--verde-ia);">⚡ Resultados del Cálculo:</h4>
            <p>• <strong>Sección Teórica Requerida:</strong> ${seccionCalculada.toFixed(2)} mm²</p>
            <p>• <strong>Sección Comercial Recomendada:</strong> <span style="color:var(--azul-brillante); font-size:1.15rem; font-weight:bold;">${seccionComercial} mm²</span></p>
            <p>• <strong>Caída Admisible:</strong> ${eVoltios.toFixed(2)} V (${ePorc}%)</p>
            <p style="font-size:0.8rem; color:#94a3b8;">Solo criterio de caída de tensión. Comprueba también la intensidad admisible del cable (ITC-BT-19) y que la protección lo cubre.</p>
        `;
    }
}

// --- CÁLCULO VEHÍCULO ELÉCTRICO (ITC-BT-52) ---
function calcularVE() {
    const potencia = parseFloat(document.getElementById('ve-potencia')?.value) || 7.4;
    const longitud = parseFloat(document.getElementById('ve-longitud')?.value) || 20;
    const conductividadCobre = 48.5; // Cu a 70 °C
    const trifasico = potencia > 7.4;
    const V = trifasico ? 400 : 230;

    const protecciones = {
        3.7: "Curva C - 16A",
        7.4: "Curva C - 32A",
        11: "Curva C - 16A (Tetrapolar)",
        22: "Curva C - 32A (Tetrapolar)"
    };
    const magnetotermico = protecciones[potencia] || "Curva C - 32A";

    const seccionesOpciones = [6, 10, 16, 25, 35, 50];
    let seccion = seccionesOpciones[0];
    let porcentaje = 0;

    for (const s of seccionesOpciones) {
        seccion = s;
        const caida = trifasico
            ? (potencia * 1000 * longitud) / (conductividadCobre * s * V)
            : (2 * potencia * 1000 * longitud) / (conductividadCobre * s * V);
        porcentaje = (caida / V) * 100;
        if (porcentaje <= 1.5) break;
    }

    // Caja de resultados creada bajo el botón (en vez de alert)
    let box = document.getElementById('ve-res-box');
    if (!box) {
        const seccionVE = document.querySelector('#vista-ve .seccion-bloque');
        if (!seccionVE) return;
        box = document.createElement('div');
        box.id = 've-res-box';
        box.className = 'resultado-caja';
        seccionVE.appendChild(box);
    }
    box.classList.remove('oculto');
    box.innerHTML = `
        <h4 style="margin:0 0 10px 0; color:var(--verde-ia);">🚗 Resultados Punto de Carga (ITC-BT-52):</h4>
        <p>• <strong>Sección mínima de cobre:</strong> <span style="color:var(--azul-brillante); font-weight:bold;">${seccion} mm²</span></p>
        <p>• <strong>Magnetotérmico:</strong> ${magnetotermico}</p>
        <p>• <strong>Diferencial:</strong> 30 mA con detección de 6 mA DC (o Tipo B)</p>
        <p>• <strong>Caída estimada:</strong> ${porcentaje.toFixed(2)}%</p>
        <p style="font-size:0.8rem; color:#94a3b8;">Orientativo. Comprueba el esquema de instalación aplicable y la intensidad admisible según el método de instalación.</p>
    `;
}

// --- CÁLCULO SOLAR FOTOVOLTAICA ---
function calcularSolar() {
    const wPanel = parseFloat(document.getElementById('solar-w-panel')?.value) || 450;
    const numPaneles = parseInt(document.getElementById('solar-num-paneles')?.value) || 10;
    const voc = parseFloat(document.getElementById('solar-voc')?.value) || 49.5;

    const potPicoTotal = (wPanel * numPaneles) / 1000;
    const tensionVocString = voc * numPaneles;
    const box = document.getElementById('solar-res-box');

    if (box) {
        box.classList.remove('oculto');
        box.innerHTML = `
            <h4 style="margin:0 0 10px 0; color:var(--verde-ia);">☀️ Resultados Fotovoltaica:</h4>
            <p>• <strong>Potencia Pico Total:</strong> ${potPicoTotal.toFixed(2)} kWp</p>
            <p>• <strong>Tensión Voc del string (a 25 °C):</strong> ${tensionVocString.toFixed(1)} V DC</p>
            <p>• <strong>Protección DC:</strong> fusibles gPV (si procede) y descargador Tipo 2 DC.</p>
            <p style="font-size:0.8rem; color:#94a3b8;">Con frío el Voc sube: corrígelo con el coeficiente de temperatura del panel a la temperatura mínima del lugar y comprueba que no supera la tensión máxima del inversor.</p>
        `;
    }
}

// --- CÁLCULO MOTOR ---
function calcularMotor() {
    const kw = parseFloat(document.getElementById('motor-kw')?.value || 5.5);
    const v = parseFloat(document.getElementById('motor-voltaje')?.value || 400);
    const fp = parseFloat(document.getElementById('motor-fp')?.value || 0.85);
    const rend = parseFloat(document.getElementById('motor-rend')?.value || 0.88);

    const iNominal = (kw * 1000) / (Math.sqrt(3) * v * fp * rend);

    const box = document.getElementById('motor-res-box');
    if (box) {
        box.classList.remove('oculto');
        box.innerHTML = `
            <h4 style="margin:0 0 10px 0; color:var(--verde-ia);">⚙️ Resultados Motor:</h4>
            <p>• <strong>Intensidad Nominal calculada:</strong> <span style="color:var(--azul-brillante); font-weight:bold;">${iNominal.toFixed(2)} A</span></p>
            <p>• <strong>Guardamotor:</strong> elige uno cuyo rango incluya ${iNominal.toFixed(1)} A y ajústalo a la intensidad de la placa de características.</p>
            <p>• <strong>Arranque:</strong> ${kw > 5.5 ? 'valora Estrella-Triángulo o arrancador suave' : 'arranque directo habitual'} (la ITC-BT-47 limita la intensidad de arranque según la potencia).</p>
        `;
    }
}

// --- GENERADOR KNX ---
function generarKNX() {
    const area = document.getElementById('knx-area')?.value || 1;
    const linea = document.getElementById('knx-linea')?.value || 1;
    const disp = document.getElementById('knx-dispositivo')?.value || 10;
    const dirFisica = `${area}.${linea}.${disp}`;

    const box = document.getElementById('knx-res-box');
    if (box) {
        box.classList.remove('oculto');
        box.innerHTML = `
            <h4 style="margin:0 0 10px 0; color:var(--verde-ia);">🟢 Parámetros ETS Generados:</h4>
            <p>• <strong>Dirección Física Individual:</strong> <span style="color:var(--azul-brillante); font-weight:bold; font-size:1.1rem;">${escaparHTML(dirFisica)}</span></p>
            <p>• <strong>Esquema de Grupos sugerido:</strong> 1/1/${escaparHTML(disp)}</p>
            <p>• <strong>Cable de Bus:</strong> par trenzado apantallado verde certificado KNX.</p>
        `;
    }
}

// ==========================================
// INICIALIZACIÓN DE EVENTOS DEL DOM
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("J.F iniciado correctamente");
    actualizarBotonEstado();

    // Revalida la clave guardada (si la retiras en Vercel, deja de funcionar)
    const guardada = leerLicencia();
    if (guardada) {
        comprobarClave(guardada).then(ok => {
            if (ok === false) {
                borrarLicencia();
                actualizarBotonEstado();
            }
        });
    }

    const inputClaveModal = document.getElementById('input-clave-licencia');
    if (inputClaveModal) {
        inputClaveModal.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') validarClaveAcceso();
        });
    }

    const inputBusqueda = document.getElementById('entrada-busqueda');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') ejecutarBusquedaNormativa();
        });
    }

    const inputICT = document.getElementById('ict-busqueda-input');
    if (inputICT) {
        inputICT.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') consultarICTConIA();
        });
    }

    // --- Simulador Marcha / Paro ---
    const btnMarcha = document.getElementById('sim-btn-marcha');
    const btnParo = document.getElementById('sim-btn-paro');
    const estadoS1 = document.getElementById('estado-s1');
    const estadoS2 = document.getElementById('estado-s2');
    const estadoKm1 = document.getElementById('estado-km1-aux');
    const estadoBobina = document.getElementById('estado-bobina');
    const pilotoMotor = document.getElementById('piloto-motor');
    const txtMotor = document.getElementById('motor-estado-txt');

    if (btnMarcha && btnParo) {
        btnMarcha.addEventListener('click', () => {
            if (estadoS2) { estadoS2.textContent = "CERRADO (Pulsado)"; estadoS2.style.color = "#10b981"; }
            if (estadoKm1) { estadoKm1.textContent = "CERRADO (Retenido 13-14)"; estadoKm1.style.color = "#10b981"; }
            if (estadoBobina) { estadoBobina.textContent = "ACTIVADA (230V A1-A2)"; estadoBobina.style.color = "#10b981"; }
            if (pilotoMotor) { pilotoMotor.style.backgroundColor = "#10b981"; pilotoMotor.style.boxShadow = "0 0 20px #10b981"; }
            if (txtMotor) { txtMotor.textContent = "⚡ MOTOR EN MARCHA"; txtMotor.style.color = "#10b981"; }
        });

        btnParo.addEventListener('click', () => {
            if (estadoS1) { estadoS1.textContent = "ABIERTO (Pulsado)"; estadoS1.style.color = "#ef4444"; }
            if (estadoKm1) { estadoKm1.textContent = "ABIERTO"; estadoKm1.style.color = "#ef4444"; }
            if (estadoBobina) { estadoBobina.textContent = "DESACTIVADA (0V)"; estadoBobina.style.color = "#94a3b8"; }
            if (pilotoMotor) { pilotoMotor.style.backgroundColor = "#2a3441"; pilotoMotor.style.boxShadow = "none"; }
            if (txtMotor) { txtMotor.textContent = "MOTOR DETENIDO"; txtMotor.style.color = "#94a3b8"; }
        });
    }

    // --- Calculadora IVA ---
    const btnFactura = document.getElementById('btn-calcular-factura');
    if (btnFactura) {
        btnFactura.addEventListener('click', () => {
            const base = parseFloat(document.getElementById('fac-precio')?.value || 0);
            const iva = base * 0.21;
            const total = base + iva;
            const tBase = document.getElementById('total-base');
            const tIva = document.getElementById('total-iva');
            const tFactura = document.getElementById('total-factura');

            if (tBase) tBase.textContent = base.toFixed(2) + " €";
            if (tIva) tIva.textContent = iva.toFixed(2) + " €";
            if (tFactura) tFactura.textContent = total.toFixed(2) + " €";
        });
    }

    // --- Tarifas ---
    const btnTarifa = document.getElementById('btn-calcular-tarifa');
    if (btnTarifa) {
        btnTarifa.addEventListener('click', () => {
            const h = parseFloat(document.getElementById('tarifa-horas')?.value || 0);
            const ph = parseFloat(document.getElementById('tarifa-precio-hora')?.value || 0);
            const desp = parseFloat(document.getElementById('tarifa-desplazamiento')?.value || 0);
            const subMO = h * ph;
            const total = subMO + desp;
            const sHoras = document.getElementById('subtotal-horas');
            const sDesp = document.getElementById('subtotal-desplazamiento');
            const tEstimado = document.getElementById('total-estimado');

            if (sHoras) sHoras.textContent = subMO.toFixed(2) + " €";
            if (sDesp) sDesp.textContent = desp.toFixed(2) + " €";
            if (tEstimado) tEstimado.textContent = total.toFixed(2) + " €";
        });
    }

    // --- VOZ DE ELENA ---
    const btnVoz = document.getElementById('btn-hablar-asesor');
    const statusVoz = document.getElementById('status-voz');
    const respuestaBox = document.getElementById('respuesta-voz-box');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (btnVoz) {
        if (!SpeechRecognition) {
            if (statusVoz) statusVoz.innerText = "Reconocimiento de voz no soportado. Usa Chrome o Edge.";
            btnVoz.disabled = true;
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            btnVoz.innerText = "🛑 Escuchando a Elena... Habla ahora";
            btnVoz.style.backgroundColor = "#e53e3e";
            if (statusVoz) statusVoz.innerText = "Escuchando consulta...";
        };

        recognition.onresult = async (event) => {
            const pregunta = event.results[0][0].transcript;
            const preguntaSegura = escaparHTML(pregunta);
            if (statusVoz) statusVoz.innerText = `Pregunta: "${pregunta}"`;
            btnVoz.innerText = "⏳ Elena está pensando...";
            btnVoz.style.backgroundColor = "var(--azul-tecnico)";

            if (respuestaBox) {
                respuestaBox.classList.remove('oculto');
                respuestaBox.innerHTML = `<strong>Tú:</strong> ${preguntaSegura}<br><br><em>Elena está analizando la consulta...</em>`;
            }

            try {
                const raw = (await consultarElena(conInstrucciones(pregunta))) || "No se obtuvo respuesta del servidor.";
                if (respuestaBox) {
                    respuestaBox.innerHTML = `
                        <strong>Tú:</strong> ${preguntaSegura}<br><br>
                        <strong>Elena:</strong><br>
                        <div style="max-height:450px; overflow-y:auto;">
                            ${formatearTextoElena(raw)}
                        </div>
                        ${AVISO_ORIENTATIVO}
                    `;
                }
                hablarComoElena(raw);
            } catch (err) {
                console.error("Error al consultar la API:", err);
                if (respuestaBox) {
                    respuestaBox.innerHTML = `
                        <strong style="color:#ef4444;">❌ Error al conectar con Elena</strong><br><br>
                        ${escaparHTML(err.message)}
                    `;
                }
            } finally {
                btnVoz.innerText = "🎙️ Hablar con Elena";
                btnVoz.style.backgroundColor = "var(--azul-tecnico)";
            }
        };

        recognition.onerror = (event) => {
            console.error("Error de voz:", event.error);
            if (statusVoz) statusVoz.innerText = `Error: ${event.error}`;
            btnVoz.innerText = "🎙️ Hablar con Elena";
            btnVoz.style.backgroundColor = "var(--azul-tecnico)";
        };

        recognition.onend = () => {
            if (btnVoz.innerText.includes("Escuchando")) {
                btnVoz.innerText = "🎙️ Hablar con Elena";
                btnVoz.style.backgroundColor = "var(--azul-tecnico)";
            }
        };

        btnVoz.addEventListener('click', () => {
            window.speechSynthesis.cancel();
            recognition.start();
        });
    }
});

// ==========================================
// REGISTRO SERVICE WORKER (MODO OFFLINE PWA)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado en J.F:', reg.scope))
            .catch(err => console.log('Error en el registro del Service Worker:', err));
    });
}

// ==========================================
// EXPOSICIÓN GLOBAL DE FUNCIONES
// ==========================================
window.tieneLicencia = tieneLicencia;
window.comprobarClave = comprobarClave;
window.verificarYEntrar = verificarYEntrar;
window.cerrarModalLicencia = cerrarModalLicencia;
window.validarClaveAcceso = validarClaveAcceso;
window.gestionarBotonLicencia = gestionarBotonLicencia;
window.actualizarBotonEstado = actualizarBotonEstado;
window.abrirModuloDirecto = abrirModuloDirecto;
window.hablarComoElena = hablarComoElena;
window.silenciarAElena = silenciarAElena;
window.enviarConsultaWhatsApp = enviarConsultaWhatsApp;
window.diagnosticarConIA = diagnosticarConIA;
window.buscarTermino = buscarTermino;
window.ejecutarBusquedaNormativa = ejecutarBusquedaNormativa;
window.buscarTerminoICT = buscarTerminoICT;
window.consultarICTConIA = consultarICTConIA;
window.calcularSeccionCable = calcularSeccionCable;
window.calcularVE = calcularVE;
window.calcularSolar = calcularSolar;
window.calcularMotor = calcularMotor;
window.generarKNX = generarKNX;