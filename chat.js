// --- ELEMENTOS DE LA INTERFAZ ---
const inputBusqueda = document.getElementById('entrada-busqueda'); 
const btnBuscar = document.getElementById('btn-buscar');
const resultadosBusqueda = document.getElementById('resultados-busqueda');

const chatInput = document.getElementById('chat-input');
const btnEnviarIa = document.getElementById('btn-enviar-ia');
const chatContainer = document.getElementById('chat-container');

// --- PUERTO DEL BACKEND ---
const API_URL = 'http://localhost:5000';

// --- BOTONES DEL MENÚ ---
const botonesMenu = {
    'menu-inicio': document.getElementById('menu-inicio'), 
    'menu-rebt': document.getElementById('menu-rebt'),
    'menu-industrial': document.getElementById('menu-industrial'), 
    'menu-ve': document.getElementById('menu-ve'),
    'menu-knx': document.getElementById('menu-knx'),
    'menu-facturas': document.getElementById('menu-facturas'),
    'menu-precios': document.getElementById('menu-precios')
};

// --- VISTAS DE CONTENIDO ---
const vistasContenido = {
    'menu-inicio': document.getElementById('vista-inicio'), 
    'menu-rebt': document.getElementById('vista-rebt'),
    'menu-industrial': document.getElementById('vista-industrial'), 
    'menu-ve': document.getElementById('vista-ve'),
    'menu-knx': document.getElementById('vista-knx'),
    'menu-facturas': document.getElementById('vista-facturas'),
    'menu-precios': document.getElementById('vista-precios')
};

// --- CAMBIO DE PANTALLAS DINÁMICO ---
Object.keys(botonesMenu).forEach(idBoton => {
    const boton = botonesMenu[idBoton];
    const vista = vistasContenido[idBoton];

    if (boton) {
        boton.addEventListener('click', (e) => {
            e.preventDefault();
            Object.values(botonesMenu).forEach(btn => { if (btn) btn.classList.remove('active'); });
            boton.classList.add('active');
            
            Object.values(vistasContenido).forEach(v => { if (v) v.classList.add('oculto'); });
            if (vista) vista.classList.remove('oculto');
        });
    }
});

// --- LÓGICA DEL BUSCADOR TÉCNICO ---
if (btnBuscar && inputBusqueda) {
    btnBuscar.addEventListener('click', ejecutarBusqueda);
    inputBusqueda.addEventListener('keypress', (e) => { if (e.key === 'Enter') ejecutarBusqueda(); });
}

async function ejecutarBusqueda() {
    const query = inputBusqueda.value.trim();
    if (!query || !resultadosBusqueda) return;
    
    resultadosBusqueda.innerHTML = `<p class="placeholder-text">Buscando "${query}" en el REBT / RITE...</p>`;
    
    try {
        const respuesta = await fetch(`${API_URL}/buscar-reglamento?q=${encodeURIComponent(query)}`);
        if (!respuesta.ok) throw new Error("Error al obtener datos del servidor.");
        
        const articulos = await respuesta.json();
        resultadosBusqueda.innerHTML = ''; 

        if (articulos.length === 0) {
            resultadosBusqueda.innerHTML = `<p class="placeholder-text">❌ No se encontraron artículos para "${query}".</p>`;
            return;
        }

        articulos.forEach(art => {
            const divArticulo = document.createElement('div');
            divArticulo.style.padding = '15px';
            divArticulo.style.borderBottom = '1px solid #2d3748';
            divArticulo.style.marginBottom = '10px';
            divArticulo.style.backgroundColor = '#1a202c';
            divArticulo.style.borderRadius = '6px';
            
            divArticulo.innerHTML = `
                <span style="font-size: 8.5pt; font-weight: bold; padding: 3px 6px; background-color: #2b6cb0; color: white; border-radius: 3px; text-transform: uppercase;">${art.normativa} - ${art.itc}</span>
                <h3 style="color: #ffffff; margin: 8px 0 5px 0; font-size: 11pt;">${art.titulo}</h3>
                <p style="font-size: 10pt; line-height: 1.5; color: #a0aec0; margin: 0; text-align: justify;">${art.contenido}</p>
            `;
            resultadosBusqueda.appendChild(divArticulo);
        });

    } catch (error) {
        console.error("Fallo en la búsqueda:", error);
        resultadosBusqueda.innerHTML = `<p class="placeholder-text" style="color: #fc8181;">⚠️ No se pudo conectar con la base de datos.</p>`;
    }
}

