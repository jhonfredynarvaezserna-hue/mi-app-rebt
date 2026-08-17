// --- CONFIGURACIÓN Y CONSTANTES ---
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

// --- GESTOR TÉCNICO E INTÉRPRETE MULTIMODAL (WHATSAPP + IA) ---
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
        resBox.innerHTML = `<em>Analizando consulta e informe técnico con IA...</em>`;
    }

    const promptCompleto = `Tipo de consulta: ${tipo}. Cliente: ${nombre || 'No especificado'}. Descripción del problema: ${mensaje}`;

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptCompleto })
        });

        const data = await res.json();
        const respuesta = data.text || data.respuesta || "Diagnóstico completado con éxito.";

        if (resBox) {
            resBox.innerHTML = `
                <h4 style="margin: 0 0 10px 0; color: var(--verde-ia);">📋 Diagnóstico Técnico Preliminar:</h4>
                <p style="line-height: 1.6;">${respuesta}</p>
            `;
        }
    } catch (err) {
        console.error("Error en diagnóstico IA:", err);
        if (resBox) {
            resBox.innerHTML = `<p style="color: #ef4444;">No se pudo conectar con el servicio IA. Puedes pulsar en <strong>Enviar por WhatsApp</strong> para atenderte directamente.</p>`;
        }
    }
}

