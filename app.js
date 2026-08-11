// ====================================================
// APLICACIÓN TÉCNICA Y NUBE: SERVICIO Y GESTIÓN SM
// ====================================================

let vozFemeninaSeleccionada = null;

document.addEventListener('DOMContentLoaded', () => {
    verificarEstadoAutenticacion();
    inicializarNavegacion();
    cargarVocesFemeninas();
    inicializarAsesorVoz();
    inicializarBusquedasIA();
    inicializarCalculadoras();
    inicializarSimulador();
});

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
// 2. RECONOCIMIENTO DE VOZ Y REPRODUCCIÓN (ASESORA VIRTUAL)
// ----------------------------------------------------
function inicializarAsesorVoz() {
    const btnHablar = document.getElementById('btn-hablar-asesor');
    const statusVoz = document.getElementById('status-voz');
    const respuestaBox = document.getElementById('respuesta-voz-box');

    if (!btnHablar) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        statusVoz.innerText = "Tu navegador no soporta entrada de voz. Usa Google Chrome o Edge.";
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
            statusVoz.innerText = "Escuchando tu consulta...";
            btnHablar.disabled = true;
        } catch (err) {
            console.error("Error al iniciar micrófono:", err);
            btnHablar.disabled = false;
        }
    });

    recognition.onresult = async (event) => {
        const textoEscuchado = event.results[0][0].transcript;
        statusVoz.innerText = `Has dicho: "${textoEscuchado}"`;

        const promptVoz = `[ASISTENTE DE VOZ REBT/RITE]: ${textoEscuchado}`;

        try {
            const data = await hacerPeticionSeguraIA('/chat', { prompt: promptVoz });

            if (!data) {
                statusVoz.innerText = "Error de conexión o consulta no procesada.";
                btnHablar.disabled = false;
                return;
            }

            const respuestaTexto = data.text || data.respuesta || "No pude procesar la consulta.";

            respuestaBox.classList.remove('oculto');
            respuestaBox.innerText = respuestaTexto;

            reproducirVoz(respuestaTexto, () => {
                statusVoz.innerText = "Presiona el botón para realizar otra consulta";
                btnHablar.disabled = false;
            });

        } catch (error) {
            console.error("Error en la consulta al servidor:", error);
            statusVoz.innerText = "Error de conexión con el servidor.";
            btnHablar.disabled = false;
        }
    };

    recognition.onerror = (event) => {
        console.error("Error en el micrófono:", event.error);
        statusVoz.innerText = "No se pudo escuchar. Inténtalo de nuevo.";
        btnHablar.disabled = false;
    };

    recognition.onend = () => {
        if (!respuestaBox.classList.contains('oculto')) return;
        btnHablar.disabled = false;
    };
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
// 3. ACCESO DIRECTO SIN LOGIN
// ----------------------------------------------------
function verificarEstadoAutenticacion() {
    const pantallaLogin = document.getElementById('pantalla-login');
    const appPrincipal = document.getElementById('app-principal');

    // Muestra la app siempre de forma directa
    if (pantallaLogin) pantallaLogin.classList.add('oculto');
    if (appPrincipal) appPrincipal.classList.remove('oculto');
}

// Petición HTTP centralizada para llamadas a la IA
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

// Solicitar pasarela de pago para cobro con Stripe
async function solicitarSuscripcionPro() {
    try {
        const data = await hacerPeticionSeguraIA('/api/crear-checkout', {});
        if (data && data.url) {
            window.location.href = data.url;
        }
    } catch (err) {
        alert('No se pudo iniciar la pasarela de pago.');
    }
}

// ----------------------------------------------------
// 4. NAVEGACIÓN Y VISTAS
// ----------------------------------------------------
function inicializarNavegacion() {
    const enlacesMenu = document.querySelectorAll('.menu-sidebar a');
    const tarjetasModulos = document.querySelectorAll('.tarjeta-modulo');
    const secciones = document.querySelectorAll('.vista-section');
    const menuInicio = document.getElementById('menu-inicio');

    function mostrarSeccion(idSeccion) {
        secciones.forEach(sec => sec.classList.add('oculto'));
        const seccionObjetivo = document.getElementById(idSeccion);
        if (seccionObjetivo) {
            seccionObjetivo.classList.remove('oculto');
        }

        enlacesMenu.forEach(link => {
            link.classList.remove('activo');
            if (link.getAttribute('id') === `menu-${idSeccion.replace('vista-', '')}`) {
                link.classList.add('activo');
            }
        });
    }

    if (menuInicio) {
        menuInicio.addEventListener('click', () => mostrarSeccion('vista-inicio'));
    }

    enlacesMenu.forEach(enlace => {
        enlace.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = enlace.id.replace('menu-', 'vista-');
            mostrarSeccion(targetId);
        });
    });

    tarjetasModulos.forEach(tarjeta => {
        tarjeta.addEventListener('click', () => {
            const targetId = tarjeta.id.replace('card-', 'vista-');
            mostrarSeccion(targetId);
        });
    });
}

