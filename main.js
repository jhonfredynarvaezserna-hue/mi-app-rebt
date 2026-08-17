// ==========================================
// SERVICIO Y GESTIÓN SM - LÓGICA PRINCIPAL
// ==========================================

const TELEFONO_WHATSAPP = "34642269680";
const CLAVE_MAESTRA = "SM-ADMIN-7788";
const CLAVES_VALIDAS = ["SM-PRO-2026", "SM-CLIENTE-01", "SM-CLIENTE-02"];
let destinoPendiente = null;

// --- SISTEMA DE LICENCIAS PRO ---
function tieneLicencia() {
    const clave = localStorage.getItem("licencia_sm_activa");
    return (clave === CLAVE_MAESTRA || CLAVES_VALIDAS.includes(clave));
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

function validarClaveAcceso() {
    const val = document.getElementById('input-clave-licencia')?.value.trim();
    const err = document.getElementById('error-clave-licencia');

    if (val === CLAVE_MAESTRA || CLAVES_VALIDAS.includes(val)) {
        localStorage.setItem("licencia_sm_activa", val);
        cerrarModalLicencia();
        actualizarBotonEstado();
        if (destinoPendiente) {
            abrirModuloDirecto(destinoPendiente);
            destinoPendiente = null;
        }
    } else if (err) {
        err.style.display = 'block';
    }
}

function gestionarBotonLicencia() {
    if (tieneLicencia()) {
        if (confirm("¿Deseas cerrar sesión y bloquear los módulos de nuevo?")) {
            localStorage.removeItem("licencia_sm_activa");
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

// --- SÍNTESIS DE VOZ DE ELENA (INGENIERA TÉCNICA) ---
function hablarComoElena(texto) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const limpio = texto.replace(/<[^>]*>?/gm, '');
    const utterance = new SpeechSynthesisUtterance(limpio);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.15;

    const voces = window.speechSynthesis.getVoices();
    const vozFemenina = voces.find(v => 
        (v.lang.includes('es') || v.lang.includes('ES')) && 
        (v.name.toLowerCase().includes('female') || 
         v.name.toLowerCase().includes('monica') || 
         v.name.toLowerCase().includes('helena') || 
         v.name.toLowerCase().includes('lucia') || 
         v.name.toLowerCase().includes('laura') || 
         v.name.toLowerCase().includes('sofia') ||
         v.name.toLowerCase().includes('google español'))
    );

    if (vozFemenina) utterance.voice = vozFemenina;
    window.speechSynthesis.speak(utterance);
}

// --- GESTOR TÉCNICO Y WHATSAPP ---
function enviarConsultaWhatsApp() {
    const nombre = document.getElementById('gestor-nombre')?.value.trim() || 'Cliente';
    const tipo = document.getElementById('gestor-tipo')?.value || 'Consulta General';
    const mensaje = document.getElementById('gestor-mensaje')?.value.trim() || 'Sin detalles adicionales.';

    const textoWhatsApp = `*CONSULTA TÉCNICA - GESTIÓN SM*%0A` +
        `👤 *Nombre:* ${encodeURIComponent(nombre)}%0A` +
        `🏷️ *Tipo:* ${encodeURIComponent(tipo)}%0A` +
        `📝 *Detalle:* ${encodeURIComponent(mensaje)}`;

    const url = `https://wa.me/${TELEFONO_WHATSAPP}?text=${textoWhatsApp}`;
    window.open(url, '_blank');
}

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
        resBox.innerHTML = `<em>Elena está analizando la consulta técnica con Gemini...</em>`;
    }

    const promptCompleto = `Consulta técnica: ${tipo}. Cliente: ${nombre || 'No especificado'}. Descripción del problema: ${mensaje}`;

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptCompleto })
        });

        const data = await res.json();
        const respuesta = data.text || data.respuesta || "Diagnóstico completado.";

        if (resBox) {
            resBox.innerHTML = `
                <h4 style="margin: 0 0 10px 0; color: var(--verde-ia);">📋 Diagnóstico Técnico de Elena:</h4>
                <div style="line-height: 1.6;">${respuesta}</div>
            `;
        }
    } catch (err) {
        console.error("Error en diagnóstico IA:", err);
        if (resBox) {
            resBox.innerHTML = `<p style="color: #ef4444;">No se pudo conectar con el servicio IA. Puedes pulsar en <strong>Enviar por WhatsApp</strong> para soporte directo.</p>`;
        }
    }
}