// --- BUSCADOR TÉCNICO REBT / RITE ---
async function ejecutarBusquedaNormativa() {
    const inputBusqueda = document.getElementById('entrada-busqueda');
    const resultadosBusqueda = document.getElementById('resultados-busqueda');
    const query = inputBusqueda?.value.trim().toLowerCase();
    
    if (!query || !resultadosBusqueda) return;
    
    resultadosBusqueda.innerHTML = `<p style="color: #a0aec0;">Buscando "${query}" en el REBT / RITE...</p>`;
    
    try {
        const respuesta = await fetch(`/api/buscar-reglamento?q=${encodeURIComponent(query)}`);
        if (!respuesta.ok) throw new Error("Fallback local");
        
        const articulos = await respuesta.json();
        resultadosBusqueda.innerHTML = '';

        if (!articulos || articulos.length === 0) {
            throw new Error("Sin resultados de API");
        }

        articulos.forEach(art => {
            const divArt = document.createElement('div');
            divArt.style.cssText = 'padding: 15px; border-bottom: 1px solid var(--bordes); margin-bottom: 10px; background-color: var(--input-bg); border-radius: 6px;';
            divArt.innerHTML = `
                <span style="font-size: 0.75rem; font-weight: bold; padding: 3px 6px; background-color: var(--azul-tecnico); color: white; border-radius: 3px; text-transform: uppercase;">${art.normativa || 'REBT'} - ${art.itc || 'GENERAL'}</span>
                <h3 style="color: #ffffff; margin: 8px 0 5px 0; font-size: 1rem;">${art.titulo}</h3>
                <p style="font-size: 0.9rem; line-height: 1.5; color: #a0aec0; margin: 0;">${art.contenido}</p>
            `;
            resultadosBusqueda.appendChild(divArt);
        });

    } catch (error) {
        // Base de datos local de respaldo
        const baseDatos = [
            { k: "caida", t: "ITC-BT-19 / ITC-BT-15: Caídas de Tensión", d: "1,5% para derivaciones individuales centralizadas (0,5% contador único), 3% alumbrado interior y 5% fuerza/usos generales." },
            { k: "vehiculo", t: "ITC-BT-52: Vehículos Eléctricos", d: "Protección diferencial Clase A con filtro de fugas DC (6mA DC) o Clase B, y descargador de sobretensiones permanente y transitoria Tipo 2." },
            { k: "solar", t: "ITC-BT-40: Instalaciones Generadoras", d: "Esquemas de interconexión fotovoltaica, protecciones de corte omnipolar e inyección cero." },
            { k: "rite", t: "RITE IT 1.1.4: Calidad de Aire Interior", d: "Caudales mínimos de ventilación por ocupante (IDA 1 a IDA 4) y filtración de aire exterior." },
            { k: "motores", t: "ITC-BT-47: Motores y Automatismos", d: "Protección por guardamotor o relé térmico regulado a la intensidad nominal del motor y limitación de caída de tensión en el arranque." }
        ];

        const matches = baseDatos.filter(item => item.k.includes(query) || item.t.toLowerCase().includes(query) || item.d.toLowerCase().includes(query));

        if (matches.length > 0) {
            resultadosBusqueda.innerHTML = matches.map(m => `
                <div style="padding: 10px 0;">
                    <strong style="color: var(--azul-brillante);">${m.t}</strong>
                    <p style="margin: 4px 0 0 0; color: #a0aec0; font-size: 0.9rem;">${m.d}</p>
                </div>
            `).join('<hr style="border-color: var(--bordes); margin: 10px 0;">');
        } else {
            resultadosBusqueda.innerHTML = `<p style="color: #a0aec0;">No se encontraron artículos locales para "${query}". Utiliza el <strong>Asesor de Voz</strong> para consultar por IA.</p>`;
        }
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

// --- CÁLCULO VEHÍCULO ELÉCTRICO (ITC-BT-52) ---
function calcularVE() {
    const potencia = parseFloat(document.getElementById('ve-potencia')?.value) || 7.4;
    const longitud = parseFloat(document.getElementById('ve-longitud')?.value) || 20;

    let seccionMinima = 6;
    let magnetotermico = "Curva C - 32A";
    const diferencial = "Clase A / B (Superinmunizado con detección 6mA DC)";
    const conductividadCobre = 48.5;
    let caidaTension = 0;

    if (potencia === 3.7) {
        magnetotermico = "Curva C - 16A";
        caidaTension = (2 * 3700 * longitud) / (conductividadCobre * seccionMinima * 230);
    } else if (potencia === 7.4) {
        magnetotermico = "Curva C - 32A";
        caidaTension = (2 * 7400 * longitud) / (conductividadCobre * seccionMinima * 230);
    } else if (potencia === 11) {
        magnetotermico = "Curva C - 16A (Tetrapolar)";
        caidaTension = (11000 * longitud) / (conductividadCobre * seccionMinima * 400);
    } else if (potencia === 22) {
        magnetotermico = "Curva C - 32A (Tetrapolar)";
        caidaTension = (22000 * longitud) / (conductividadCobre * seccionMinima * 400);
    }

    const vNominal = (potencia <= 7.4) ? 230 : 400;
    let porcentajeCDT = (caidaTension / vNominal) * 100;
    const seccionesOpciones = [6, 10, 16, 25, 35, 50];

    while (porcentajeCDT > 1.5 && seccionMinima < 50) {
        let indexActual = seccionesOpciones.indexOf(seccionMinima);
        if (indexActual < seccionesOpciones.length - 1) {
            seccionMinima = seccionesOpciones[indexActual + 1];
            caidaTension = (vNominal === 230) 
                ? (2 * (potencia * 1000) * longitud) / (conductividadCobre * seccionMinima * 230)
                : ((potencia * 1000) * longitud) / (conductividadCobre * seccionMinima * 400);
            porcentajeCDT = (caidaTension / vNominal) * 100;
        } else {
            break;
        }
    }

    alert(`⚡ Cálculo VE (ITC-BT-52):\n- Sección: ${seccionMinima} mm²\n- Protección Magnetotérmica: ${magnetotermico}\n- Diferencial: ${diferencial}\n- Caída estimada: ${porcentajeCDT.toFixed(2)}%`);
}

// --- CÁLCULO INDUSTRIAL Y DE MOTORES ---
function calcularMotor() {
    const kw = parseFloat(document.getElementById('motor-kw')?.value) || 5.5;
    const v = parseFloat(document.getElementById('motor-voltaje')?.value) || 400;
    const fp = parseFloat(document.getElementById('motor-fp')?.value) || 0.85;
    const rend = parseFloat(document.getElementById('motor-rend')?.value) || 0.88;

    const potenciaW = kw * 1000;
    const iNominal = potenciaW / (Math.sqrt(3) * v * fp * rend);
    const iRegulacionMin = (iNominal * 0.9).toFixed(1);
    const iRegulacionMax = (iNominal * 1.15).toFixed(1);

    const box = document.getElementById('motor-res-box');
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

// --- CÁLCULO Y GENERADOR KNX ---
function generarKNX() {
    const area = document.getElementById('knx-area')?.value || 1;
    const linea = document.getElementById('knx-linea')?.value || 1;
    const disp = document.getElementById('knx-dispositivo')?.value || 10;

    const dirFisica = `${area}.${linea}.${disp}`;
    const box = document.getElementById('knx-res-box');
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
    const elIframe = document.getElementById('iframe-video');
    if (elTitulo) elTitulo.innerText = titulo;
    if (elIframe) elIframe.src = `https://www.youtube-nocookie.com/embed/${id}`;
}

// --- ASISTENTE DE VOZ CON IA Y SÍNTESIS ---
document.addEventListener('DOMContentLoaded', () => {
    actualizarBotonEstado();

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
            btnVoz.innerText = "🛑 Escuchando... Habla ahora";
            btnVoz.style.backgroundColor = "#e53e3e";
            if (statusVoz) statusVoz.innerText = "Escuchando consulta...";
        };

        recognition.onresult = async (event) => {
            const pregunta = event.results[0][0].transcript;
            if (statusVoz) statusVoz.innerText = `Pregunta: "${pregunta}"`;
            btnVoz.innerText = "⏳ Consultando IA...";
            btnVoz.style.backgroundColor = "var(--azul-tecnico)";

            if (respuestaBox) {
                respuestaBox.classList.remove('oculto');
                respuestaBox.innerHTML = `<strong>Tú:</strong> ${pregunta}<br><br><em>Consultando base técnica...</em>`;
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
                    respuestaBox.innerHTML = `<strong>Tú:</strong> ${pregunta}<br><br><strong>Asesor:</strong> ${textoRespuesta}`;
                }
                
                const utterance = new SpeechSynthesisUtterance(textoRespuesta);
                utterance.lang = 'es-ES';
                window.speechSynthesis.speak(utterance);
            } catch (err) {
                console.error("Error al consultar la API:", err);
                if (respuestaBox) respuestaBox.innerHTML = `<strong>Error:</strong> No se pudo conectar con el endpoint /api/chat.`;
            } finally {
                btnVoz.innerText = "🎙️ Presionar para Hablar";
                btnVoz.style.backgroundColor = "var(--azul-tecnico)";
            }
        };

        recognition.onerror = (event) => {
            console.error("Error de voz:", event.error);
            if (statusVoz) statusVoz.innerText = `Error: ${event.error}`;
            btnVoz.innerText = "🎙️ Presionar para Hablar";
            btnVoz.style.backgroundColor = "var(--azul-tecnico)";
        };

        recognition.onend = () => {
            if (btnVoz.innerText.includes("Escuchando")) {
                btnVoz.innerText = "🎙️ Presionar para Hablar";
                btnVoz.style.backgroundColor = "var(--azul-tecnico)";
            }
        };

        btnVoz.addEventListener('click', () => {
            window.speechSynthesis.cancel();
            recognition.start();
        });
    }
});