// ----------------------------------------------------
// 5. CONSULTAS A LA IA Y MÓDULOS NORMATIVOS
// ----------------------------------------------------
function inicializarBusquedasIA() {
    const btnBuscar = document.getElementById('btn-buscar');
    const entradaBusqueda = document.getElementById('entrada-busqueda');
    const resultadosBusqueda = document.getElementById('resultados-busqueda');

    if (btnBuscar && entradaBusqueda) {
        btnBuscar.addEventListener('click', async () => {
            const prompt = entradaBusqueda.value.trim();
            if (!prompt) return;

            resultadosBusqueda.innerHTML = "<p style='color: #a0aec0;'>Consultando normativa con la IA...</p>";

            try {
                const data = await hacerPeticionSeguraIA('/chat', { prompt });
                if (data) {
                    resultadosBusqueda.innerHTML = data.text || data.respuesta || "Sin respuesta.";
                }
            } catch (err) {
                resultadosBusqueda.innerHTML = "<p style='color: #e53e3e;'>Error al realizar la consulta.</p>";
            }
        });
    }

    const btnNormativaPro = document.getElementById('btn-enviar-normativa-pro');
    const inputNormativaPro = document.getElementById('input-normativa-pro');
    const resultadoNormativaPro = document.getElementById('resultado-normativa-pro');
    const botonesRapidos = document.querySelectorAll('.btn-guia-rapida');

    async function ejecutarConsultaNormativa(prompt) {
        resultadoNormativaPro.classList.remove('oculto');
        resultadoNormativaPro.innerHTML = "<p style='color: #a0aec0;'>Procesando consulta reglamentaria...</p>";

        try {
            const data = await hacerPeticionSeguraIA('/chat', { prompt });
            if (data) {
                resultadoNormativaPro.innerHTML = data.text || data.respuesta || "Sin respuesta.";
            }
        } catch (err) {
            resultadoNormativaPro.innerHTML = "<p style='color: #e53e3e;'>Error al conectar con la IA.</p>";
        }
    }

    if (btnNormativaPro && inputNormativaPro) {
        btnNormativaPro.addEventListener('click', () => {
            const prompt = inputNormativaPro.value.trim();
            if (prompt) ejecutarConsultaNormativa(prompt);
        });
    }

    botonesRapidos.forEach(btn => {
        btn.addEventListener('click', () => {
            const prompt = btn.getAttribute('data-prompt');
            if (prompt) {
                inputNormativaPro.value = prompt;
                ejecutarConsultaNormativa(prompt);
            }
        });
    });

    const btnClienteIA = document.getElementById('btn-consultar-ia-cliente');
    const inputImagen = document.getElementById('input-imagen-gestor');
    const diagnosticoPrevio = document.getElementById('diagnostico-previo');

    if (btnClienteIA) {
        btnClienteIA.addEventListener('click', async () => {
            const nombre = document.getElementById('cliente-nombre').value.trim();
            const servicio = document.getElementById('tipo-servicio').value;
            const descripcion = document.getElementById('descripcion-servicio').value.trim();
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
            const data = await hacerPeticionSeguraIA('/chat-cliente', { prompt, imagenBase64, mimeType });
            if (data) {
                diagnosticoPrevio.innerHTML = data.text || data.respuesta || "Sin diagnóstico generado.";
            }
        } catch (err) {
            diagnosticoPrevio.innerHTML = "<p style='color: #e53e3e;'>Error al enviar consulta.</p>";
        }
    }

    const btnEnviarWhatsapp = document.getElementById('btn-enviar-instalador');
    if (btnEnviarWhatsapp) {
        btnEnviarWhatsapp.addEventListener('click', () => {
            const nombre = document.getElementById('cliente-nombre').value.trim();
            const servicio = document.getElementById('tipo-servicio').value;
            const descripcion = document.getElementById('descripcion-servicio').value.trim();
            const mensaje = encodeURIComponent(`Hola, mi nombre es ${nombre || 'un cliente'}. Consulta sobre [${servicio}]: ${descripcion}`);
            window.open(`https://wa.me/34642269680?text=${mensaje}`, '_blank');
        });
    }

    const btnGenerarKnxIA = document.getElementById('btn-generar-proyecto-knx');
    const promptKnxIA = document.getElementById('knx-prompt-ia');
    const resultadoIaKnx = document.getElementById('resultado-ia-knx');

    if (btnGenerarKnxIA && promptKnxIA) {
        btnGenerarKnxIA.addEventListener('click', async () => {
            const consultaKnx = promptKnxIA.value.trim();
            if (!consultaKnx) return;

            resultadoIaKnx.classList.remove('oculto');
            resultadoIaKnx.innerHTML = "<p style='color: #a0aec0;'>Generando estructura ETS y direcciones de grupo...</p>";

            try {
                const data = await hacerPeticionSeguraIA('/generar-knx', { consultaKnx });
                if (data) {
                    resultadoIaKnx.innerHTML = data.text || data.respuesta || "Error al estructurar proyecto KNX.";
                }
            } catch (err) {
                resultadoIaKnx.innerHTML = "<p style='color: #e53e3e;'>Error al procesar el proyecto KNX.</p>";
            }
        });
    }
}

// ----------------------------------------------------
// 6. CALCULADORAS TÉCNICAS LOCALES (VE, KNX, SOLAR, FACTURAS)
// ----------------------------------------------------
function inicializarCalculadoras() {
    const btnKnxManual = document.getElementById('btn-generar-knx');
    if (btnKnxManual) {
        btnKnxManual.addEventListener('click', () => {
            const area = document.getElementById('knx-area').value || 0;
            const linea = document.getElementById('knx-linea').value || 0;
            const disp = document.getElementById('knx-dispositivo').value || 0;

            document.getElementById('knx-direccion-result').innerText = `${area}.${linea}.${disp}`;
            document.getElementById('resultado-knx').classList.remove('oculto');
        });
    }

    const btnVE = document.getElementById('btn-calcular-ve');
    if (btnVE) {
        btnVE.addEventListener('click', () => {
            const esquema = document.getElementById('ve-esquema').value;
            const potencia = parseFloat(document.getElementById('ve-potencia').value);
            const distancia = parseFloat(document.getElementById('ve-distancia').value) || 0;

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

            document.getElementById('contenido-resultado-ve').innerHTML = html;
            document.getElementById('resultado-ve').classList.remove('oculto');
        });
    }

    const btnFV = document.getElementById('btn-calcular-fv');
    if (btnFV) {
        btnFV.addEventListener('click', () => {
            const consumo = parseFloat(document.getElementById('fv-consumo').value) || 0;
            const potenciaPanel = parseFloat(document.getElementById('fv-potencia-panel').value) || 500;
            const tipo = document.getElementById('fv-tipo').value;

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

            document.getElementById('contenido-resultado-fv').innerHTML = html;
            document.getElementById('resultado-fv').classList.remove('oculto');
        });
    }

    const btnCalcularFactura = document.getElementById('btn-calcular-factura');
    const btnImprimirFactura = document.getElementById('btn-imprimir-factura');

    if (btnCalcularFactura) {
        btnCalcularFactura.addEventListener('click', () => {
            const cliente = document.getElementById('fac-cliente').value.trim() || 'Cliente General';
            const nif = document.getElementById('fac-nif').value.trim() || 'N/A';
            const concepto = document.getElementById('fac-concepto').value.trim() || 'Servicios Técnicos Eléctricos';
            const precioBase = parseFloat(document.getElementById('fac-precio').value) || 0;

            const iva = precioBase * 0.21;
            const total = precioBase + iva;

            document.getElementById('total-base').innerText = precioBase.toFixed(2);
            document.getElementById('total-iva').innerText = iva.toFixed(2);
            document.getElementById('total-factura').innerText = total.toFixed(2);

            const borradorHTML = `
                <p><strong>Cliente:</strong> ${cliente} | <strong>NIF/CIF:</strong> ${nif}</p>
                <p><strong>Concepto:</strong> ${concepto}</p>
                <p><strong>Base Imponible:</strong> ${precioBase.toFixed(2)} € | <strong>IVA (21%):</strong> ${iva.toFixed(2)} €</p>
                <p style="font-size: 1.1rem; color: var(--verde-ia);"><strong>TOTAL A PAGAR: ${total.toFixed(2)} €</strong></p>
            `;

            document.getElementById('contenido-borrador').innerHTML = borradorHTML;
            document.getElementById('vista-previa-factura').classList.remove('oculto');
        });
    }

    if (btnImprimirFactura) {
        btnImprimirFactura.addEventListener('click', () => {
            window.print();
        });
    }

    const btnCalcularTarifa = document.getElementById('btn-calcular-tarifa');
    if (btnCalcularTarifa) {
        btnCalcularTarifa.addEventListener('click', () => {
            const horas = parseFloat(document.getElementById('tarifa-horas').value) || 0;
            const precioHora = parseFloat(document.getElementById('tarifa-precio-hora').value) || 35;
            const desplazamiento = parseFloat(document.getElementById('tarifa-desplazamiento').value) || 0;

            const subtotalHoras = horas * precioHora;
            const totalEstimado = subtotalHoras + desplazamiento;

            document.getElementById('subtotal-horas').innerText = subtotalHoras.toFixed(2);
            document.getElementById('subtotal-desplazamiento').innerText = desplazamiento.toFixed(2);
            document.getElementById('total-estimado').innerText = totalEstimado.toFixed(2);
        });
    }
}

// ----------------------------------------------------
// 7. SIMULADOR VIRTUAL DE MARCHA / PARO (AUTOMATISMOS)
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
            if (estadoKm1Aux) { estadoKm1Aux.innerText = "ABIERTO"; estadoKm1Aux.style.color = "#fc8181"; }
            if (estadoBobina) { estadoBobina.innerText = "DESACTIVADA"; estadoBobina.style.color = "#718096"; }

            if (pilotoMotor) {
                pilotoMotor.style.backgroundColor = "#2a3441";
                pilotoMotor.style.boxShadow = "none";
            }
        }
    }
}