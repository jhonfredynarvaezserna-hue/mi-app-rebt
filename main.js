// ====================================================
// APLICACIÓN TÉCNICA Y NUBE: SERVICIO Y GESTIÓN SM
// ====================================================

let vozFemeninaSeleccionada = null;

// Inicialización tras cargar el DOM
window.addEventListener('load', () => {
    verificarEstadoAutenticacion();
    inicializarNavegacion();
    cargarVocesFemeninas();
    inicializarAsesorVoz();
    inicializarBusquedasIA();
    inicializarBusquedasICT();
    inicializarCalculadoras();
    inicializarSimulador();
    inicializarVideoteca();
});

// ----------------------------------------------------
// 0. NAVEGACIÓN ENTRE SECCIONES
// ----------------------------------------------------
window.mostrarSeccion = function(arg1, arg2) {
    let idSeccion = typeof arg2 === 'string' ? arg2 : (typeof arg1 === 'string' ? arg1 : null);
    let evt = (arg1 && arg1.preventDefault) ? arg1 : (arg2 && arg2.preventDefault ? arg2 : null);

    if (evt) {
        evt.preventDefault();
    }

    if (!idSeccion) return;

    // Ocultar todas las vistas
    const secciones = document.querySelectorAll('.vista-section');
    secciones.forEach(sec => sec.classList.add('oculto'));

    // Mostrar la vista seleccionada
    const seccionObjetivo = document.getElementById(idSeccion);
    if (seccionObjetivo) {
        seccionObjetivo.classList.remove('oculto');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Actualizar clase activo en menú lateral
    const enlacesMenu = document.querySelectorAll('.menu-sidebar a');
    enlacesMenu.forEach(link => link.classList.remove('activo'));
    
    const enlaceActivo = document.getElementById(`menu-${idSeccion.replace('vista-', '')}`);
    if (enlaceActivo) {
        enlaceActivo.classList.add('activo');
    }
};

// ----------------------------------------------------
// 1. CARGA DE VOCES FEMENINAS EN ESPAÑOL
// ----------------------------------------------------
function cargarVocesFemeninas() {
    if ('speechSynthesis' in window) {
        const asignarVoz = () => {
            const voces = window.speechSynthesis.getVoices();
            vozFemeninaSeleccionada = voces.find(v => 
                v.lang.startsWith('es') && 
                (v.name.includes('Monica') || 
                 v.name.includes('Lucia') || 
                 v.name.includes('Helena') || 
                 v.name.includes('Laura') || 
                 v.name.includes('Sabina') || 
                 v.name.includes('Google español') ||
                 v.name.includes('Female'))
            ) || voces.find(v => v.lang.startsWith('es'));
        };

        asignarVoz();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = asignarVoz;
        }
    }
}

// ----------------------------------------------------
// 2. ASESORA DE VOZ CON ANIMACIÓN Y BASE TÉCNICA
// ----------------------------------------------------
function inicializarAsesorVoz() {
    const btnHablar = document.getElementById('btn-hablar-asesor');
    const statusVoz = document.getElementById('status-voz');
    const respuestaBox = document.getElementById('respuesta-voz-box');

    if (!btnHablar) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        if (statusVoz) statusVoz.innerText = "Tu navegador no soporta entrada de voz. Usa Google Chrome o Edge.";
        btnHablar.disabled = true;
        btnHablar.style.opacity = "0.5";
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.continuous = false;

    btnHablar.addEventListener('click', () => {
        try {
            recognition.start();
            if (statusVoz) statusVoz.innerText = "Escuchando... Di tu consulta técnica o reglamentaria.";
            btnHablar.disabled = true;
        } catch (err) {
            console.error("Error al iniciar micrófono:", err);
            btnHablar.disabled = false;
        }
    });

    recognition.onresult = async (event) => {
        const textoEscuchado = event.results[0][0].transcript;
        if (statusVoz) statusVoz.innerText = `Has preguntado: "${textoEscuchado}"`;

        let respuestaTexto = "";

        // 1. Petición al servidor (si está activo)
        try {
            const data = await hacerPeticionSeguraIA('/api/chat', { prompt: `[ASISTENTE VOZ REBT/RITE]: ${textoEscuchado}` });
            if (data && (data.text || data.respuesta)) {
                respuestaTexto = data.text || data.respuesta;
            }
        } catch (e) {
            console.warn("Backend no conectado. Usando base local.");
        }

        // 2. Respuesta local inmediata
        if (!respuestaTexto) {
            respuestaTexto = obtenerRespuestaReglamentariaLocal(textoEscuchado);
        }

        // 3. Mostrar texto en pantalla
        if (respuestaBox) {
            respuestaBox.classList.remove('oculto');
            respuestaBox.innerHTML = `
                <div style="border-left: 4px solid var(--verde-ia); padding-left: 12px;">
                    <p style="margin: 0 0 8px 0; color: var(--azul-brillante); font-weight: bold;">👩‍💼 Ingeniera Asistente SM:</p>
                    <p style="margin: 0; line-height: 1.5;">${respuestaTexto}</p>
                </div>
            `;
        }

        // 4. Reproducir voz femenina con animación del avatar
        reproducirVoz(respuestaTexto, () => {
            if (statusVoz) statusVoz.innerText = "Presiona el botón para realizar otra consulta.";
            btnHablar.disabled = false;
        });
    };

    recognition.onerror = (event) => {
        console.error("Error micrófono:", event.error);
        if (statusVoz) statusVoz.innerText = "No te escuché bien. Pulsa el botón para reintentar.";
        btnHablar.disabled = false;
    };

    recognition.onend = () => {
        btnHablar.disabled = false;
    };
}

