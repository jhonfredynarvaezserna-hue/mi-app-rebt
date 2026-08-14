// ==========================================
// SERVICIO Y GESTIÓN SM - LÓGICA PRINCIPAL
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("Servicio y Gestión SM iniciado correctamente");

    // --- 1. SIMULADOR MARCHA / PARO INDUSTRIAL ---
    const btnMarcha = document.getElementById('sim-btn-marcha');
    const btnParo = document.getElementById('sim-btn-paro');
    const estadoS1 = document.getElementById('estado-s1');
    const estadoS2 = document.getElementById('estado-s2');
    const estadoKm1 = document.getElementById('estado-km1-aux');
    const estadoBobina = document.getElementById('estado-bobina');
    const pilotoMotor = document.getElementById('piloto-motor');

    let motorEnMarcha = false;

    if (btnMarcha && btnParo) {
        btnMarcha.addEventListener('click', () => {
            motorEnMarcha = true;
            if (estadoS2) estadoS2.textContent = "CERRADO (Pulsado)";
            if (estadoS2) estadoS2.style.color = "#68d391";
            if (estadoKm1) estadoKm1.textContent = "CERRADO (Enclavado)";
            if (estadoKm1) estadoKm1.style.color = "#68d391";
            if (estadoBobina) estadoBobina.textContent = "ACTIVADA (230V)";
            if (estadoBobina) estadoBobina.style.color = "#68d391";
            if (pilotoMotor) {
                pilotoMotor.style.backgroundColor = "#10b981";
                pilotoMotor.style.boxShadow = "0 0 20px #10b981";
            }
        });

        btnParo.addEventListener('click', () => {
            motorEnMarcha = false;
            if (estadoS1) estadoS1.textContent = "ABIERTO (Pulsado)";
            if (estadoS1) estadoS1.style.color = "#fc8181";
            if (estadoKm1) estadoKm1.textContent = "ABIERTO";
            if (estadoKm1) estadoKm1.style.color = "#fc8181";
            if (estadoBobina) estadoBobina.textContent = "DESACTIVADA";
            if (estadoBobina) estadoBobina.style.color = "#718096";
            if (pilotoMotor) {
                pilotoMotor.style.backgroundColor = "#2a3441";
                pilotoMotor.style.boxShadow = "none";
            }
            setTimeout(() => {
                if (estadoS1) {
                    estadoS1.textContent = "CERRADO (NC)";
                    estadoS1.style.color = "#68d391";
                }
            }, 600);
        });
    }

    // --- 2. CALCULADORA DE MOTORES ---
    const btnCalcMotor = document.getElementById('btn-calcular-motor');
    if (btnCalcMotor) {
        btnCalcMotor.addEventListener('click', () => {
            const pKw = parseFloat(document.getElementById('ind-potencia-motor')?.value || 5.5);
            const vRed = parseFloat(document.getElementById('ind-tension-red')?.value || 400);
            const cosPhi = parseFloat(document.getElementById('ind-cos-phi')?.value || 0.85);
            const rend = parseFloat(document.getElementById('ind-rendimiento')?.value || 0.88);

            const pW = pKw * 1000;
            // I = P / (raiz(3) * V * cosPhi * rend)
            const intensidad = pW / (Math.sqrt(3) * vRed * cosPhi * rend);
            const guardamotorMin = (intensidad * 0.95).toFixed(1);
            const guardamotorMax = (intensidad * 1.15).toFixed(1);

            const box = document.getElementById('resultado-calculo-motor');
            if (box) {
                box.classList.remove('oculto');
                box.innerHTML = `
                    <h4 style="color: #38bdf8; margin: 0 0 10px 0;">⚡ Resultados del Motor</h4>
                    <p>• <strong>Intensidad Nominal (In):</strong> <span style="color:#10b981; font-weight:bold;">${intensidad.toFixed(2)} A</span></p>
                    <p>• <strong>Ajuste Guardamotor sugerido:</strong> Rango ${guardamotorMin} A - ${guardamotorMax} A</p>
                    <p>• <strong>Sección Mínima Cable (Cobre):</strong> ${intensidad > 16 ? '4 mm²' : '2.5 mm²'}</p>
                `;
            }
        });
    }

    // --- 3. GENERADOR DIRECCIÓN KNX ---
    const btnKnx = document.getElementById('btn-generar-knx');
    if (btnKnx) {
        btnKnx.addEventListener('click', () => {
            const area = document.getElementById('knx-area')?.value || 1;
            const linea = document.getElementById('knx-linea')?.value || 1;
            const disp = document.getElementById('knx-dispositivo')?.value || 1;
            const resBox = document.getElementById('resultado-knx');
            const resTxt = document.getElementById('knx-direccion-result');
            if (resBox && resTxt) {
                resTxt.textContent = `${area}.${linea}.${disp}`;
                resBox.classList.remove('oculto');
            }
        });
    }

    // --- 4. FACTURACIÓN ---
    const btnFactura = document.getElementById('btn-calcular-factura');
    if (btnFactura) {
        btnFactura.addEventListener('click', () => {
            const base = parseFloat(document.getElementById('fac-precio')?.value || 0);
            const iva = base * 0.21;
            const total = base + iva;

            document.getElementById('total-base').textContent = base.toFixed(2);
            document.getElementById('total-iva').textContent = iva.toFixed(2);
            document.getElementById('total-factura').textContent = total.toFixed(2);
        });
    }

    // --- 5. TARIFAS Y PRECIOS ---
    const btnTarifa = document.getElementById('btn-calcular-tarifa');
    if (btnTarifa) {
        btnTarifa.addEventListener('click', () => {
            const h = parseFloat(document.getElementById('tarifa-horas')?.value || 0);
            const ph = parseFloat(document.getElementById('tarifa-precio-hora')?.value || 0);
            const desp = parseFloat(document.getElementById('tarifa-desplazamiento')?.value || 0);

            const subMO = h * ph;
            const total = subMO + desp;

            document.getElementById('subtotal-horas').textContent = subMO.toFixed(2);
            document.getElementById('subtotal-desplazamiento').textContent = desp.toFixed(2);
            document.getElementById('total-estimado').textContent = total.toFixed(2);
        });
    }

    // --- 6. VIDEOTECA YOUTUBE ---
    const btnsVideo = document.querySelectorAll('.btn-video');
    btnsVideo.forEach(btn => {
        btn.addEventListener('click', () => {
            btnsVideo.forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
            const ytId = btn.getAttribute('data-yt');
            const titulo = btn.getAttribute('data-titulo');
            const iframe = document.getElementById('reproductor-youtube');
            const titElem = document.getElementById('video-titulo');
            if (iframe) iframe.src = `https://www.youtube-nocookie.com/embed/${ytId}`;
            if (titElem) titElem.textContent = titulo;
        });
    });
});