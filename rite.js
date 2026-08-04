// =================================================================
// 💨 MÓDULO INDUSTRIAL: CALCULADORA Y NORMATIVA RITE (IT 1.1.4)
// =================================================================

/**
 * Tabla indexada con los datos puros de la Instrucción Técnica IT 1.1.4.2
 */
const CONFIGURACION_REGLAMENTO_RITE = {
    'IDA1': { caudal: 20.0, filtro: "F9 + HEPA H13 (Hospitales / Clínicas)" },
    'IDA2': { caudal: 12.5, filtro: "F7 + F9 (Oficinas / Colegios / Residencias)" },
    'IDA3': { caudal: 8.0,  filtro: "F7 (Mínimo legal - Bares / Restaurantes)" },
    'IDA4': { caudal: 5.0,  filtro: "G4 / F6 (Retención Básica - Almacenes)" }
};

/**
 * Calcula el caudal de aire y actualiza de manera segura el DOM
 */
const procesarCalculoVentilacionRITE = () => {
    const selectorUso = document.getElementById('rite-uso');
    const selectorPersonas = document.getElementById('rite-personas');

    if (!selectorUso || !selectorPersonas) return;

    const usoSeleccionado = selectorUso.value;
    const totalPersonas = parseInt(selectorPersonas.value, 10) || 0;

    // 1. Extraer constantes de la tabla reglamentaria
    const datosNormativa = CONFIGURACION_REGLAMENTO_RITE[usoSeleccionado] || CONFIGURACION_REGLAMENTO_RITE['IDA2'];

    // 2. Operaciones de ingeniería (Conversión de unidades l/s -> m³/h)
    const m3hPorPersona = datosNormativa.caudal * 3.6;
    const caudalTotalRequerido = m3hPorPersona * totalPersonas;

    // 3. Renderizado y formateo en la interfaz de usuario
    const actualizarContenedor = (id, valor) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.innerText = valor;
    };

    actualizarContenedor('rite-res-por-persona', `${datosNormativa.caudal.toFixed(1).replace('.', ',')} dm³/s`);
    actualizarContenedor('rite-res-m3h-persona', `${m3hPorPersona.toFixed(0)} m³/h`);
    actualizarContenedor('rite-res-total', `${caudalTotalRequerido.toLocaleString('es-ES')} m³/h`);
    actualizarContenedor('rite-res-filtro', datosNormativa.filter || datosNormativa.filtro);

    console.log(`[RITE Mod] Dimensionado completado: ${caudalTotalRequerido} m³/h para ${totalPersonas} ocupantes.`);
};

// --- INICIALIZACIÓN ASÍNCRONA DEL MÓDULO ---
document.addEventListener('DOMContentLoaded', () => {
    const botonCalcular = document.getElementById('btn-calcular-rite');
    if (botonCalcular) {
        botonCalcular.addEventListener('click', procesarCalculoVentilacionRITE);
    }
});