function obtenerRespuestaReglamentariaLocal(pregunta) {
    const q = pregunta.toLowerCase();

    if (q.includes('diferencial') || q.includes('sensibilidad')) {
        return "Según la ITC-BT-24 del Reglamento de Baja Tensión, la sensibilidad general en viviendas es de 30 miliamperios de alta sensibilidad, clase A o AC según los receptores instalados.";
    } else if (q.includes('seccion') || q.includes('cable') || q.includes('milimetros')) {
        return "El Reglamento establece secciones mínimas en cobre: 1.5 milímetros cuadrados para iluminación, 2.5 para tomas generales, 4 milímetros para lavadora y termo, y 6 milímetros cuadrados para cocina y horno.";
    } else if (q.includes('vehiculo') || q.includes('cargador') || q.includes('itc 52') || q.includes('itc-bt-52')) {
        return "La ITC-BT-52 exige circuito dedicado protegido con interruptor automático, protección contra sobretensiones permanentes y transitorias, y diferencial clase A superinmunizado o tipo B de 30 miliamperios.";
    } else if (q.includes('caida') || q.includes('tension')) {
        return "La caída de tensión máxima admisible es del 0.5% en la línea general de alimentación con contadores centralizados, 1.5% en derivaciones individuales y un máximo del 3% en alumbrado interior.";
    } else if (q.includes('motor') || q.includes('guardamotor') || q.includes('termico')) {
        return "El relé térmico o guardamotor se debe calibrar exactamente a la intensidad nominal de placa del motor para la tensión trifásica conectada.";
    } else if (q.includes('marcha') || q.includes('enclavamiento') || q.includes('contactor')) {
        return "Para que el contactor mantenga la marcha tras soltar el pulsador, se conecta en paralelo con el pulsador de marcha el contacto auxiliar normalmente abierto 13-14 del propio contactor.";
    } else if (q.includes('knx') || q.includes('domotica')) {
        return "En KNX las direcciones físicas se estructuran por área, línea y aparato. Los cables de bus verde estándar deben mantenerse separados de las líneas de potencia de 230 voltios.";
    } else {
        return `He registrado tu consulta sobre "${pregunta}". De acuerdo con la normativa técnica, debes calcular la sección por criterio térmico de intensidad admisible y verificar que no supere la caída de tensión máxima reglamentaria.`;
    }
}

function reproducirVoz(texto, alTerminar) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 1.1;

        if (vozFemeninaSeleccionada) {
            utterance.voice = vozFemeninaSeleccionada;
        }

        const avatarBox = document.getElementById('avatar-femenino-box');

        utterance.onstart = () => {
            if (avatarBox) avatarBox.classList.add('hablando');
        };

        utterance.onend = () => {
            if (avatarBox) avatarBox.classList.remove('hablando');
            if (typeof alTerminar === 'function') alTerminar();
        };

        utterance.onerror = () => {
            if (avatarBox) avatarBox.classList.remove('hablando');
            if (typeof alTerminar === 'function') alTerminar();
        };

        window.speechSynthesis.speak(utterance);
    } else {
        if (typeof alTerminar === 'function') alTerminar();
    }
}

