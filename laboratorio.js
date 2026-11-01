// ==========================================================
// J.F - lABORATORIO INTERACTIVO (anexo, no toca main.js)
// 1) Dos depósitos con prioridad (tu práctica, simulada)
// 2) Contactor y campo magnético (electroimán)
// 3) Coche eléctrico: precarga de batería e interbloqueo de carga
// Carga este archivo DESPUÉS de main.js:  <script src="laboratorio.js"></script>
// ==========================================================
(function () {
    'use strict';
    var $ = function (id) { return document.getElementById(id); };
    var ON = '#10b981', OFF = '#334155', WARN = '#ef4444';

    // ---------- CSS ----------
    var st = document.createElement('style');
    st.textContent =
        '@keyframes jfspin{to{transform:rotate(360deg)}}' +
        '.jf-spin{animation:jfspin .8s linear infinite;transform-box:fill-box;transform-origin:center}' +
        '.lab-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}' +
        '.lab-tabs button{flex:1;background:var(--input-bg);border:1px solid var(--bordes)}' +
        '.lab-tabs button.act{background:var(--azul-brillante);color:#fff}' +
        '.lab-ctl{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}' +
        '.lab-ctl button{flex:1;min-width:110px;background:var(--input-bg);border:1px solid var(--bordes)}' +
        '.lab-ctl button.on{background:#065f46;border-color:#10b981}' +
        '.lab-bar{height:22px;background:#1e293b;border-radius:6px;overflow:hidden}' +
        '.lab-bar>div{height:100%;width:0;background:#38bdf8;transition:width .1s}';
    document.head.appendChild(st);

    // ---------- HTML ----------
    var HTML = '' +
    '<header><button type="button" class="btn-volver" onclick="abrirModuloDirecto(\'vista-inicio\')">⬅ Volver al Menú</button>' +
    '<h1>🧪 Laboratorio interactivo</h1></header>' +
    '<div class="seccion-bloque"><div class="lab-tabs">' +
      '<button type="button" data-t="dep" class="act">💧 Dos depósitos</button>' +
      '<button type="button" data-t="con">🧲 Contactor</button>' +
      '<button type="button" data-t="ev">🚗 Coche eléctrico</button></div>' +

    // --- TAB DEPÓSITOS ---
    '<div id="lab-dep">' +
      '<p style="color:#94a3b8;margin-top:0">Tu práctica con interbloqueo cruzado. B2 actuado arranca la bomba 1 y bloquea la 2 (prioridad). S1/S2 simulan B3/B4 (paro/marcha de la bomba 2).</p>' +
      '<svg viewBox="0 0 640 190" style="width:100%;max-width:640px;display:block;margin:auto">' +
        '<g transform="translate(40,0)"><text x="0" y="22" fill="#cbd5e1" font-size="14">Bomba 1 · KM1</text>' +
          '<rect id="d-c1" x="10" y="35" width="70" height="32" rx="4" fill="' + OFF + '" stroke="#94a3b8"/><text x="30" y="56" fill="#fff" font-size="13">KM1</text>' +
          '<line x1="45" y1="67" x2="45" y2="100" stroke="#94a3b8"/>' +
          '<circle id="d-m1" cx="45" cy="130" r="28" fill="' + OFF + '" stroke="#94a3b8"/>' +
          '<g id="d-r1"><line x1="45" y1="130" x2="45" y2="108" stroke="#fff" stroke-width="3"/></g>' +
          '<text x="39" y="168" fill="#cbd5e1" font-size="13">M1</text></g>' +
        '<g transform="translate(340,0)"><text x="0" y="22" fill="#cbd5e1" font-size="14">Bomba 2 · KM2</text>' +
          '<rect id="d-c2" x="10" y="35" width="70" height="32" rx="4" fill="' + OFF + '" stroke="#94a3b8"/><text x="30" y="56" fill="#fff" font-size="13">KM2</text>' +
          '<line x1="45" y1="67" x2="45" y2="100" stroke="#94a3b8"/>' +
          '<circle id="d-m2" cx="45" cy="130" r="28" fill="' + OFF + '" stroke="#94a3b8"/>' +
          '<g id="d-r2"><line x1="45" y1="130" x2="45" y2="108" stroke="#fff" stroke-width="3"/></g>' +
          '<text x="39" y="168" fill="#cbd5e1" font-size="13">M2</text></g>' +
      '</svg>' +
      '<div class="lab-ctl" id="d-ctl">' +
        '<button type="button" data-k="B2" data-m="t">B2 actuado (arranca B1, bloquea B2)</button>' +
        '<button type="button" data-k="B1" data-m="t">B1 actuado (paro bomba 1)</button>' +
        '<button type="button" data-k="S2" data-m="p">S2 marcha bomba 2 (pulsar)</button>' +
        '<button type="button" data-k="S1" data-m="p">S1 paro bomba 2 (pulsar)</button>' +
        '<button type="button" data-k="F1" data-m="t">Disparo térmico F1</button>' +
        '<button type="button" data-k="F2" data-m="t">Disparo térmico F2</button></div>' +
      '<div id="d-txt" class="resultado-caja"></div>' +
    '</div>' +

    // --- TAB CONTACTOR ---
    '<div id="lab-con" class="oculto">' +
      '<p style="color:#94a3b8;margin-top:0">Al pasar corriente por la bobina se crea un campo magnético (electroimán) que atrae la armadura y cierra los contactos de fuerza.</p>' +
      '<svg viewBox="0 0 400 220" style="width:100%;max-width:400px;display:block;margin:auto">' +
        '<g id="c-field" opacity="0">' +
          '<ellipse cx="200" cy="120" rx="95" ry="55" fill="none" stroke="#38bdf8" stroke-dasharray="5 4"/>' +
          '<ellipse cx="200" cy="120" rx="125" ry="75" fill="none" stroke="#38bdf8" stroke-dasharray="5 4"/></g>' +
        '<rect x="150" y="95" width="100" height="50" rx="6" fill="#92400e" stroke="#fbbf24"/><text x="178" y="125" fill="#fff" font-size="13">Bobina</text>' +
        '<rect x="170" y="145" width="60" height="20" fill="#64748b"/>' +
        '<g id="c-arm"><rect x="150" y="60" width="100" height="14" fill="#94a3b8"/>' +
          '<line x1="200" y1="60" x2="200" y2="30" stroke="#94a3b8" stroke-width="4"/></g>' +
        '<line x1="60" y1="20" x2="170" y2="20" stroke="#94a3b8" stroke-width="3"/>' +
        '<line id="c-ct" x1="170" y1="20" x2="230" y2="2" stroke="#ef4444" stroke-width="3"/>' +
        '<line x1="230" y1="20" x2="340" y2="20" stroke="#94a3b8" stroke-width="3"/>' +
        '<text x="10" y="205" fill="#94a3b8" font-size="12">Contacto de fuerza (arriba)</text></svg>' +
      '<div class="lab-ctl"><button type="button" id="c-btn">⚡ Energizar bobina</button></div>' +
      '<div id="c-txt" class="resultado-caja"></div>' +
    '</div>' +

    // --- TAB EV ---
    '<div id="lab-ev" class="oculto">' +
      '<p style="color:#94a3b8;margin-top:0">Precarga de la batería de alta tensión (400 V): primero se cierra el contactor negativo y el de precarga, la tensión del bus sube por la resistencia y, al ~95 %, se cierra el positivo y se abre la precarga. Así se evita la corriente de pico.</p>' +
      '<div class="lab-bar"><div id="e-bar"></div></div>' +
      '<div id="e-txt" class="resultado-caja"></div>' +
      '<div class="lab-ctl"><button type="button" id="e-start">▶ Arrancar (READY)</button>' +
        '<button type="button" id="e-stop">⏹ Parar</button>' +
        '<button type="button" id="e-cable">🔌 Conectar cable de carga</button></div>' +
      '<p style="font-size:.8rem;color:#94a3b8;margin-bottom:0">Interbloqueo: con el cable conectado no se puede arrancar la tracción, y si se conecta en marcha se corta. Es la misma lógica de exclusión mutua de tus bombas.</p>' +
    '</div></div>';

    // ---------- 1. DEPÓSITOS ----------
    var D = { B1: 0, B2: 0, S1: 0, S2: 0, F1: 0, F2: 0, KM1: 0, KM2: 0 };
    function solve() {
        for (var i = 0; i < 6; i++) {
            var k1 = (!D.F1 && !D.B1 && !D.KM2 && (D.B2 || D.KM1)) ? 1 : 0;
            var k2 = (!D.F2 && !D.S1 && !D.B2 && !D.KM1 && (D.S2 || D.KM2)) ? 1 : 0;
            if (k1 === D.KM1 && k2 === D.KM2) break;
            D.KM1 = k1; D.KM2 = k2;
        }
        pintarDep();
    }
    function pintarDep() {
        [1, 2].forEach(function (n) {
            var on = D['KM' + n];
            $('d-c' + n).setAttribute('fill', on ? ON : OFF);
            $('d-m' + n).setAttribute('fill', on ? ON : OFF);
            $('d-r' + n).setAttribute('class', on ? 'jf-spin' : '');
        });
        $('d-txt').innerHTML =
            '<p>• <strong>KM1:</strong> ' + (D.KM1 ? 'activado (bomba 1 en marcha)' : 'desactivado') + '</p>' +
            '<p>• <strong>KM2:</strong> ' + (D.KM2 ? 'activado (bomba 2 en marcha)' : 'desactivado') + '</p>' +
            '<p style="margin-bottom:0">• <strong>Contactos NC de interbloqueo:</strong> KM2 en rama 1 ' + (D.KM2 ? 'abierto' : 'cerrado') +
            ' · KM1 en rama 2 ' + (D.KM1 ? 'abierto' : 'cerrado') + '</p>';
    }
    function initDep() {
        Array.prototype.forEach.call($('d-ctl').querySelectorAll('button'), function (b) {
            var k = b.getAttribute('data-k'), m = b.getAttribute('data-m');
            if (m === 't') b.onclick = function () { D[k] = D[k] ? 0 : 1; b.classList.toggle('on', !!D[k]); solve(); };
            else {
                var dn = function (e) { e.preventDefault(); D[k] = 1; b.classList.add('on'); solve(); };
                var up = function () { D[k] = 0; b.classList.remove('on'); solve(); };
                b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up);
                b.addEventListener('pointerleave', function () { if (D[k]) up(); });
            }
        });
        solve();
    }

    // ---------- 2. CONTACTOR ----------
    var cOn = 0;
    function pintarCon() {
        $('c-field').setAttribute('opacity', cOn ? 1 : 0);
        $('c-arm').setAttribute('transform', cOn ? 'translate(0,20)' : '');
        var ct = $('c-ct');
        ct.setAttribute('y2', cOn ? 20 : 2); ct.setAttribute('stroke', cOn ? ON : WARN);
        $('c-btn').classList.toggle('on', !!cOn);
        $('c-txt').innerHTML = cOn
            ? '<p style="margin:0">• Bobina excitada → campo magnético → armadura atraída → <strong>contactos cerrados</strong>, pasa corriente al motor.</p>'
            : '<p style="margin:0">• Bobina sin corriente → sin campo → el muelle separa la armadura → <strong>contactos abiertos</strong>.</p>';
    }

    // ---------- 3. COCHE ELÉCTRICO ----------
    var Vb = 400, Rpre = 50, tau = 0.8;
    var E = { st: 'OFF', v: 0, t: 0, neg: 0, pre: 0, pos: 0, cable: 0, timer: null, msg: '' };
    function pintarEv() {
        $('e-bar').style.width = (E.v / Vb * 100) + '%';
        var I = E.pre ? (Vb - E.v) / Rpre : 0;
        $('e-txt').innerHTML =
            '<p>• <strong>Estado:</strong> ' + E.st + ' · <strong>Bus:</strong> ' + E.v.toFixed(0) + ' V / ' + Vb + ' V</p>' +
            '<p>• <strong>K−:</strong> ' + (E.neg ? 'cerrado' : 'abierto') + ' · <strong>K precarga:</strong> ' + (E.pre ? 'cerrado' : 'abierto') +
            ' · <strong>K+:</strong> ' + (E.pos ? 'cerrado' : 'abierto') + '</p>' +
            '<p>• <strong>Corriente por la resistencia de precarga:</strong> ' + I.toFixed(1) + ' A</p>' +
            '<p style="margin-bottom:0;color:#fbbf24">' + (E.msg || '&nbsp;') + '</p>';
        $('e-cable').classList.toggle('on', !!E.cable);
    }
    function evParar(msg) {
        clearInterval(E.timer);
        E.st = 'OFF'; E.v = 0; E.t = 0; E.neg = E.pre = E.pos = 0; E.msg = msg || '';
        pintarEv();
    }
    function evArrancar() {
        if (E.cable) { E.msg = '⛔ Bloqueado: cable de carga conectado.'; pintarEv(); return; }
        if (E.st !== 'OFF') return;
        E.msg = ''; E.st = 'PRECARGA'; E.neg = 1; E.pre = 1; E.t = 0;
        E.timer = setInterval(function () {
            E.t += 0.1; E.v = Vb * (1 - Math.exp(-E.t / tau));
            if (E.v >= 0.95 * Vb) {
                clearInterval(E.timer);
                E.pos = 1; E.pre = 0; E.v = Vb; E.st = 'READY';
                E.msg = '✅ Precarga completada: K+ cerrado, K precarga abierto.';
            }
            pintarEv();
        }, 100);
        pintarEv();
    }

    // ---------- INYECCIÓN ----------
    function init() {
        var main = document.querySelector('main.panel-tecnico'), menu = document.querySelector('.menu-sidebar');
        if (!main || !menu || $('vista-laboratorio')) return;
        var s = document.createElement('section');
        s.id = 'vista-laboratorio'; s.className = 'vista-section oculto'; s.innerHTML = HTML;
        main.appendChild(s);

        var bloque = document.createElement('div');
        bloque.className = 'menu-section';
        bloque.innerHTML = '<div style="color:var(--azul-brillante);font-size:.8rem;font-weight:bold;margin:15px 0 10px 0">🧪 LABORATORIO</div><ul>' +
            '<li><a href="javascript:void(0)" id="lab-enlace"><span>🧪 Simulador (depósitos · contactor · EV)</span></a></li></ul>';
        var gestion = Array.prototype.find.call(menu.querySelectorAll('.menu-section'), function (m) { return m.textContent.indexOf('GESTIÓN') !== -1; });
        if (gestion) menu.insertBefore(bloque, gestion); else menu.appendChild(bloque);
        $('lab-enlace').onclick = function () { window.abrirModuloDirecto('vista-laboratorio'); };

        Array.prototype.forEach.call(s.querySelectorAll('.lab-tabs button'), function (b) {
            b.onclick = function () {
                Array.prototype.forEach.call(s.querySelectorAll('.lab-tabs button'), function (x) { x.classList.toggle('act', x === b); });
                ['dep', 'con', 'ev'].forEach(function (t) { $('lab-' + t).classList.toggle('oculto', t !== b.getAttribute('data-t')); });
            };
        });

        initDep();
        $('c-btn').onclick = function () { cOn = cOn ? 0 : 1; pintarCon(); }; pintarCon();
        $('e-start').onclick = evArrancar;
        $('e-stop').onclick = function () { evParar('Parada manual.'); };
        $('e-cable').onclick = function () {
            E.cable = E.cable ? 0 : 1;
            if (E.cable && E.st !== 'OFF') evParar('⛔ Cable conectado: tracción cortada por interbloqueo.');
            else { E.msg = E.cable ? 'Cable conectado: arranque inhibido.' : ''; pintarEv(); }
        };
        pintarEv();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();