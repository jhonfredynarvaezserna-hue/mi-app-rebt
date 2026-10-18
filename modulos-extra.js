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


// ==========================================================
// MODO ESTUDIO 1 · SIN CANDADOS
// Todos los módulos se abren libres; se ocultan 🔒, PRO y el botón de licencia
// ==========================================================
(function () {
    'use strict';
    window.verificarYEntrar = function (id) { window.abrirModuloDirecto(id); };

    function limpiar() {
        document.querySelectorAll('.insignia-candado').forEach(function (e) { e.remove(); });
        document.querySelectorAll('.menu-sidebar a span').forEach(function (s) {
            if (s.textContent.trim() === '🔒') s.remove();
        });
        var b = document.getElementById('btn-estado-licencia');
        if (b && b.parentElement) b.parentElement.style.display = 'none';
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', limpiar);
    else limpiar();
})();


// ==========================================================
// MODO ESTUDIO 2 · TEST DE PROTECCIONES (con explicación y repaso de fallos)
// El progreso se guarda en el móvil/navegador de cada persona.
// IMPORTANTE: contrasta cada "ref" con el texto oficial del REBT (BOE).
// ==========================================================
(function () {
    'use strict';

    var CLAVE = 'jf_test_protecciones';
    var PREGUNTAS = [
        { id: 'p1', q: '¿Qué sensibilidad tiene el interruptor diferencial que protege a las personas en una vivienda?',
          o: ['30 mA', '300 mA', '500 mA', '30 A'], c: 0,
          e: 'Los diferenciales de alta sensibilidad, de 30 mA, son los que protegen a las personas frente a fugas y contactos indirectos.', ref: 'ITC-BT-24 / ITC-BT-25' },
        { id: 'p2', q: '¿Contra qué protege un interruptor magnetotérmico (PIA)?',
          o: ['Sobrecargas y cortocircuitos', 'Solo fugas a tierra', 'Solo sobretensiones', 'Solo contactos directos'], c: 0,
          e: 'La parte térmica actúa ante sobrecargas y la parte magnética ante cortocircuitos. Protege al cable y a la instalación.', ref: 'ITC-BT-22' },
        { id: 'p3', q: '¿Qué compara un interruptor diferencial para decidir si dispara?',
          o: ['La corriente que entra con la que sale', 'La tensión con la frecuencia', 'La temperatura del cable', 'La potencia con el cos φ'], c: 0,
          e: 'Si la corriente que sale es menor que la que entra, hay una fuga a tierra (por ejemplo, a través de una persona), y el diferencial corta.', ref: 'ITC-BT-24' },
        { id: 'p4', q: 'En una vivienda básica, ¿qué magnetotérmico corresponde al circuito C3 (cocina y horno)?',
          o: ['10 A', '16 A', '25 A', '40 A'], c: 2,
          e: 'C3 lleva PIA de 25 A y conductor de 6 mm².', ref: 'ITC-BT-25 (tabla 1)' },
        { id: 'p5', q: '¿Qué sección mínima de cobre lleva el circuito C1 (iluminación) en una vivienda?',
          o: ['1 mm²', '1,5 mm²', '2,5 mm²', '4 mm²'], c: 1,
          e: 'C1 lleva 1,5 mm² con PIA de 10 A. Las tomas generales (C2) llevan 2,5 mm² con PIA de 16 A.', ref: 'ITC-BT-25 (tabla 1)' },
        { id: 'p6', q: 'Un magnetotérmico de curva C dispara magnéticamente entre…',
          o: ['3 y 5 veces In', '5 y 10 veces In', '10 y 20 veces In', '20 y 30 veces In'], c: 1,
          e: 'Curva B: 3 a 5 In. Curva C: 5 a 10 In. Curva D: 10 a 20 In. En viviendas lo habitual es la curva C.', ref: 'UNE-EN 60898-1' },
        { id: 'p7', q: '¿Qué diferencial detecta también corrientes de fuga continuas pulsantes, además de las alternas?',
          o: ['Tipo AC', 'Tipo A', 'Ninguno', 'Solo el de 300 mA'], c: 1,
          e: 'El tipo AC solo detecta alterna senoidal. El tipo A añade la continua pulsante, necesaria con electrónica de potencia.', ref: 'UNE-EN 61008 / 61009' },
        { id: 'p8', q: 'Para un punto de recarga de vehículo eléctrico, ¿qué exige la ITC-BT-52 en cuanto a corriente continua de fuga?',
          o: ['Nada especial', 'Diferencial tipo A con detección de 6 mA CC, o tipo B', 'Diferencial de 300 mA', 'Solo magnetotérmico'], c: 1,
          e: 'Se exige protección diferencial por toma, tipo A con dispositivo de detección de 6 mA de corriente continua, o tipo B.', ref: 'ITC-BT-52' },
        { id: 'p9', q: 'En el cuadro de una vivienda, ¿qué va inmediatamente después del IGA?',
          o: ['Los diferenciales', 'La derivación individual', 'El contador', 'Las tomas de tierra'], c: 0,
          e: 'El orden es: ICP (o contador digital), IGA, diferenciales y después los PIA de cada circuito.', ref: 'ITC-BT-17 / ITC-BT-25' },
        { id: 'p10', q: 'Un diferencial salta cada vez que enchufas una lavadora. ¿Qué es lo más probable?',
          o: ['Hay una fuga a tierra en el aparato o en su línea', 'La tensión es demasiado baja', 'El IGA está mal calibrado', 'El contador está averiado'], c: 0,
          e: 'Si salta al conectar un aparato concreto, lo normal es una fuga a tierra en él o en su circuito. Desenchúfalo y compruébalo antes de rearmar.', ref: 'ITC-BT-24' }
    ];

    var estado = { cola: [], i: 0, aciertos: 0, fallosSesion: [], modoRepaso: false };

    function leer() { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } }
    function guardar(d) { try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch (e) { } }
    function mezclar(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]; }); }
    function $(id) { return document.getElementById(id); }

    function portada() {
        var d = leer(), nFallos = (d.fallos || []).length;
        $('tp-cuerpo').innerHTML =
            '<p style="color:#94a3b8">10 preguntas con explicación y la referencia de donde sale cada respuesta. Lo que falles se guarda para repasarlo.</p>' +
            '<div class="resultado-caja">' +
              '<p>• <strong>Mejor nota:</strong> ' + (d.mejor != null ? d.mejor + ' / ' + PREGUNTAS.length : 'aún sin intentos') + '</p>' +
              '<p>• <strong>Intentos:</strong> ' + (d.intentos || 0) + '</p>' +
              '<p style="margin-bottom:0">• <strong>Preguntas por repasar:</strong> ' + nFallos + '</p></div>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:15px">' +
              '<button type="button" id="tp-empezar" style="flex:2">▶ Empezar el test</button>' +
              (nFallos ? '<button type="button" id="tp-repaso" style="flex:1;background:#d97706">🔁 Repasar fallos (' + nFallos + ')</button>' : '') +
            '</div>';
        $('tp-empezar').onclick = function () { empezar(false); };
        if ($('tp-repaso')) $('tp-repaso').onclick = function () { empezar(true); };
    }

    function empezar(repaso) {
        var d = leer(), lista = PREGUNTAS;
        if (repaso) lista = PREGUNTAS.filter(function (p) { return (d.fallos || []).indexOf(p.id) !== -1; });
        estado = { cola: mezclar(lista), i: 0, aciertos: 0, fallosSesion: [], modoRepaso: repaso };
        pregunta();
    }

    function pregunta() {
        var p = estado.cola[estado.i];
        var orden = mezclar(p.o.map(function (t, k) { return { t: t, ok: k === p.c }; }));
        var h = '<p style="color:#94a3b8;font-size:.85rem">Pregunta ' + (estado.i + 1) + ' de ' + estado.cola.length + (estado.modoRepaso ? ' · repaso' : '') + '</p>' +
                '<h3 style="margin-top:0">' + esc(p.q) + '</h3><div style="display:flex;flex-direction:column;gap:10px">';
        orden.forEach(function (o, k) { h += '<button type="button" class="tp-op" data-ok="' + (o.ok ? 1 : 0) + '" style="text-align:left;background:var(--input-bg);border:1px solid var(--bordes)">' + esc(o.t) + '</button>'; });
        h += '</div><div id="tp-fb"></div>';
        $('tp-cuerpo').innerHTML = h;
        Array.prototype.forEach.call(document.querySelectorAll('.tp-op'), function (b) {
            b.onclick = function () { responder(b, p); };
        });
    }

    function responder(boton, p) {
        var ok = boton.getAttribute('data-ok') === '1';
        Array.prototype.forEach.call(document.querySelectorAll('.tp-op'), function (b) {
            b.disabled = true;
            if (b.getAttribute('data-ok') === '1') { b.style.background = '#065f46'; b.style.borderColor = '#10b981'; }
        });
        if (!ok) { boton.style.background = '#7f1d1d'; boton.style.borderColor = '#ef4444'; estado.fallosSesion.push(p.id); } else estado.aciertos++;
        var ultima = estado.i === estado.cola.length - 1;
        $('tp-fb').innerHTML =
            '<div class="resultado-caja"><p style="margin-top:0"><strong>' + (ok ? '✅ Correcto' : '❌ No es esa') + '</strong></p>' +
            '<p>' + esc(p.e) + '</p><p style="font-size:.8rem;color:#94a3b8;margin-bottom:0">Referencia: ' + esc(p.ref) + '</p></div>' +
            '<button type="button" id="tp-sig" style="width:100%;margin-top:12px">' + (ultima ? 'Ver resultado' : 'Siguiente →') + '</button>';
        $('tp-sig').onclick = function () { if (ultima) fin(); else { estado.i++; pregunta(); } };
    }

    function fin() {
        var d = leer(), total = estado.cola.length, fallos = d.fallos || [];
        estado.cola.forEach(function (p) {
            var f = estado.fallosSesion.indexOf(p.id) !== -1, pos = fallos.indexOf(p.id);
            if (f && pos === -1) fallos.push(p.id);
            if (!f && pos !== -1) fallos.splice(pos, 1);
        });
        d.fallos = fallos;
        if (!estado.modoRepaso) { d.intentos = (d.intentos || 0) + 1; if (d.mejor == null || estado.aciertos > d.mejor) d.mejor = estado.aciertos; }
        guardar(d);
        var nota = estado.aciertos / total;
        $('tp-cuerpo').innerHTML =
            '<h3 style="margin-top:0">Resultado: ' + estado.aciertos + ' / ' + total + '</h3>' +
            '<p style="color:#94a3b8">' + (nota >= 0.9 ? 'Muy bien: este tema lo dominas.' : nota >= 0.6 ? 'Vas bien. Repasa los fallos y repite.' : 'Hay que reforzar este tema: repasa los fallos y vuelve a intentarlo.') + '</p>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" id="tp-otra" style="flex:1">Volver al inicio del test</button></div>';
        $('tp-otra').onclick = portada;
    }

    function init() {
        var main = document.querySelector('main.panel-tecnico'), menu = document.querySelector('.menu-sidebar');
        if (!main || !menu || $('vista-test-protecciones')) return;
        var s = document.createElement('section');
        s.id = 'vista-test-protecciones'; s.className = 'vista-section oculto';
        s.innerHTML = '<header><button type="button" class="btn-volver" onclick="abrirModuloDirecto(\'vista-inicio\')">⬅ Volver al Menú</button>' +
            '<h1>📝 Test: Protecciones eléctricas</h1></header><div class="seccion-bloque"><div id="tp-cuerpo"></div>' +
            '<p style="font-size:.78rem;color:#64748b;margin-bottom:0">Material de estudio. Contrasta siempre los valores con el texto oficial del REBT.</p></div>';
        main.appendChild(s);

        var bloque = document.createElement('div');
        bloque.className = 'menu-section';
        bloque.innerHTML = '<div style="color:var(--azul-brillante);font-size:.8rem;font-weight:bold;margin:15px 0 10px 0">🎓 PRÁCTICA Y TESTS</div><ul>' +
            '<li><a href="javascript:void(0)" id="tp-enlace"><span>📝 Test de Protecciones</span></a></li></ul>';
        var primero = menu.querySelectorAll('.menu-section')[1] || null;
        if (primero) menu.insertBefore(bloque, primero); else menu.appendChild(bloque);
        $('tp-enlace').onclick = function () { portada(); window.abrirModuloDirecto('vista-test-protecciones'); };
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();


// ==========================================================
// PRESUPUESTOS · Avería eléctrica · Urgencia 24 h · Climatización
// Las cuentas las hace la app con TUS precios (editables y guardados en
// este dispositivo). Salida: PDF (Imprimir → Guardar como PDF) o WhatsApp.
// ¡LOS PRECIOS DE PARTIDA SON DE EJEMPLO! Cámbialos por los tuyos.
// ==========================================================
(function () {
    'use strict';

    var K_TAR = 'jf_presu_tarifas', K_NUM = 'jf_presu_num', K_EMP = 'jf_presu_empresa';
    // [clave, concepto, cantidad, precio, ¿lleva recargo de urgencia? (mano de obra / desplazamiento)]
    var PRESETS = {
        averia: { nombre: 'Avería eléctrica', lineas: [
            ['diag', 'Diagnóstico y localización de la avería', 1, 45, true],
            ['mo', 'Mano de obra (hora)', 1, 45, true],
            ['desp', 'Desplazamiento', 1, 30, true],
            ['mag', 'Magnetotérmico (ud)', 1, 15, false],
            ['dif', 'Diferencial 30 mA (ud)', 1, 50, false],
            ['mat', 'Material pequeño (conductor, regletas, bridas)', 1, 10, false] ] },
        urgencia: { nombre: 'Urgencia 24 horas', lineas: [
            ['diag', 'Diagnóstico urgente y puesta en seguridad', 1, 45, true],
            ['mo', 'Mano de obra (hora)', 1, 45, true],
            ['desp', 'Desplazamiento urgente', 1, 30, true],
            ['mag', 'Magnetotérmico (ud)', 1, 15, false],
            ['dif', 'Diferencial 30 mA (ud)', 1, 50, false],
            ['mat', 'Material pequeño (conductor, regletas, bridas)', 1, 10, false] ] },
        clima: { nombre: 'Climatización', lineas: [
            ['diag', 'Revisión y diagnóstico del equipo', 1, 45, true],
            ['mo', 'Mano de obra (hora)', 1, 45, true],
            ['desp', 'Desplazamiento', 1, 30, true],
            ['fuga', 'Localización y reparación de fuga (ud)', 1, 80, false],
            ['gas', 'Carga de refrigerante (kg)', 1, 50, false],
            ['limp', 'Limpieza y mantenimiento de unidad (ud)', 1, 60, false],
            ['inst', 'Instalación de split completo (mano de obra)', 1, 250, false],
            ['linea', 'Línea frigorífica y material de instalación (m)', 3, 20, false] ] }
    };
    var FRANJAS = [['0', 'Horario normal (sin recargo)'], ['25', 'Tarde / noche (+25 %)'], ['50', 'Fin de semana (+50 %)'], ['75', 'Festivo / madrugada (+75 %)']];

    var lineas = [];
    var tipoActual = 'averia';

    function $(id) { return document.getElementById(id); }
    function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]; }); }
    function eur(n) { return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',') + ' €'; }
    function num(v) { var n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; }
    function leer(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
    function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }

    function cargarTipo(tipo) {
        tipoActual = tipo;
        var tar = leer(K_TAR, {});
        lineas = PRESETS[tipo].lineas.map(function (l) {
            var clave = tipo + ':' + l[0];
            return { k: clave, c: l[1], q: l[2], p: tar[clave] != null ? tar[clave] : l[3], rec: l[4] };
        });
        $('pp-franja').value = tipo === 'urgencia' ? '25' : '0';
        pintarTabla();
    }

    function pintarTabla() {
        var h = '';
        lineas.forEach(function (l, i) {
            h += '<tr data-i="' + i + '">' +
                '<td><input type="text" class="pp-c" value="' + esc(l.c) + '" style="width:100%"></td>' +
                '<td><input type="number" class="pp-q" value="' + l.q + '" min="0" step="0.5" style="width:70px"></td>' +
                '<td><input type="number" class="pp-p" value="' + l.p + '" min="0" step="1" style="width:90px"></td>' +
                '<td class="pp-s" style="white-space:nowrap">' + eur(l.q * l.p) + '</td>' +
                '<td><button type="button" class="pp-x" title="Quitar" style="background:#7f1d1d;padding:6px 10px">✕</button></td></tr>';
        });
        $('pp-lineas').innerHTML = h || '<tr><td colspan="5" style="color:#94a3b8">Sin partidas. Añade una.</td></tr>';
        totales();
    }

    function calculo() {
        var pct = num($('pp-franja').value), iva = num($('pp-iva').value);
        var baseRec = 0, baseNo = 0;
        lineas.forEach(function (l) { var s = l.q * l.p; if (l.rec) baseRec += s; else baseNo += s; });
        var recargo = baseRec * pct / 100, sub = baseRec + baseNo + recargo, ivaImp = sub * iva / 100;
        return { pct: pct, ivaPct: iva, recargo: recargo, sub: sub, iva: ivaImp, total: sub + ivaImp, baseRec: baseRec };
    }

    function totales() {
        var t = calculo();
        $('pp-tot').innerHTML =
            (t.recargo > 0 ? '<p>• <strong>Recargo urgencia (' + t.pct + ' % sobre mano de obra y desplazamiento):</strong> ' + eur(t.recargo) + '</p>' : '') +
            '<p>• <strong>Base imponible:</strong> ' + eur(t.sub) + '</p>' +
            '<p>• <strong>IVA (' + t.ivaPct + ' %):</strong> ' + eur(t.iva) + '</p>' +
            '<p style="margin-bottom:0">• <strong>Total:</strong> <span style="color:var(--verde-ia);font-weight:bold;font-size:1.15rem">' + eur(t.total) + '</span></p>';
    }

    function numeroPresupuesto() {
        var n = (leer(K_NUM, 0) || 0) + 1;
        guardar(K_NUM, n);
        return 'JF-' + new Date().getFullYear() + '-' + ('000' + n).slice(-3);
    }

    function datos() {
        return {
            cliente: $('pp-cliente').value.trim(), tel: $('pp-tel').value.trim(), dir: $('pp-dir').value.trim(),
            desc: $('pp-desc').value.trim(), nif: $('pp-nif').value.trim(), mail: $('pp-mail').value.trim(),
            cond: $('pp-cond').value.trim()
        };
    }

    function lineasValidas() { return lineas.filter(function (l) { return l.c.trim() && l.q > 0; }); }

    function documento(numero) {
        var d = datos(), t = calculo(), fecha = new Date().toLocaleDateString('es-ES');
        guardar(K_EMP, { nif: d.nif, mail: d.mail, cond: d.cond });
        var filas = lineasValidas().map(function (l) {
            return '<tr><td>' + esc(l.c) + '</td><td style="text-align:right">' + l.q + '</td><td style="text-align:right">' + eur(l.p) + '</td><td style="text-align:right">' + eur(l.q * l.p) + '</td></tr>';
        }).join('');
        return '<div style="font-family:Arial,sans-serif;color:#111;background:#fff;padding:24px;max-width:780px;margin:0 auto">' +
            '<div style="display:flex;justify-content:space-between;border-bottom:3px solid #1e6091;padding-bottom:10px">' +
              '<div><h1 style="margin:0;font-size:22px;color:#1e6091">J.F Clima &amp; Electricidad</h1>' +
              '<div style="font-size:12px;color:#444">Tel. 642 26 96 80' + (d.mail ? ' · ' + esc(d.mail) : '') + (d.nif ? '<br>NIF/CIF: ' + esc(d.nif) : '') + '</div></div>' +
              '<div style="text-align:right;font-size:13px"><strong>PRESUPUESTO ' + esc(numero) + '</strong><br>Fecha: ' + fecha + '<br>Validez: 15 días</div></div>' +
            '<div style="margin:16px 0;font-size:13px"><strong>Cliente:</strong> ' + esc(d.cliente || '—') + (d.tel ? ' · Tel. ' + esc(d.tel) : '') +
              '<br><strong>Dirección:</strong> ' + esc(d.dir || '—') + '<br><strong>Trabajo:</strong> ' + esc(PRESETS[tipoActual].nombre) +
              (d.desc ? '<br><strong>Descripción:</strong> ' + esc(d.desc) : '') + '</div>' +
            '<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#e8f1f8">' +
              '<th style="text-align:left;padding:6px;border:1px solid #bbb">Concepto</th><th style="padding:6px;border:1px solid #bbb">Cant.</th>' +
              '<th style="padding:6px;border:1px solid #bbb">Precio</th><th style="padding:6px;border:1px solid #bbb">Importe</th></tr></thead><tbody>' +
              filas.replace(/<td/g, '<td style="padding:6px;border:1px solid #ccc;"').replace(/style="padding:6px;border:1px solid #ccc;" style="/g, 'style="padding:6px;border:1px solid #ccc;') +
            '</tbody></table>' +
            '<div style="margin-top:12px;text-align:right;font-size:13px">' +
              (t.recargo > 0 ? 'Recargo urgencia (' + t.pct + ' %): ' + eur(t.recargo) + '<br>' : '') +
              'Base imponible: ' + eur(t.sub) + '<br>IVA (' + t.ivaPct + ' %): ' + eur(t.iva) + '<br>' +
              '<strong style="font-size:17px">TOTAL: ' + eur(t.total) + '</strong></div>' +
            '<div style="margin-top:18px;font-size:11px;color:#444;border-top:1px solid #ccc;padding-top:8px;white-space:pre-line">' + esc(d.cond) + '</div></div>';
    }

    function resumen(numero) {
        var d = datos(), t = calculo();
        var s = '*PRESUPUESTO ' + numero + ' · J.F Clima & Electricidad*\n' + PRESETS[tipoActual].nombre + (d.cliente ? ' · ' + d.cliente : '') + '\n\n';
        lineasValidas().forEach(function (l) { s += '• ' + l.c + ': ' + l.q + ' × ' + eur(l.p) + ' = ' + eur(l.q * l.p) + '\n'; });
        if (t.recargo > 0) s += '• Recargo urgencia (' + t.pct + ' %): ' + eur(t.recargo) + '\n';
        s += '\nBase: ' + eur(t.sub) + '\nIVA (' + t.ivaPct + ' %): ' + eur(t.iva) + '\n*TOTAL: ' + eur(t.total) + '*\n\nValidez: 15 días. Tel. 642 26 96 80';
        return s;
    }

    function aPDF() {
        if (!lineasValidas().length) { $('pp-msg').textContent = 'Añade al menos una partida con cantidad mayor que 0.'; return; }
        var numero = numeroPresupuesto();
        $('pp-print').innerHTML = documento(numero);
        $('pp-msg').textContent = 'Presupuesto ' + numero + ' listo: en la ventana de impresión elige "Guardar como PDF".';
        setTimeout(function () { window.print(); }, 150);
    }

    function aWhatsApp() {
        if (!lineasValidas().length) { $('pp-msg').textContent = 'Añade al menos una partida con cantidad mayor que 0.'; return; }
        var numero = numeroPresupuesto(), tel = datos().tel.replace(/\D/g, '');
        if (tel.length === 9) tel = '34' + tel;
        window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(resumen(numero)), '_blank');
        $('pp-msg').textContent = 'Presupuesto ' + numero + ' abierto en WhatsApp. Revisa el texto antes de enviarlo.';
    }

    function init() {
        var main = document.querySelector('main.panel-tecnico'), menu = document.querySelector('.menu-sidebar');
        if (!main || !menu || $('vista-presupuesto')) return;

        var emp = leer(K_EMP, {});
        var condDefecto = 'Presupuesto válido durante 15 días. Los trabajos o materiales no incluidos se presupuestarán aparte. Precios sujetos a revisión una vez inspeccionada la instalación.';

        var st = document.createElement('style');
        st.textContent = '#pp-print{display:none}@media print{body *{visibility:hidden!important}#pp-print,#pp-print *{visibility:visible!important}#pp-print{display:block!important;position:absolute;left:0;top:0;width:100%;background:#fff}}';
        document.head.appendChild(st);

        var s = document.createElement('section');
        s.id = 'vista-presupuesto'; s.className = 'vista-section oculto';
        s.innerHTML =
            '<header><button type="button" class="btn-volver" onclick="abrirModuloDirecto(\'vista-inicio\')">⬅ Volver al Menú</button>' +
            '<h1>🧾 Presupuesto: avería · urgencia 24 h · climatización</h1></header>' +
            '<div class="seccion-bloque" style="border-top:3px solid #f59e0b"><p style="margin:0;font-size:.88rem;color:#fbbf24">⚠️ Los precios de partida son <strong>de ejemplo</strong>. Cámbialos por los tuyos: se guardan en este dispositivo. El presupuesto es un borrador: revísalo antes de enviarlo.</p></div>' +
            '<div class="seccion-bloque"><h3 style="margin-top:0;color:var(--azul-brillante)">1. Cliente y trabajo</h3><div class="calc-grid">' +
              '<div class="calc-field"><label>Tipo de trabajo:</label><select id="pp-tipo"><option value="averia">Avería eléctrica</option><option value="urgencia">Urgencia 24 horas</option><option value="clima">Climatización</option></select></div>' +
              '<div class="calc-field"><label>Franja horaria:</label><select id="pp-franja">' + FRANJAS.map(function (f) { return '<option value="' + f[0] + '">' + f[1] + '</option>'; }).join('') + '</select></div>' +
              '<div class="calc-field"><label>Cliente:</label><input type="text" id="pp-cliente"></div>' +
              '<div class="calc-field"><label>Teléfono:</label><input type="tel" id="pp-tel" placeholder="6XXXXXXXX"></div>' +
              '<div class="calc-field"><label>Dirección:</label><input type="text" id="pp-dir"></div>' +
              '<div class="calc-field"><label>IVA (%):</label><input type="number" id="pp-iva" value="21" step="1" min="0"></div></div>' +
              '<div class="calc-field"><label>Descripción del trabajo:</label><textarea id="pp-desc" rows="2" style="width:100%"></textarea></div></div>' +
            '<div class="seccion-bloque"><h3 style="margin-top:0;color:var(--azul-brillante)">2. Partidas</h3>' +
              '<div style="overflow-x:auto"><table class="tabla-normativa" style="min-width:560px"><thead><tr><th>Concepto</th><th>Cant.</th><th>Precio €</th><th>Importe</th><th></th></tr></thead><tbody id="pp-lineas"></tbody></table></div>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button type="button" id="pp-add">+ Añadir partida</button><button type="button" id="pp-reset" style="background:#475569">↺ Restaurar partidas del tipo</button></div>' +
              '<div id="pp-tot" class="resultado-caja"></div></div>' +
            '<div class="seccion-bloque"><h3 style="margin-top:0;color:var(--azul-brillante)">3. Datos de J.F y condiciones</h3><div class="calc-grid">' +
              '<div class="calc-field"><label>NIF/CIF (opcional):</label><input type="text" id="pp-nif" value="' + esc(emp.nif || '') + '"></div>' +
              '<div class="calc-field"><label>Email (opcional):</label><input type="text" id="pp-mail" value="' + esc(emp.mail || '') + '"></div></div>' +
              '<div class="calc-field"><label>Condiciones:</label><textarea id="pp-cond" rows="3" style="width:100%">' + esc(emp.cond || condDefecto) + '</textarea></div>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:15px"><button type="button" id="pp-pdf" style="flex:1;background:var(--verde-ia)">🖨️ Generar PDF</button>' +
              '<button type="button" id="pp-wa" style="flex:1;background:var(--verde-wa)">📱 Enviar por WhatsApp</button></div>' +
              '<p id="pp-msg" style="color:#94a3b8;font-size:.85rem;margin-bottom:0"></p></div>';
        main.appendChild(s);
        var pr = document.createElement('div'); pr.id = 'pp-print'; document.body.appendChild(pr);

        $('pp-tipo').onchange = function () { cargarTipo(this.value); };
        $('pp-franja').onchange = totales; $('pp-iva').oninput = totales;
        $('pp-add').onclick = function () { lineas.push({ k: null, c: '', q: 1, p: 0, rec: false }); pintarTabla(); };
        $('pp-reset').onclick = function () { cargarTipo(tipoActual); };
        $('pp-pdf').onclick = aPDF; $('pp-wa').onclick = aWhatsApp;

        var cuerpo = $('pp-lineas');
        cuerpo.addEventListener('input', function (e) {
            var tr = e.target.closest('tr'); if (!tr) return;
            var l = lineas[+tr.getAttribute('data-i')]; if (!l) return;
            if (e.target.className === 'pp-c') l.c = e.target.value;
            if (e.target.className === 'pp-q') l.q = num(e.target.value);
            if (e.target.className === 'pp-p') {
                l.p = num(e.target.value);
                if (l.k) { var tar = leer(K_TAR, {}); tar[l.k] = l.p; guardar(K_TAR, tar); }   // guarda TU precio
            }
            tr.querySelector('.pp-s').textContent = eur(l.q * l.p);
            totales();
        });
        cuerpo.addEventListener('click', function (e) {
            if (e.target.className !== 'pp-x') return;
            lineas.splice(+e.target.closest('tr').getAttribute('data-i'), 1); pintarTabla();
        });

        // Enlace en el menú
        var li = '<li><a href="javascript:void(0)" id="pp-enlace"><span>🧾 Presupuesto (avería · urgencia · clima)</span></a></li>';
        var extras = Array.prototype.find.call(menu.querySelectorAll('.menu-section'), function (m) { return m.textContent.indexOf('HERRAMIENTAS EXTRA') !== -1; });
        if (extras && extras.querySelector('ul')) extras.querySelector('ul').insertAdjacentHTML('afterbegin', li);
        else {
            var b = document.createElement('div'); b.className = 'menu-section';
            b.innerHTML = '<div style="color:var(--azul-brillante);font-size:.8rem;font-weight:bold;margin:15px 0 10px 0">💼 PRESUPUESTOS</div><ul>' + li + '</ul>';
            menu.appendChild(b);
        }
        $('pp-enlace').onclick = function () { window.abrirModuloDirecto('vista-presupuesto'); };
        cargarTipo('averia');
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();


// ==========================================================
// ACCESOS DIRECTOS AL PRESUPUESTO
// - Botón dentro de "🚨 Urgencias 24/7"
// - Enlace directo:  tu-web/#presupuesto-urgencia  (también #presupuesto-averia y #presupuesto-clima)
// ==========================================================
(function () {
    'use strict';
    function abrir(tipo) {
        var sel = document.getElementById('pp-tipo');
        if (sel) { sel.value = tipo; if (sel.onchange) sel.onchange.call(sel); }
        window.abrirModuloDirecto('vista-presupuesto');
    }
    window.abrirPresupuesto = abrir;

    function init() {
        var u = document.getElementById('vista-urgencias');
        if (u && !document.getElementById('pp-btn-urg')) {
            var d = document.createElement('div');
            d.className = 'seccion-bloque';
            d.style.borderTop = '3px solid #16a34a';
            d.innerHTML = '<button type="button" id="pp-btn-urg" style="width:100%;background:#16a34a;padding:14px;font-size:1rem">🧾 Hacer presupuesto de urgencia</button>';
            var banner = u.querySelector('.banner-urgencias');
            if (banner && banner.nextSibling) u.insertBefore(d, banner.nextSibling); else u.appendChild(d);
            document.getElementById('pp-btn-urg').onclick = function () { abrir('urgencia'); };
        }
        var h = (location.hash || '').toLowerCase();
        var mapa = { '#presupuesto-urgencia': 'urgencia', '#presupuesto-averia': 'averia', '#presupuesto-clima': 'clima' };
        if (mapa[h]) abrir(mapa[h]);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();