// ----------------------------------------------------
// 3. COMUNICACIÓN BACKEND
// ----------------------------------------------------
function verificarEstadoAutenticacion() {
    const pantallaLogin = document.getElementById('pantalla-login');
    const appPrincipal = document.getElementById('app-principal');

    if (pantallaLogin) pantallaLogin.classList.add('oculto');
    if (appPrincipal) appPrincipal.classList.remove('oculto');
}

async function hacerPeticionSeguraIA(url, body) {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("Error en petición a la IA:", err);
        return null;
    }
}

function inicializarNavegacion() {
    const menuInicio = document.getElementById('menu-inicio');
    if (menuInicio) {
        menuInicio.style.cursor = 'pointer';
    }
}

// ----------------------------------------------------
// 4. CONSULTAS REBT / MULTIMODAL
// ----------------------------------------------------
function inicializarBusquedasIA() {
    const btnBuscar = document.getElementById('btn-buscar');
    const entradaBusqueda = document.getElementById('entrada-busqueda');
    const resultadosBusqueda = document.getElementById('resultados-busqueda');

    if (btnBuscar && entradaBusqueda && resultadosBusqueda) {
        btnBuscar.addEventListener('click', async () => {
            const prompt = entradaBusqueda.value.trim();
            if (!prompt) return;

            resultadosBusqueda.innerHTML = "<p style='color: #a0aec0;'>Consultando normativa con la IA...</p>";

            try {
                const data = await hacerPeticionSeguraIA('/api/chat', { prompt });
                if (data) {
                    resultadosBusqueda.innerHTML = data.text || data.respuesta || "Sin respuesta.";
                }
            } catch (err) {
                resultadosBusqueda.innerHTML = "<p style='color: #e53e3e;'>Error al realizar la consulta.</p>";
            }
        });
    }

    const btnClienteIA = document.getElementById('btn-consultar-ia-cliente');
    const inputImagen = document.getElementById('input-imagen-gestor');
    const diagnosticoPrevio = document.getElementById('diagnostico-previo');

    if (btnClienteIA && diagnosticoPrevio) {
        btnClienteIA.addEventListener('click', async () => {
            const nombre = document.getElementById('cliente-nombre') ? document.getElementById('cliente-nombre').value.trim() : '';
            const servicio = document.getElementById('tipo-servicio') ? document.getElementById('tipo-servicio').value : '';
            const descripcion = document.getElementById('descripcion-servicio') ? document.getElementById('descripcion-servicio').value.trim() : '';
            const archivo = inputImagen ? inputImagen.files[0] : null;

            const prompt = `Cliente: ${nombre || 'Anónimo'}\nTipo de Servicio: ${servicio}\nDetalles: ${descripcion}`;
            diagnosticoPrevio.classList.remove('oculto');
            diagnosticoPrevio.innerHTML = "<p style='color: #a0aec0;'>Analizando consulta e imagen...</p>";

            if (archivo) {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64Data = reader.result.split(',')[1];
                    const mimeType = archivo.type;
                    enviarPeticionCliente(prompt, base64Data, mimeType);
                };
                reader.readAsDataURL(archivo);
            } else {
                enviarPeticionCliente(prompt, null, null);
            }
        });
    }

    async function enviarPeticionCliente(prompt, imagenBase64, mimeType) {
        try {
            const data = await hacerPeticionSeguraIA('/api/chat-cliente', { prompt, imagenBase64, mimeType });
            if (data && diagnosticoPrevio) {
                diagnosticoPrevio.innerHTML = data.text || data.respuesta || "Sin diagnóstico generado.";
            }
        } catch (err) {
            if (diagnosticoPrevio) {
                diagnosticoPrevio.innerHTML = "<p style='color: #e53e3e;'>Error al enviar consulta.</p>";
            }
        }
    }

    const btnEnviarWhatsapp = document.getElementById('btn-enviar-instalador');
    if (btnEnviarWhatsapp) {
        btnEnviarWhatsapp.addEventListener('click', () => {
            const nombre = document.getElementById('cliente-nombre') ? document.getElementById('cliente-nombre').value.trim() : '';
            const servicio = document.getElementById('tipo-servicio') ? document.getElementById('tipo-servicio').value : '';
            const descripcion = document.getElementById('descripcion-servicio') ? document.getElementById('descripcion-servicio').value.trim() : '';
            const mensaje = encodeURIComponent(`Hola, mi nombre es ${nombre || 'un cliente'}. Consulta sobre [${servicio}]: ${descripcion}`);
            window.open(`https://wa.me/34642269680?text=${mensaje}`, '_blank');
        });
    }
}