// --- BUSCADOR NORMATIVO DIRECTO A GEMINI ---
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
        <div style="display: flex; align-items: center; gap: 10px; color: var(--azul-brillante); padding: 10px 0;">
            <span>⏳</span> <em>Elena está analizando tu consulta en el REBT, RITE e ITCs...</em>
        </div>
    `;

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: `Consulta de normativa técnica REBT/RITE/ICT: "${query}". Responde con rigor técnico, citando las ITCs, fórmulas, tipos de protección y requisitos legales aplicables.` 
            })
        });

        if (!res.ok) throw new Error("Error en respuesta de API");

        const data = await res.json();
        const textoRespuesta = data.text || data.respuesta || "No se obtuvo respuesta.";

        resBox.innerHTML = `
            <div style="padding: 10px 0;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <span style="font-size: 1.3rem;">👩‍💼⚡</span>
                    <strong style="color: var(--verde-ia); font-size: 1.05rem;">Respuesta Oficial de Elena:</strong>
                </div>
                <div style="line-height: 1.6; color: var(--texto-principal); font-size: 0.95rem;">
                    ${textoRespuesta}
                </div>
            </div>
        `;
    } catch (err) {
        console.warn("Fallo de API, usando base local de respaldo:", err);

        const baseDatos = [
            { k: "diferencial", t: "ITC-BT-24 / Tipos de Interruptores Diferenciales", d: "• <strong>Tipo AC:</strong> Solo corriente alterna senoidal.<br>• <strong>Tipo A:</strong> Alterna y continua pulsante (obligatorio en VE y electrónica doméstica).<br>• <strong>Tipo F:</strong> Para monofásicos con variador de frecuencia (bombas de calor, lavadoras inverter). Detecta frecuencias mixtas hasta 1 kHz.<br>• <strong>Tipo B:</strong> Corriente continua alisada pura (fotovoltaica trifásica, cargadores VE rápidos)." },
            { k: "itc-bt-15", t: "ITC-BT-15: Derivaciones Individuales", d: "Caída de tensión máxima: 1,5% para contadores centralizados en un único punto y 0,5% para contadores individuales. Conductor mínimo: 6 mm² Cu libre de halógenos." },
            { k: "itc-bt-19", t: "ITC-BT-19: Instalaciones Interiores", d: "Caída máxima: 3% para alumbrado y 5% para usos generales y fuerza motriz." },
            { k: "itc-bt-25", t: "ITC-BT-25: Circuitos en Viviendas", d: "C1 (Iluminación 10A - 1,5mm²), C2 (Tomas uso general 16A - 2,5mm²), C3 (Cocina/Horno 25A - 6mm²), C4 (Lavadora/Lavavajillas/Termo 20A - 4mm²), C5 (Baños/Cocina 16A - 2,5mm²)." },
            { k: "itc-bt-52", t: "ITC-BT-52: Vehículos Eléctricos", d: "Protección diferencial con filtro DC (6mA DC) Clase A o Tipo B, magnetotérmico curva C y protector de sobretensiones permanente y transitoria Tipo 2." },
            { k: "rite", t: "RITE IT 1.1.4: Calidad del Aire Interior (IDA)", d: "Caudales mínimos de aire exterior: IDA 1 (20 dm³/s·persona), IDA 2 (12,5 dm³/s·persona), IDA 3 (8 dm³/s·persona), IDA 4 (5 dm³/s·persona)." }
        ];

        const qMin = query.toLowerCase();
        const matches = baseDatos.filter(item => item.k.includes(qMin) || item.t.toLowerCase().includes(qMin) || item.d.toLowerCase().includes(qMin));

        if (matches.length > 0) {
            resBox.innerHTML = matches.map(m => `
                <div style="padding: 10px 0;">
                    <strong style="color: var(--azul-brillante); font-size: 1.05rem;">${m.t}</strong>
                    <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 0.92rem; line-height: 1.5;">${m.d}</p>
                </div>
            `).join('<hr style="border-color: var(--bordes); margin: 12px 0;">');
        } else {
            resBox.innerHTML = `<p style="color: #ef4444;">No se pudo conectar con el endpoint /api/chat. Verifica que <code>api/chat.js</code> esté desplegado en Vercel con la variable GEMINI_API_KEY.</p>`;
        }
    }
}

// --- CONSULTOR ICT-2 (RD 346/2011) ---
function mostrarInfoICT() {
    const val = document.getElementById('ict-selector')?.value;
    const res = document.getElementById('ict-resultado-box');
    if (!val || !res) return;

    const datosICT = {
        riti: { t: "RITI (Recinto Inferior - RD 346/2011)", d: "Ubicado en planta baja o sótano. Aloja los registros de operadores de fibra óptica, par de cobre y coaxial. Obligatorio cuadro de luz exclusivo con IGA, diferencial y tomas de corriente schuko." },
        rits: { t: "RITS (Recinto Superior)", d: "Ubicado en la cubierta o bajo cubierta. Aloja las cabeceras de amplificación de RTV terrestre y satélite. Debe contar con ventilación natural o forzada y acceso directo a las torretas de antenas." },
        ritu: { t: "RITU (Recinto Único)", d: "Permitido exclusivamente en edificios o conjuntos residenciales de hasta 10 PAU o en viviendas unifamiliares, unificando funciones de RITI y RITS en un solo armario técnico." },
        pau: { t: "PAU (Punto de Acceso al Usuario)", d: "Caja de registro ubicada en el interior de cada vivienda. Distribuye el cableado coaxial, pares trenzados categoría 6 y tomas de fibra a todas las estancias habitables." },
        coaxial: { t: "Red de Cable Coaxial y Frecuencias", d: "Banda RTV terrestre: 470 a 790 MHz (con filtros de rechazo 5G/700MHz). FI Satélite: 950 a 2150 MHz. Niveles de señal en toma de usuario: entre 45 y 70 dBµV." },
        fibra: { t: "Red de Fibra Óptica en Edificación", d: "Cada vivienda dispondrá como mínimo de 2 fibras ópticas monomodo desde el RITI hasta el PAU, terminadas con conectores estandarizados SC/APC." }
    };

    const actual = datosICT[val];
    res.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: var(--azul-brillante);">${actual.t}</h4>
        <p style="line-height: 1.6; color: #cbd5e1;">${actual.d}</p>
    `;
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
    let seccionCalculada = (sistema === 'mono') ? ((2 * L * P) / (conductividad * eVoltios * V)) : ((L * P) / (conductividad * eVoltios * V));

    const seccionesNormalizadas = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
    const seccionComercial = seccionesNormalizadas.find(s => s >= seccionCalculada) || "Superior a 240 mm²";

    const resBox = document.getElementById('resultado-caida-box');
    if (resBox) {
        resBox.classList.remove('oculto');
        resBox.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: var(--verde-ia);">⚡ Resultados del Cálculo:</h4>
            <p>• <strong>Sección Teórica Requerida:</strong> ${seccionCalculada.toFixed(2)} mm²</p>
            <p>• <strong>Sección Comercial Recomendada:</strong> <span style="color: var(--azul-brillante); font-size: 1.15rem; font-weight: bold;">${seccionComercial} mm²</span></p>
            <p>• <strong>Caída Admisible:</strong> ${eVoltios.toFixed(2)} V (${ePorc}%)</p>
        `;
    }
}

// --- CÁLCULO SOLAR FOTOVOLTAICA (ITC-BT-40) ---
function calcularSolar() {
    const wPanel = parseFloat(document.getElementById('solar-w-panel')?.value) || 450;
    const numPaneles = parseInt(document.getElementById('solar-num-paneles')?.value) || 10;
    const voc = parseFloat(document.getElementById('solar-voc')?.value) || 49.5;

    const potPicoTotal = (wPanel * numPaneles) / 1000;
    const tensionVocString = (voc * numPaneles);

    const box = document.getElementById('solar-res-box');
    if (box) {
        box.classList.remove('oculto');
        box.innerHTML = `
            <h4 style="margin:0 0 10px 0; color: var(--verde-ia);">☀️ Resultados Fotovoltaica:</h4>
            <p>• <strong>Potencia Pico Total:</strong> ${potPicoTotal.toFixed(2)} kWp</p>
            <p>• <strong>Tensión Voc String:</strong> ${tensionVocString.toFixed(1)} V DC</p>
            <p>• <strong>Protección DC:</strong> Fusibles gPV y descargador Sobretensiones Tipo 2 DC (1000V DC).</p>
        `;
    }
}

// --- CÁLCULO MOTOR ---
function calcularMotor() {
    const kw = parseFloat(document.getElementById('motor-kw')?.value || document.getElementById('ind-potencia-motor')?.value || 5.5);
    const v = parseFloat(document.getElementById('motor-voltaje')?.value || document.getElementById('ind-tension-red')?.value || 400);
    const fp = parseFloat(document.getElementById('motor-fp')?.value || document.getElementById('ind-cos-phi')?.value || 0.85);
    const rend = parseFloat(document.getElementById('motor-rend')?.value || document.getElementById('ind-rendimiento')?.value || 0.88);

    const potenciaW = kw * 1000;
    const iNominal = potenciaW / (Math.sqrt(3) * v * fp * rend);
    const iRegulacionMin = (iNominal * 0.9).toFixed(1);
    const iRegulacionMax = (iNominal * 1.15).toFixed(1);

    const box = document.getElementById('motor-res-box') || document.getElementById('resultado-calculo-motor');
    if (box) {
        box.classList.remove('oculto');
        box.innerHTML = `
            <h4 style="margin:0 0 10px 0; color: var(--verde-ia);">⚙️ Resultados Motor:</h4>
            <p>• <strong>Intensidad Nominal ($I_n$):</strong> <span style="color: var(--azul-brillante); font-weight: bold;">${iNominal.toFixed(2)} A</span></p>
            <p>• <strong>Rango Ajuste Guardamotor:</strong> ${iRegulacionMin} A - ${iRegulacionMax} A</p>
            <p>• <strong>Arranque recomendado:</strong> ${kw > 5.5 ? 'Estrella-Triángulo o Arrancador Suave' : 'Arranque Directo'}</p>
        `;
    }
}

// --- GENERADOR KNX ---
function generarKNX() {
    const area = document.getElementById('knx-area')?.value || 1;
    const linea = document.getElementById('knx-linea')?.value || 1;
    const disp = document.getElementById('knx-dispositivo')?.value || 10;

    const dirFisica = `${area}.${linea}.${disp}`;
    const box = document.getElementById('knx-res-box') || document.getElementById('resultado-knx');
    if (box) {
        box.classList.remove('oculto');
        box.innerHTML = `
            <h4 style="margin:0 0 10px 0; color: var(--verde-ia);">🟢 Parámetros ETS Generados:</h4>
            <p>• <strong>Dirección Física Individual:</strong> <span style="color: var(--azul-brillante); font-weight: bold; font-size: 1.1rem;">${dirFisica}</span></p>
            <p>• <strong>Esquema de Grupos sugerido:</strong> 1/1/${disp}</p>
            <p>• <strong>Cable de Bus:</strong> Par trenzado apantallado verde certificado ($2 \\times 2 \\times 0.8\\text{ mm}$).</p>
        `;
    }
}

// --- VIDEOTECA TÉCNICA ---
function cargarVideo(id, titulo) {
    const elTitulo = document.getElementById('video-titulo');
    const elIframe = document.getElementById('iframe-video') || document.getElementById('reproductor-youtube');
    if (elTitulo) elTitulo.innerText = titulo;
    if (elIframe) elIframe.src = `https://www.youtube-nocookie.com/embed/${id}`;
}