// --- LÓGICA DEL CHAT CON LA IA ---
if (btnEnviarIa && chatInput) {
    btnEnviarIa.addEventListener('click', enviarMensajeIA);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviarMensajeIA(); });
}

async function enviarMensajeIA() {
    const textoMensaje = chatInput.value.trim();
    if (!textoMensaje || !chatContainer) return;

    agregarMensajeAlChat(textoMensaje, 'usuario');
    chatInput.value = ''; 
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const respuestaServidor = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensaje: textoMensaje })
        });

        if (!respuestaServidor.ok) throw new Error("Error en la respuesta del servidor");
        const datos = await respuestaServidor.json();
        
        if (datos.respuesta) {
            agregarMensajeAlChat(datos.respuesta, 'bot');
        } else {
            agregarMensajeAlChat('Hubo un problema al procesar la respuesta de la IA.', 'bot');
        }

    } catch (error) {
        console.error("Fallo de comunicación:", error);
        agregarMensajeAlChat('No se pudo conectar con el servidor. Error de red.', 'bot');
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function agregarMensajeAlChat(texto, remitente) {
    if (!chatContainer) return;
    const divMensaje = document.createElement('div');
    divMensaje.classList.add('mensaje', remitente);
    divMensaje.innerHTML = `<p style="white-space: pre-wrap; margin: 0;">${texto}</p>`;
    chatContainer.appendChild(divMensaje);
}

// --- MATEMÁTICAS DE FACTURACIÓN ---
const facPrecio = document.getElementById('fac-precio');
const btnCalcularFactura = document.getElementById('btn-calcular-factura');
const totalBase = document.getElementById('total-base');
const totalIva = document.getElementById('total-iva');
const totalFactura = document.getElementById('total-factura');

if (btnCalcularFactura && facPrecio) {
    btnCalcularFactura.addEventListener('click', () => {
        const precioBase = parseFloat(facPrecio.value) || 0;
        const totalIvaCalculado = precioBase * 0.21;
        const importeTotalCalculado = precioBase + totalIvaCalculado;
        if (totalBase) totalBase.textContent = precioBase.toFixed(2) + " €";
        if (totalIva) totalIva.textContent = totalIvaCalculado.toFixed(2) + " €";
        if (totalFactura) totalFactura.textContent = importeTotalCalculado.toFixed(2) + " €";
    });
}

// --- MOTOR DE CÁLCULO INDUSTRIAL Y DE MOTORES ---
const btnCalcularIndustrial = document.getElementById("btn-calcular-industrial");

if (btnCalcularIndustrial) {
    btnCalcularIndustrial.addEventListener("click", () => {
        const inputPotencia = document.getElementById("ind-potencia");
        const inputTension = document.getElementById("ind-tension");
        const inputCosphi = document.getElementById("ind-cosphi");
        const inputLongitud = document.getElementById("ind-longitud");

        if (!inputPotencia || !inputTension || !inputCosphi || !inputLongitud) return;

        const kw = parseFloat(inputPotencia.value) || 0;
        const vL = parseFloat(inputTension.value) || 400;
        const cosPhi = parseFloat(inputCosphi.value) || 0.85;
        const longitud = parseFloat(inputLongitud.value) || 0;

        const rendimientoEstimado = 0.90; 
        const potenciaW = kw * 1000;       
        const conductividadCobre = 56;     

        const corriente = potenciaW / (Math.sqrt(3) * vL * cosPhi * rendimientoEstimado);
        const corrienteArr = corriente * 6;

        let seccionSugerida = 1.5;
        if (corriente > 11 && corriente <= 16) seccionSugerida = 2.5;
        if (corriente > 16 && corriente <= 21) seccionSugerida = 4;
        if (corriente > 21 && corriente <= 28) seccionSugerida = 6;
        if (corriente > 28 && corriente <= 38) seccionSugerida = 10;
        if (corriente > 38) seccionSugerida = 16;

        const caidaV = (Math.sqrt(3) * corriente * longitud * cosPhi) / (conductividadCobre * seccionSugerida);
        const porcentajeCaida = (caidaV / vL) * 100;

        const termicoMin = corriente * 0.9;
        const termicoMax = corriente * 1.15;

        if (document.getElementById("res-corriente")) document.getElementById("res-corriente").innerText = corriente.toFixed(2);
        if (document.getElementById("res-arranque")) document.getElementById("res-arranque").innerText = corrienteArr.toFixed(2);
        if (document.getElementById("res-seccion")) document.getElementById("res-seccion").innerText = seccionSugerida + " mm²";
        if (document.getElementById("res-caida")) document.getElementById("res-caida").innerText = caidaV.toFixed(2);
        if (document.getElementById("res-porcentaje")) document.getElementById("res-porcentaje").innerText = porcentajeCaida.toFixed(2);
        if (document.getElementById("res-rele-termico")) document.getElementById("res-rele-termico").innerText = `${termicoMin.toFixed(1)} - ${termicoMax.toFixed(1)} A`;
        if (document.getElementById("res-guardamotor")) document.getElementById("res-guardamotor").innerText = `Ajustar a ${corriente.toFixed(1)} A`;

        const elementoCaida = document.getElementById("res-caida");
        if (elementoCaida) {
            if (porcentajeCaida > 5.0) {
                elementoCaida.style.color = "#fc8181";
                alert("🚨 Alerta por Caída de Tensión: El cálculo supera el 5% máximo admisible.");
            } else {
                elementoCaida.style.color = "var(--azul-tecnico)";
            }
        }
    });
}

// --- SIMULADOR INTERACTIVO MARCHA/PARO (MANIOBRA) ---
const simBtnParo = document.getElementById('sim-btn-paro');
const simBtnMarcha = document.getElementById('sim-btn-marcha');

const estadoS1 = document.getElementById('estado-s1');
const estadoS2 = document.getElementById('estado-s2');
const estadoKm1Aux = document.getElementById('estado-km1-aux');
const estadoBobina = document.getElementById('estado-bobina');
const pilotoMotor = document.getElementById('piloto-motor');

let s1Cerrado = true;    
let s2Cerrado = false;   
let km1Activado = false;  

if (simBtnMarcha && simBtnParo) {
    simBtnMarcha.addEventListener('mousedown', () => {
        s2Cerrado = true;
        if (estadoS2) { estadoS2.innerText = "CERRADO (NA)"; estadoS2.style.color = "#68d391"; }
        actualizarSimulacionManiobra();
    });

    simBtnMarcha.addEventListener('mouseup', () => {
        s2Cerrado = false;
        if (estadoS2) { estadoS2.innerText = "ABIERTO (NA)"; estadoS2.style.color = "#fc8181"; }
        actualizarSimulacionManiobra();
    });

    simBtnParo.addEventListener('mousedown', () => {
        s1Cerrado = false;
        if (estadoS1) { estadoS1.innerText = "ABIERTO (NC)"; estadoS1.style.color = "#fc8181"; }
        actualizarSimulacionManiobra();
    });

    simBtnParo.addEventListener('mouseup', () => {
        s1Cerrado = true;
        if (estadoS1) { estadoS1.innerText = "CERRADO (NC)"; estadoS1.style.color = "#68d391"; }
        actualizarSimulacionManiobra();
    });
}

function actualizarSimulacionManiobra() {
    if (s1Cerrado && (s2Cerrado || km1Activado)) {
        km1Activado = true;
    } else {
        km1Activado = false;
    }

    if (km1Activado) {
        if (estadoKm1Aux) { estadoKm1Aux.innerText = "CERRADO (RETENIDO)"; estadoKm1Aux.style.color = "#68d391"; }
        if (estadoBobina) { estadoBobina.innerText = "ACTIVADA (KM1 ENERGIZADO)"; estadoBobina.style.color = "#68d391"; }
        if (pilotoMotor) pilotoMotor.style.backgroundColor = "#48bb78"; 
    } else {
        if (estadoKm1Aux) { estadoKm1Aux.innerText = "ABIERTO"; estadoKm1Aux.style.color = "#fc8181"; }
        if (estadoBobina) { estadoBobina.innerText = "DESACTIVADA"; estadoBobina.style.color = "#718096"; }
        if (pilotoMotor) pilotoMotor.style.backgroundColor = "#4a5568"; 
    }
}

// --- MOTOR DE CÁLCULO PARA VEHÍCULOS ELÉCTRICOS (ITC-BT-52) ---
const btnCalcularVE = document.getElementById('btn-calcular-ve');

if (btnCalcularVE) {
    btnCalcularVE.addEventListener('click', () => {
        const esquema = document.getElementById('ve-esquema').value;
        const potencia = parseFloat(document.getElementById('ve-potencia').value);
        const longitud = parseFloat(document.getElementById('ve-longitud').value);

        const resSeccion = document.getElementById('ve-res-seccion');
        const resMagneto = document.getElementById('ve-res-magneto');
        const resDiferencial = document.getElementById('ve-res-diferencial');
        const resCaida = document.getElementById('ve-res-caida');

        if (!resSeccion || !resMagneto || !resDiferencial || !resCaida) return;

        let seccionMinima = 6; 
        let magnetotermico = "";
        const diferencial = "Clase A (Superinmunizado) - 30mA"; 
        let caidaTension = 0;
        const conductividadCobrePuntoCritico = 48.5; 

        if (potencia === 3.7) {
            magnetotermico = "Curva C - 16A";
            caidaTension = (2 * 3700 * longitud) / (conductividadCobrePuntoCritico * seccionMinima * 230);
        } else if (potencia === 7.4) {
            magnetotermico = "Curva C - 32A";
            caidaTension = (2 * 7400 * longitud) / (conductividadCobrePuntoCritico * seccionMinima * 230);
        } else if (potencia === 11) {
            magnetotermico = "Curva C - 16A (Tetrapolar)";
            caidaTension = (11000 * longitud) / (conductividadCobrePuntoCritico * seccionMinima * 400);
        } else if (potencia === 22) {
            magnetotermico = "Curva C - 32A (Tetrapolar)";
            caidaTension = (22000 * longitud) / (conductividadCobrePuntoCritico * seccionMinima * 400);
        }

        let vNominal = (potencia === 3.7 || potencia === 7.4) ? 230 : 400;
        let porcentajeCDT = (caidaTension / vNominal) * 100;

        const seccionesOpciones = [6, 10, 16, 25, 35, 50];
        while (porcentajeCDT > 1.5 && seccionMinima < 50) {
            let indexActual = seccionesOpciones.indexOf(seccionMinima);
            if (indexActual < seccionesOpciones.length - 1) {
                seccionMinima = seccionesOpciones[indexActual + 1];
                if (vNominal === 230) {
                    caidaTension = (2 * (potencia * 1000) * longitud) / (conductividadCobrePuntoCritico * seccionMinima * 230);
                } else {
                    caidaTension = ((potencia * 1000) * longitud) / (conductividadCobrePuntoCritico * seccionMinima * 400);
                }
                porcentajeCDT = (caidaTension / vNominal) * 100;
            } else {
                break;
            }
        }

        resSeccion.textContent = `${seccionMinima} mm²`;
        resMagneto.textContent = magnetotermico;
        resDiferencial.textContent = diferencial;
        resCaida.textContent = `${porcentajeCDT.toFixed(2)}%`;
    });
}