// ----------------------------------------------------
// 5. CONSULTAS TÉCNICAS ICT
// ----------------------------------------------------
function inicializarBusquedasICT() {
    const btnBuscarICT = document.getElementById('btn-buscar-ict');
    const entradaBusquedaICT = document.getElementById('entrada-busqueda-ict');
    const resultadosBusquedaICT = document.getElementById('resultados-busqueda-ict');

    const baseICT = [
        { termino: "riti", respuesta: "<strong>RITI (Recinto Inferior):</strong> Ubicado en planta baja o sótano. Alberga registros de RTV, TB+RDSI y TLCA." },
        { termino: "rits", respuesta: "<strong>RITS (Recinto Superior):</strong> Ubicado en cubierta o planta alta. Alberga equipos de captación de señales de RTV y radiodifusión." },
        { termino: "pau", respuesta: "<strong>PAU (Punto de Acceso al Usuario):</strong> Delimita la propiedad entre la red comunitaria y la red interior de la vivienda." },
        { termino: "tomas", respuesta: "<strong>Tomas por Vivienda:</strong> Mínimo 2 tomas de RTV (Salón y Cocina), 2 tomas de Telecomunicaciones (Salón y Dormitorio principal) y previsión de toma de fibra (FO)." },
        { termino: "fibra", respuesta: "<strong>Red de Fibra Óptica (FO):</strong> Obligatoria en nuevas edificaciones ICT-2. Conexión desde RITI hasta PAU de cada vivienda mediante cable multifibra." },
        { termino: "coaxial", respuesta: "<strong>Red Coaxial / RTV:</strong> Cobertura de señales TDT y Satélite. Distribuidores, derivadores y tomas finales con paso de corriente continuada si requieren alimentación." }
    ];

    function ejecutarBusqueda() {
        if (!entradaBusquedaICT || !resultadosBusquedaICT) return;
        const query = entradaBusquedaICT.value.toLowerCase().trim();
        if (!query) {
            resultadosBusquedaICT.innerHTML = '<p style="color: #a0aec0;">Escribe un término técnico de ICT para consultar.</p>';
            return;
        }

        const resultados = baseICT.filter(item => item.termino.includes(query));
        if (resultados.length > 0) {
            resultadosBusquedaICT.innerHTML = resultados.map(r => `<div style="margin-bottom: 10px; border-left: 3px solid var(--verde-ia); padding-left: 10px;">${r.respuesta}</div>`).join('');
        } else {
            resultadosBusquedaICT.innerHTML = `<p style="color: #f6ad55;">No hay coincidencias directas para "${query}". Prueba con "riti", "rits", "pau", "tomas", "fibra" o "coaxial".</p>`;
        }
    }

    if (btnBuscarICT && entradaBusquedaICT) {
        btnBuscarICT.addEventListener('click', ejecutarBusqueda);
        entradaBusquedaICT.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') ejecutarBusqueda();
        });
    }
}

