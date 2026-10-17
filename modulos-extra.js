// ==========================================================
// J.F - MÓDULOS EXTRA (se añade solo, sin tocar index.html)
// Climatización · Reactiva · Dimensionador de circuitos
// Reutiliza las clases y colores que ya tiene tu index.html
// ==========================================================
(function () {
    'use strict';

    var $ = function (id) { return document.getElementById(id); };
    var num = function (id, def) { var v = parseFloat(($(id) || {}).value); return isNaN(v) ? def : v; };

    // ---------- 1. SECCIONES ----------
    var HTML = {};

    HTML['vista-climatizacion'] = '' +
    '<header><button type="button" class="btn-volver" onclick="abrirModuloDirecto(\'vista-inicio\')">⬅ Volver al Menú</button>' +
    '<h1>❄️ Climatización: potencia frigorífica estimada</h1></header>' +
    '<div class="seccion-bloque">' +
      '<h3 style="margin-top:0;color:var(--azul-brillante)">Cálculo orientativo de equipo</h3>' +
      '<div class="calc-grid">' +
        '<div class="calc-field"><label>Superficie (m²):</label><input type="number" id="cl-m2" value="25" min="1"></div>' +
        '<div class="calc-field"><label>Altura (m):</label><input type="number" id="cl-alt" value="2.5" step="0.1"></div>' +
        '<div class="calc-field"><label>Personas habituales:</label><input type="number" id="cl-pers" value="2" min="0"></div>' +
        '<div class="calc-field"><label>Orientación / sol:</label><select id="cl-sol">' +
          '<option value="1">Interior o poco sol</option>' +
          '<option value="1.1" selected>Normal</option>' +
          '<option value="1.25">Mucho sol (oeste/sur, ático)</option></select></div>' +
        '<div class="calc-field"><label>Equipos que dan calor (W):</label><input type="number" id="cl-equipos" value="300" step="50"></div>' +
      '</div>' +
      '<button type="button" id="cl-btn" style="width:100%">Calcular equipo</button>' +
      '<div id="cl-res" class="resultado-caja oculto"></div>' +
    '</div>' +
    '<div class="seccion-bloque"><h3 style="margin-top:0;color:var(--azul-brillante)">Equivalencias útiles</h3>' +
      '<table class="tabla-normativa">' +
        '<tr><th>1 kW</th><td>≈ 860 frigorías/h ≈ 3.412 BTU/h</td></tr>' +
        '<tr><th>1 frigoría/h</th><td>= 1 kcal/h ≈ 1,163 W</td></tr>' +
        '<tr><th>Caudal condensación</th><td>Confirma siempre el tipo de gas en la placa del equipo (R-32, R-410A, R-290...)</td></tr>' +
      '</table>' +
      '<p style="font-size:.8rem;color:#94a3b8;margin-bottom:0">Es una estimación rápida para presupuestar. Para un proyecto usa un cálculo de cargas completo (RITE).</p>' +
    '</div>';

    HTML['vista-reactiva'] = '' +
    '<header><button type="button" class="btn-volver" onclick="abrirModuloDirecto(\'vista-inicio\')">⬅ Volver al Menú</button>' +
    '<h1>🔋 Compensación de energía reactiva</h1></header>' +
    '<div class="seccion-bloque">' +
      '<h3 style="margin-top:0;color:var(--azul-brillante)">Batería de condensadores necesaria</h3>' +
      '<div class="calc-grid">' +
        '<div class="calc-field"><label>Potencia activa P (kW):</label><input type="number" id="re-p" value="30" step="0.5"></div>' +
        '<div class="calc-field"><label>cos φ actual:</label><input type="number" id="re-f1" value="0.75" step="0.01" min="0.1" max="1"></div>' +
        '<div class="calc-field"><label>cos φ objetivo:</label><input type="number" id="re-f2" value="0.98" step="0.01" min="0.1" max="1"></div>' +
      '</div>' +
      '<button type="button" id="re-btn" style="width:100%">Calcular kVAr</button>' +
      '<div id="re-res" class="resultado-caja oculto"></div>' +
      '<p style="font-size:.8rem;color:#94a3b8;margin-bottom:0">Fórmula: Qc = P · (tan φ₁ − tan φ₂). Si hay variadores o armónicos, usa baterías con reactancias de filtrado.</p>' +
    '</div>';

    HTML['vista-dimensionador'] = '' +
    '<header><button type="button" class="btn-volver" onclick="abrirModuloDirecto(\'vista-inicio\')">⬅ Volver al Menú</button>' +
    '<h1>🧮 Dimensionador de circuito: intensidad y magnetotérmico</h1></header>' +
    '<div class="seccion-bloque">' +
      '<div class="calc-grid">' +
        '<div class="calc-field"><label>Sistema:</label><select id="di-sis"><option value="mono">Monofásico 230 V</option><option value="tri">Trifásico 400 V</option></select></div>' +
        '<div class="calc-field"><label>Potencia (W):</label><input type="number" id="di-p" value="3450"></div>' +
        '<div class="calc-field"><label>cos φ:</label><input type="number" id="di-fp" value="1" step="0.01" min="0.1" max="1"></div>' +
        '<div class="calc-field"><label>Circuito tipo (ITC-BT-25):</label><select id="di-tipo">' +
          '<option value="">Otro (libre)</option>' +
          '<option value="C1">C1 Iluminación</option><option value="C2">C2 Tomas generales</option>' +
          '<option value="C3">C3 Cocina y horno</option><option value="C4">C4 Lavadora/lavavajillas/termo</option>' +
          '<option value="C5">C5 Baño y auxiliares cocina</option></select></div>' +
      '</div>' +
      '<button type="button" id="di-btn" style="width:100%">Dimensionar</button>' +
      '<div id="di-res" class="resultado-caja oculto"></div>' +
    '</div>';

    // Valores de referencia ITC-BT-25 (circuitos interiores, vivienda básica)
    var TIPO = {
        C1: { pia: 10, sec: 1.5 }, C2: { pia: 16, sec: 2.5 }, C3: { pia: 25, sec: 6 },
        C4: { pia: 20, sec: 4 },  C5: { pia: 16, sec: 2.5 }
    };
    var PIAS = [6, 10, 16, 20, 25, 32, 40, 50, 63];

    // ---------- 2. CÁLCULOS ----------
    function calcClima() {
        var m2 = num('cl-m2', 25), alt = num('cl-alt', 2.5), pers = num('cl-pers', 0);
        var sol = num('cl-sol', 1.1), eq = num('cl-equipos', 0);
        var watts = (m2 * alt * 40 * sol) + pers * 100 + eq;       // ≈100 W/m² a 2,5 m
        var kw = watts / 1000;
        var comerciales = [2.0, 2.6, 3.5, 5.0, 7.0, 10.0, 14.0];
        var equipo = comerciales.find(function (c) { return c >= kw; });
        var r = $('cl-res'); r.classList.remove('oculto');
        r.innerHTML =
            '<p>• <strong>Carga estimada:</strong> ' + kw.toFixed(2) + ' kW (' + Math.round(kw * 860) + ' frig/h · ' + Math.round(kw * 3412) + ' BTU/h)</p>' +
            '<p>• <strong>Equipo recomendado:</strong> <span style="color:var(--azul-brillante);font-weight:bold">' +
            (equipo ? equipo.toFixed(1).replace('.', ',') + ' kW' : 'más de 14 kW: valora sistema multi o VRF') + '</span></p>' +
            '<p style="font-size:.8rem;color:#94a3b8">Estimación para presupuesto, no sustituye el cálculo de cargas del RITE.</p>';
    }

    function calcReactiva() {
        var p = num('re-p', 0), f1 = num('re-f1', 0.8), f2 = num('re-f2', 0.98);
        var r = $('re-res'); r.classList.remove('oculto');
        if (f1 <= 0 || f1 > 1 || f2 <= 0 || f2 > 1) { r.innerHTML = '<p style="color:#ef4444">El cos φ debe estar entre 0 y 1.</p>'; return; }
        if (f2 <= f1) { r.innerHTML = '<p style="color:#f59e0b">El cos φ objetivo debe ser mayor que el actual.</p>'; return; }
        var t1 = Math.tan(Math.acos(f1)), t2 = Math.tan(Math.acos(f2));
        var qc = p * (t1 - t2);
        var esc = [5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200];
        var com = esc.find(function (e) { return e >= qc; });
        r.innerHTML =
            '<p>• <strong>Reactiva a compensar:</strong> <span style="color:var(--azul-brillante);font-weight:bold">' + qc.toFixed(1) + ' kVAr</span></p>' +
            '<p>• <strong>Batería comercial orientativa:</strong> ' + (com ? com + ' kVAr' : 'varias etapas') + '</p>';
    }

    function calcDimensionador() {
        var tri = $('di-sis').value === 'tri';
        var p = num('di-p', 0), fp = num('di-fp', 1);
        var tipo = $('di-tipo').value;
        var r = $('di-res'); r.classList.remove('oculto');
        if (p <= 0 || fp <= 0 || fp > 1) { r.innerHTML = '<p style="color:#ef4444">Revisa potencia y cos φ.</p>'; return; }
        var i = tri ? p / (Math.sqrt(3) * 400 * fp) : p / (230 * fp);
        var pia = PIAS.find(function (x) { return x >= i * 1.0; });
        var html = '<p>• <strong>Intensidad de cálculo:</strong> ' + i.toFixed(2) + ' A</p>' +
            '<p>• <strong>Magnetotérmico mínimo:</strong> <span style="color:var(--azul-brillante);font-weight:bold">' +
            (pia ? pia + ' A (curva C)' : 'más de 63 A: revisa el diseño') + '</span></p>' +
            '<p>• <strong>Diferencial:</strong> 30 mA, calibre igual o superior al magnetotérmico aguas abajo.</p>';
        if (tipo && TIPO[tipo]) {
            html += '<p>• <strong>Referencia ' + tipo + ' (ITC-BT-25):</strong> PIA ' + TIPO[tipo].pia + ' A y ' + TIPO[tipo].sec + ' mm² Cu mínimo.</p>';
            if (i > TIPO[tipo].pia) html += '<p style="color:#f59e0b">⚠️ La intensidad supera el PIA típico de ' + tipo + ': divide la carga en más circuitos.</p>';
        }
        html += '<p style="font-size:.8rem;color:#94a3b8">Orientativo. Comprueba caída de tensión e intensidad admisible del cable (ITC-BT-19) con el calculador de caída.</p>';
        r.innerHTML = html;
    }

    // ---------- 3. INYECCIÓN EN LA PÁGINA ----------
    function init() {
        var main = document.querySelector('main.panel-tecnico');
        var menu = document.querySelector('.menu-sidebar');
        if (!main || !menu || $('vista-climatizacion')) return;

        Object.keys(HTML).forEach(function (id) {
            var s = document.createElement('section');
            s.id = id; s.className = 'vista-section oculto'; s.innerHTML = HTML[id];
            main.appendChild(s);
        });

        // Bloque de menú nuevo
        var bloque = document.createElement('div');
        bloque.className = 'menu-section';
        bloque.innerHTML =
            '<div style="color:var(--azul-brillante);font-size:.8rem;font-weight:bold;margin:15px 0 10px 0">🧰 HERRAMIENTAS EXTRA</div><ul>' +
            '<li><a href="javascript:void(0)" onclick="abrirModuloDirecto(\'vista-climatizacion\')"><span>❄️ Climatización (carga)</span></a></li>' +
            '<li><a href="javascript:void(0)" onclick="abrirModuloDirecto(\'vista-reactiva\')"><span>🔋 Compensación reactiva</span></a></li>' +
            '<li><a href="javascript:void(0)" onclick="abrirModuloDirecto(\'vista-dimensionador\')"><span>🧮 Dimensionador circuito</span></a></li>' +
            '</ul>';
        var gestion = Array.prototype.find.call(menu.querySelectorAll('.menu-section'), function (m) {
            return m.textContent.indexOf('GESTIÓN') !== -1;
        });
        if (gestion) menu.insertBefore(bloque, gestion); else menu.appendChild(bloque);

        $('cl-btn').addEventListener('click', calcClima);
        $('re-btn').addEventListener('click', calcReactiva);
        $('di-btn').addEventListener('click', calcDimensionador);
        console.log('J.F módulos extra cargados');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();