// ==========================================
// INICIALIZACIÓN DE EVENTOS DEL DOM
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Servicio y Gestión SM iniciado correctamente");
    actualizarBotonEstado();

    // 1. BUSCADOR CON TECLA ENTER
    const inputBusqueda = document.getElementById('entrada-busqueda');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') ejecutarBusquedaNormativa();
        });
    }

    // 2. SIMULADOR MARCHA / PARO INDUSTRIAL (CADe SIMU)
    const btnMarcha = document.getElementById('sim-btn-marcha');
    const btnParo = document.getElementById('sim-btn-paro');
    const estadoS1 = document.getElementById('estado-s1');
    const estadoS2 = document.getElementById('estado-s2');
    const estadoKm1 = document.getElementById('estado-km1-aux');
    const estadoBobina = document.getElementById('estado-bobina');
    const pilotoMotor = document.getElementById('piloto-motor');
    const txtMotor = document.getElementById('motor-estado-txt');

    let km1Retenido = false;

    if (btnMarcha && btnParo) {
        btnMarcha.addEventListener('click', () => {
            km1Retenido = true;
            if (estadoS2) { estadoS2.textContent = "CERRADO (Pulsado)"; estadoS2.style.color = "#10b981"; }
            if (estadoKm1) { estadoKm1.textContent = "CERRADO (Retenido 13-14)"; estadoKm1.style.color = "#10b981"; }
            if (estadoBobina) { estadoBobina.textContent = "ACTIVADA (230V A1-A2)"; estadoBobina.style.color = "#10b981"; }
            if (pilotoMotor) {
                pilotoMotor.style.backgroundColor = "#10b981";
                pilotoMotor.style.boxShadow = "0 0 20px #10b981";
            }
            if (txtMotor) { txtMotor.textContent = "⚡ MOTOR EN MARCHA"; txtMotor.style.color = "#10b981"; }

            setTimeout(() => {
                if (estadoS2) { estadoS2.textContent = "ABIERTO (NA)"; estadoS2.style.color = "#ef4444"; }
            }, 500);
        });

        btnParo.addEventListener('click', () => {
            km1Retenido = false;
            if (estadoS1) { estadoS1.textContent = "ABIERTO (Pulsado)"; estadoS1.style.color = "#ef4444"; }
            if (estadoKm1) { estadoKm1.textContent = "ABIERTO"; estadoKm1.style.color = "#ef4444"; }
            if (estadoBobina) { estadoBobina.textContent = "DESACTIVADA (0V)"; estadoBobina.style.color = "#94a3b8"; }
            if (pilotoMotor) {
                pilotoMotor.style.backgroundColor = "#2a3441";
                pilotoMotor.style.boxShadow = "none";
            }
            if (txtMotor) { txtMotor.textContent = "MOTOR DETENIDO"; txtMotor.style.color = "#94a3b8"; }

            setTimeout(() => {
                if (estadoS1) { estadoS1.textContent = "CERRADO (NC)"; estadoS1.style.color = "#10b981"; }
            }, 600);
        });
    }

    // 3. FACTURACIÓN
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

    // 4. TARIFAS Y PRECIOS
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

    // 5. ASISTENTE DE VOZ DE ELENA
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
            if (statusVoz) statusVoz.innerText = `Pregunta: "${pregunta}"`;
            btnVoz.innerText = "⏳ Elena está pensando...";
            btnVoz.style.backgroundColor = "var(--azul-tecnico)";

            if (respuestaBox) {
                respuestaBox.classList.remove('oculto');
                respuestaBox.innerHTML = `<strong>Tú:</strong> ${pregunta}<br><br><em>Elena está analizando la normativa con Gemini...</em>`;
            }

            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: pregunta })
                });

                const data = await res.json();
                const textoRespuesta = data.text || data.respuesta || "No se obtuvo respuesta del servidor.";
                
                if (respuestaBox) {
                    respuestaBox.innerHTML = `<strong>Tú:</strong> ${pregunta}<br><br><strong>Elena:</strong><br>${textoRespuesta}`;
                }
                hablarComoElena(textoRespuesta);
            } catch (err) {
                console.error("Error al consultar la API:", err);
                if (respuestaBox) respuestaBox.innerHTML = `<strong>Error:</strong> No se pudo conectar con el endpoint /api/chat.`;
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