// ----------------------------------------------------
// 6. CALCULADORAS TÉCNICAS (VE, KNX, SOLAR, FACTURAS)
// ----------------------------------------------------
function inicializarCalculadoras() {
    // Domótica KNX
    const btnKnxManual = document.getElementById('btn-generar-knx');
    if (btnKnxManual) {
        btnKnxManual.addEventListener('click', () => {
            const area = document.getElementById('knx-area') ? document.getElementById('knx-area').value || 0 : 0;
            const linea = document.getElementById('knx-linea') ? document.getElementById('knx-linea').value || 0 : 0;
            const disp = document.getElementById('knx-dispositivo') ? document.getElementById('knx-dispositivo').value || 0 : 0;

            const resElem = document.getElementById('knx-direccion-result');
            const boxElem = document.getElementById('resultado-knx');
            if (resElem) resElem.innerText = `${area}.${linea}.${disp}`;
            if (boxElem) boxElem.classList.remove('oculto');
        });
    }

    // Vehículo Eléctrico (ITC-BT-52)
    const btnVE = document.getElementById('btn-calcular-ve');
    if (btnVE) {
        btnVE.addEventListener('click', () => {
            const esquema = document.getElementById('ve-esquema') ? document.getElementById('ve-esquema').value : '2';
            const potencia = parseFloat(document.getElementById('ve-potencia') ? document.getElementById('ve-potencia').value : 7.4);
            const distancia = parseFloat(document.getElementById('ve-distancia') ? document.getElementById('ve-distancia').value : 20) || 0;

            const intensidad = (potencia * 1000) / (230 * 0.9);
            let seccion = "2.5 mm²";
            let iga = "16 A";

            if (intensidad > 16 && intensidad <= 32) {
                seccion = distancia > 25 ? "10 mm²" : "6 mm²";
                iga = "32 A";
            } else if (intensidad > 32) {
                seccion = "10 mm²";
                iga = "40 A";
            }

            const html = `
                <ul>
                    <li><strong>Esquema seleccionado:</strong> Esquema ${esquema.toUpperCase()}</li>
                    <li><strong>Intensidad de Cálculo:</strong> ${intensidad.toFixed(2)} A</li>
                    <li><strong>IGA Recomendado:</strong> ${iga} (Curva C)</li>
                    <li><strong>Protección Diferencial:</strong> Tipo A superinmunizado o Tipo B (30mA)</li>
                    <li><strong>Protección contra Sobretensiones:</strong> Permanentes y Transitorias (ITC-BT-52)</li>
                    <li><strong>Sección de Cable Sugerida:</strong> ${seccion} (Cobre, libre de halógenos)</li>
                </ul>
            `;

            const contVE = document.getElementById('contenido-resultado-ve');
            const resVE = document.getElementById('resultado-ve');
            if (contVE) contVE.innerHTML = html;
            if (resVE) resVE.classList.remove('oculto');
        });
    }

    // Solar Fotovoltaica (ITC-BT-40)
    const btnFV = document.getElementById('btn-calcular-fv');
    if (btnFV) {
        btnFV.addEventListener('click', () => {
            const consumo = parseFloat(document.getElementById('fv-consumo') ? document.getElementById('fv-consumo').value : 350) || 0;
            const potenciaPanel = parseFloat(document.getElementById('fv-potencia-panel') ? document.getElementById('fv-potencia-panel').value : 500) || 500;
            const tipo = document.getElementById('fv-tipo') ? document.getElementById('fv-tipo').value : 'red';

            const hsp = 4.8;
            const generacionDiariaRequerida = (consumo / 30) / 0.8;
            const potenciaPicoTotal = (generacionDiariaRequerida / hsp) * 1000;
            const numPaneles = Math.ceil(potenciaPicoTotal / potenciaPanel);

            const html = `
                <ul>
                    <li><strong>Potencia Fotovoltaica Mínima:</strong> ${(potenciaPicoTotal / 1000).toFixed(2)} kWp</li>
                    <li><strong>Número de Paneles Recomendado:</strong> ${numPaneles} paneles de ${potenciaPanel} Wp</li>
                    <li><strong>Inversor Sugerido:</strong> Inversor ${tipo.includes('bateria') ? 'Híbrido' : 'On-Grid'} de ${(potenciaPicoTotal / 1000).toFixed(1)} kW</li>
                    <li><strong>Protección DC:</strong> Seccionador 1000V DC + Protecciones Transitorias Tipo II</li>
                    <li><strong>Protección AC:</strong> Diferencial Clase A (30mA) + Magnetotérmico según salida de inversor</li>
                </ul>
            `;

            const contFV = document.getElementById('contenido-resultado-fv');
            const resFV = document.getElementById('resultado-fv');
            if (contFV) contFV.innerHTML = html;
            if (resFV) resFV.classList.remove('oculto');
        });
    }

    // Facturación
    const btnCalcularFactura = document.getElementById('btn-calcular-factura');
    const btnImprimirFactura = document.getElementById('btn-imprimir-factura');

    if (btnCalcularFactura) {
        btnCalcularFactura.addEventListener('click', () => {
            const cliente = document.getElementById('fac-cliente') ? document.getElementById('fac-cliente').value.trim() || 'Cliente General' : 'Cliente General';
            const nif = document.getElementById('fac-nif') ? document.getElementById('fac-nif').value.trim() || 'N/A' : 'N/A';
            const concepto = document.getElementById('fac-concepto') ? document.getElementById('fac-concepto').value.trim() || 'Servicios Técnicos Eléctricos' : 'Servicios Técnicos Eléctricos';
            const precioBase = parseFloat(document.getElementById('fac-precio') ? document.getElementById('fac-precio').value : 0) || 0;

            const iva = precioBase * 0.21;
            const total = precioBase + iva;

            if (document.getElementById('total-base')) document.getElementById('total-base').innerText = precioBase.toFixed(2);
            if (document.getElementById('total-iva')) document.getElementById('total-iva').innerText = iva.toFixed(2);
            if (document.getElementById('total-factura')) document.getElementById('total-factura').innerText = total.toFixed(2);

            const borradorHTML = `
                <p><strong>Cliente:</strong> ${cliente} | <strong>NIF/CIF:</strong> ${nif}</p>
                <p><strong>Concepto:</strong> ${concepto}</p>
                <p><strong>Base Imponible:</strong> ${precioBase.toFixed(2)} € | <strong>IVA (21%):</strong> ${iva.toFixed(2)} €</p>
                <p style="font-size: 1.1rem; color: var(--verde-ia);"><strong>TOTAL A PAGAR: ${total.toFixed(2)} €</strong></p>
            `;

            const contBorrador = document.getElementById('contenido-borrador');
            const vistaPrevia = document.getElementById('vista-previa-factura');
            if (contBorrador) contBorrador.innerHTML = borradorHTML;
            if (vistaPrevia) vistaPrevia.classList.remove('oculto');
        });
    }

    if (btnImprimirFactura) {
        btnImprimirFactura.addEventListener('click', () => window.print());
    }

    // Tarifas y Precios
    const btnCalcularTarifa = document.getElementById('btn-calcular-tarifa');
    if (btnCalcularTarifa) {
        btnCalcularTarifa.addEventListener('click', () => {
            const horas = parseFloat(document.getElementById('tarifa-horas') ? document.getElementById('tarifa-horas').value : 0) || 0;
            const precioHora = parseFloat(document.getElementById('tarifa-precio-hora') ? document.getElementById('tarifa-precio-hora').value : 35) || 35;
            const desplazamiento = parseFloat(document.getElementById('tarifa-desplazamiento') ? document.getElementById('tarifa-desplazamiento').value : 0) || 0;

            const subtotalHoras = horas * precioHora;
            const totalEstimado = subtotalHoras + desplazamiento;

            if (document.getElementById('subtotal-horas')) document.getElementById('subtotal-horas').innerText = subtotalHoras.toFixed(2);
            if (document.getElementById('subtotal-desplazamiento')) document.getElementById('subtotal-desplazamiento').innerText = desplazamiento.toFixed(2);
            if (document.getElementById('total-estimado')) document.getElementById('total-estimado').innerText = totalEstimado.toFixed(2);
        });
    }
}

// ----------------------------------------------------
// 7. SIMULADOR Y BIBLIOTECA DE ELECTRICIDAD INDUSTRIAL
// ----------------------------------------------------
function inicializarSimulador() {
    const btnParo = document.getElementById('sim-btn-paro');
    const btnMarcha = document.getElementById('sim-btn-marcha');
    const estadoS1 = document.getElementById('estado-s1');
    const estadoS2 = document.getElementById('estado-s2');
    const estadoKm1Aux = document.getElementById('estado-km1-aux');
    const estadoBobina = document.getElementById('estado-bobina');
    const pilotoMotor = document.getElementById('piloto-motor');

    let enclavado = false;

    if (btnMarcha && btnParo) {
        btnMarcha.addEventListener('click', () => {
            enclavado = true;
            actualizarSimulador();
        });

        btnParo.addEventListener('click', () => {
            enclavado = false;
            actualizarSimulador();
        });
    }

    function actualizarSimulador() {
        if (enclavado) {
            if (estadoS1) { estadoS1.innerText = "CERRADO (NC)"; estadoS1.style.color = "#68d391"; }
            if (estadoS2) { estadoS2.innerText = "PRESIONADO (NA)"; estadoS2.style.color = "#68d391"; }
            if (estadoKm1Aux) { estadoKm1Aux.innerText = "CERRADO (13-14)"; estadoKm1Aux.style.color = "#68d391"; }
            if (estadoBobina) { estadoBobina.innerText = "ACTIVADA (230V)"; estadoBobina.style.color = "#68d391"; }

            if (pilotoMotor) {
                pilotoMotor.style.backgroundColor = "#10b981";
                pilotoMotor.style.boxShadow = "0 0 20px #10b981";
            }
        } else {
            if (estadoS1) { estadoS1.innerText = "CERRADO (NC)"; estadoS1.style.color = "#68d391"; }
            if (estadoS2) { estadoS2.innerText = "ABIERTO (NA)"; estadoS2.style.color = "#fc8181"; }
            if (estadoKm1Aux) { estadoKm1Aux.innerText = "ABIERTO (13-14)"; estadoKm1Aux.style.color = "#fc8181"; }
            if (estadoBobina) { estadoBobina.innerText = "DESACTIVADA"; estadoBobina.style.color = "#718096"; }

            if (pilotoMotor) {
                pilotoMotor.style.backgroundColor = "#2a3441";
                pilotoMotor.style.boxShadow = "none";
            }
        }
    }

    // Calculadora de motores
    const btnCalcMotor = document.getElementById('btn-calcular-motor');
    if (btnCalcMotor) {
        btnCalcMotor.addEventListener('click', () => {
            const potKW = parseFloat(document.getElementById('ind-potencia-motor').value) || 0;
            const tension = parseFloat(document.getElementById('ind-tension-red').value) || 400;
            const cosPhi = parseFloat(document.getElementById('ind-cos-phi').value) || 0.85;
            const rend = parseFloat(document.getElementById('ind-rendimiento').value) || 0.88;

            let inom = 0;
            if (tension === 400) {
                inom = (potKW * 1000) / (Math.sqrt(3) * 400 * cosPhi * rend);
            } else {
                inom = (potKW * 1000) / (Math.sqrt(3) * 230 * cosPhi * rend);
            }

            const regMin = (inom * 0.9).toFixed(2);
            const regMax = (inom * 1.15).toFixed(2);

            const resDiv = document.getElementById('resultado-calculo-motor');
            resDiv.innerHTML = `
                <h4 style="color: var(--verde-ia); margin-top:0;">Resultados para Motor de ${potKW} kW (${(potKW * 1.36).toFixed(1)} CV) a ${tension}V:</h4>
                <ul style="line-height: 1.6;">
                    <li><strong>Intensidad Nominal (In):</strong> <span style="color:#68d391; font-size:1.1rem; font-weight:bold;">${inom.toFixed(2)} A</span></li>
                    <li><strong>Ajuste Térmico / Guardamotor:</strong> Regular exactamente a <strong>${inom.toFixed(2)} A</strong> (Rango comercial: ${regMin} A a ${regMax} A).</li>
                    <li><strong>Punta de arranque directo (Ia ≈ 6 · In):</strong> ~${(inom * 6).toFixed(1)} A.</li>
                    <li><strong>Contactor recomendado:</strong> Categoría AC-3 para mínimo ${(inom * 1.25).toFixed(1)} A.</li>
                </ul>
            `;
            resDiv.classList.remove('oculto');
        });
    }

    inicializarBibliotecaIndustrial();
}

function inicializarBibliotecaIndustrial() {
    const visor = document.getElementById('visor-biblioteca-industrial');
    const botones = document.querySelectorAll('.btn-lib-ind');

    const contenidoBiblio = {
        'arranque-directo': `
            <h3 style="color: var(--azul-brillante); margin-top:0;">Arranque Directo de Motor Trifásico</h3>
            <p><strong>Circuito de Potencia:</strong> Guardamotor (Q1) ➔ Contactor (KM1: bornas 1-3-5 / 2-4-6) ➔ Motor (U1, V1, W1).</p>
            <p><strong>Circuito de Maniobra:</strong> Fase ➔ Térmico (95-96) ➔ Pulsador Paro S1 (NC: 1-2) ➔ Pulsador Marcha S2 (NA: 3-4 en paralelo con contacto 13-14 de KM1) ➔ Bobina KM1 (A1-A2) ➔ Neutro.</p>
        `,
        'estrella-triangulo': `
            <h3 style="color: var(--azul-brillante); margin-top:0;">Arrancador Estrella - Triángulo (Y - Δ)</h3>
            <p><strong>Finalidad:</strong> Reducir la corriente de arranque a 1/3 de la nominal en motores de más de 5.5 kW.</p>
            <p><strong>Secuencia de Contactores:</strong></p>
            <ul>
                <li><strong>1. Arranque en Estrella:</strong> Entran <strong>KM1 (Línea)</strong> + <strong>KM3 (Estrella: puentea U2-V2-W2)</strong> junto con relé temporizador.</li>
                <li><strong>2. Transición (3 a 5 seg):</strong> Cae KM3 y entra <strong>KM2 (Triángulo: conecta devanados a plena tensión)</strong> con enclavamiento eléctrico por contactos NC cruzados.</li>
            </ul>
        `,
        'inversion-giro': `
            <h3 style="color: var(--azul-brillante); margin-top:0;">Inversión de Giro con Doble Enclavamiento</h3>
            <p><strong>Principio:</strong> Intercambiar dos de las tres fases en la alimentación del motor.</p>
            <p><strong>Regla de Seguridad Crítica:</strong> Enclavamiento eléctrico obligatorio mediante los contactos auxiliares <strong>NC (21-22)</strong> cruzados en serie con las bobinas de KM1 y KM2 para evitar un cortocircuito bifásico violento.</p>
        `,
        'rele-termico': `
            <h3 style="color: var(--azul-brillante); margin-top:0;">Bornas del Relé Térmico / Guardamotor</h3>
            <ul>
                <li><strong>95 - 96 (NC):</strong> Contacto de corte por sobrecarga térmica. Se conecta en serie al inicio de la maniobra para desconectar todas las bobinas.</li>
                <li><strong>97 - 98 (NA):</strong> Contacto de señalización de avería. Se conecta a una lámpara piloto roja o alarma de sobrecalentamiento.</li>
            </ul>
        `,
        'averias-frecuentes': `
            <h3 style="color: var(--azul-brillante); margin-top:0;">Guía Rápida de Averías Industriales</h3>
            <ul>
                <li><strong>El contactor vibra (zumbido fuerte):</strong> Espira de sombra rota en el núcleo magnético o suciedad/óxido en las caras polares del electroimán.</li>
                <li><strong>El motor no retiene la marcha (solo funciona mientras pulsas):</strong> Fallo en el contacto auxiliar NA (13-14) o borne flojo en el puente de auto-enclavamiento.</li>
                <li><strong>Disparo instantáneo al arrancar:</strong> Cortocircuito franco o fallo a tierra en el devanado del motor (medir aislamiento con megóhmetro a 500V/1000V).</li>
            </ul>
        `
    };

    botones.forEach(btn => {
        btn.addEventListener('click', () => {
            const tema = btn.getAttribute('data-tema');
            if (visor && contenidoBiblio[tema]) {
                visor.innerHTML = contenidoBiblio[tema];
            }
        });
    });
}

// ----------------------------------------------------
// 8. VIDEOTECA TÉCNICA DE YOUTUBE
// ----------------------------------------------------
function inicializarVideoteca() {
    const botonesVideo = document.querySelectorAll('.btn-video');
    const iframeYT = document.getElementById('reproductor-youtube');
    const tituloYT = document.getElementById('video-titulo');

    botonesVideo.forEach(btn => {
        btn.addEventListener('click', () => {
            botonesVideo.forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');

            const videoId = btn.getAttribute('data-yt');
            const titulo = btn.getAttribute('data-titulo');

            if (iframeYT && videoId) {
                iframeYT.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
            }
            if (tituloYT && titulo) {
                tituloYT.innerText = titulo;
            }
        });
    });
}