/* avisos-legales.js - J.F Clima & Electricidad
   Añade avisos de IA, privacidad y aviso legal, y corrige textos engañosos.
   Instalación: súbelo junto a index.html y añade antes de </body>:
   <script src="avisos-legales.js" defer></script>
   Revisa los textos legales con una gestoría antes de publicarlos. */
(function () {
    'use strict';

    // ===== RELLENA ESTOS DATOS =====
    var CONFIG = {
        titular: '[TU NOMBRE Y APELLIDOS O RAZÓN SOCIAL]',
        nif: '[TU NIF]',
        domicilio: '[TU DIRECCIÓN]',
        email: '[TU CORREO DE CONTACTO]',
        telefono: '642 269 680',
        instagram: '',   // pon aquí el enlace de tu perfil, por ejemplo https://instagram.com/tuperfil
        facebook: '',    // pon aquí el enlace de tu página de Facebook
        certificadoGases: false // cámbialo a true solo si tienes la habilitación para gases fluorados
    };

    var AVISO_IA = '⚠️ Respuesta orientativa generada por inteligencia artificial. Puede contener errores y no sustituye a un técnico habilitado ni a la normativa vigente. No manipules instalaciones eléctricas, de gas o de climatización sin la cualificación necesaria.';

    var TEXTOS = [
        ['Asesoría técnica oficial con Elena & Gemini', 'Orientación técnica con IA: Elena es un asistente de inteligencia artificial'],
        ['diagnóstico de Elena', 'orientación de Elena (IA)'],
        ['Diagnosticar con Elena', 'Consultar a Elena (IA)'],
        ['Elena · Ingeniera Técnica Virtual', 'Elena · Asistente de inteligencia artificial'],
        ['con resolución técnica oficial', 'con orientación técnica generada por IA'],
        ['la respuesta oficial de Elena', 'una respuesta orientativa de Elena (IA)'],
        ['Dictamen Técnico Oficial:', 'Orientación técnica (IA, no vinculante):'],
        ['Elena Ingeniera Técnica', 'Elena, asistente de IA'],
        ['Elena Ingeniera', 'Elena, asistente de IA'],
        ['Ingeniera', 'Asistente']
    ];
    if (!CONFIG.certificadoGases) {
        TEXTOS.push(['Fugas / carga de gas', 'Revisión de posibles fugas']);
        TEXTOS.push(['Localización de fuga y recarga de refrigerante.', 'Diagnóstico de posibles fugas. La recarga la realiza personal habilitado.']);
        TEXTOS.push(['Climatización / Aire Acondicionado / Carga Gas', 'Climatización / Aire Acondicionado']);
    }

    function reemplazar(texto) {
        var r = texto;
        for (var i = 0; i < TEXTOS.length; i++) {
            if (r.indexOf(TEXTOS[i][0]) !== -1) r = r.split(TEXTOS[i][0]).join(TEXTOS[i][1]);
        }
        return r;
    }

    function corregirTextos() {
        var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        var n;
        while ((n = w.nextNode())) {
            var p = n.parentNode && n.parentNode.nodeName;
            if (p === 'SCRIPT' || p === 'STYLE' || p === 'TEXTAREA' || p === 'OPTION' && false) continue;
            var nuevo = reemplazar(n.nodeValue);
            if (nuevo !== n.nodeValue) n.nodeValue = nuevo;
        }
        var imgs = document.querySelectorAll('img[alt]');
        for (var i = 0; i < imgs.length; i++) {
            var a = reemplazar(imgs[i].getAttribute('alt'));
            if (a !== imgs[i].getAttribute('alt')) imgs[i].setAttribute('alt', a);
        }
        var opts = document.querySelectorAll('option');
        for (var j = 0; j < opts.length; j++) {
            var o = reemplazar(opts[j].textContent);
            if (o !== opts[j].textContent) {
                if (!CONFIG.certificadoGases && opts[j].value.indexOf('Carga Gas') !== -1) opts[j].value = o;
                opts[j].textContent = o;
            }
        }
    }

    function arreglarEnlacesYFotos() {
        var redes = [['https://instagram.com', CONFIG.instagram], ['https://facebook.com', CONFIG.facebook]];
        redes.forEach(function (r) {
            var a = document.querySelector('a[href="' + r[0] + '"]');
            if (!a) return;
            if (r[1]) a.setAttribute('href', r[1]); else a.style.display = 'none';
        });
        var foto = document.querySelector('img[src="tu-imagen-taller.jpg"]');
        if (foto) {
            foto.addEventListener('error', function () { foto.parentNode.style.display = 'none'; });
            if (foto.complete && foto.naturalWidth === 0) foto.parentNode.style.display = 'none';
        }
    }

    function avisoEnResultado(el) {
        if (!el || el.classList.contains('oculto')) return;
        if (el.textContent.replace(/\s+/g, ' ').trim().length < 20) return;
        var ultimo = el.lastElementChild;
        if (ultimo && ultimo.className === 'aviso-ia') return;
        var d = document.createElement('p');
        d.className = 'aviso-ia';
        d.style.cssText = 'margin:12px 0 0 0;padding:8px 10px;border-left:3px solid #f59e0b;background:rgba(245,158,11,.08);color:#fbbf24;font-size:.8rem;line-height:1.4';
        d.textContent = AVISO_IA;
        el.appendChild(d);
    }

    function vigilarResultados() {
        ['gestor-ia-resultado', 'resultados-busqueda', 'ict-ia-resultado', 'respuesta-voz-box'].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            avisoEnResultado(el);
            new MutationObserver(function () { avisoEnResultado(el); })
                .observe(el, { childList: true, attributes: true, attributeFilter: ['class'] });
        });
    }

    function caja(texto, estilo) {
        var d = document.createElement('div');
        d.style.cssText = estilo;
        d.innerHTML = texto;
        return d;
    }

    function avisosEnFormularios() {
        var estilo = 'margin:0 0 12px 0;padding:10px 12px;border-radius:6px;background:rgba(24,143,167,.12);border:1px solid #188fa7;color:#cbd5e1;font-size:.85rem;line-height:1.45';
        var nombre = document.getElementById('gestor-nombre');
        if (nombre && !document.getElementById('aviso-elena-ia')) {
            var c = caja('🤖 <strong>Elena es un asistente de inteligencia artificial</strong>, no una persona ni un técnico titulado. Sus respuestas son orientativas. Si prefieres hablar con una persona, usa el botón de WhatsApp o llama al ' + CONFIG.telefono + '.', estilo);
            c.id = 'aviso-elena-ia';
            nombre.parentNode.insertBefore(c, nombre);
        }
        var msg = document.getElementById('gestor-mensaje');
        if (msg && !document.getElementById('aviso-privacidad-form')) {
            var p = caja('🔒 Tus datos se usan solo para atender tu consulta. Las consultas con IA se procesan con un proveedor externo (Google Gemini) y al enviar por WhatsApp los datos pasan a Meta. No incluyas datos sensibles. Más información en el <a href="#" data-abrir="privacidad" style="color:#10b981;text-decoration:underline">aviso de privacidad</a>.', estilo.replace('rgba(24,143,167,.12)', 'rgba(255,255,255,.04)').replace('#188fa7', '#223347'));
            p.id = 'aviso-privacidad-form';
            msg.parentNode.insertBefore(p, msg.nextSibling);
        }
        var voz = document.getElementById('status-voz');
        if (voz && !document.getElementById('aviso-voz-ia')) {
            var v = caja('🤖 Estás hablando con una inteligencia artificial. Tu voz se procesa para generar la respuesta. No digas datos personales ni sensibles.', estilo + ';max-width:600px;margin:12px auto');
            v.id = 'aviso-voz-ia';
            voz.parentNode.insertBefore(v, voz);
        }
        var urg = document.querySelectorAll('#vista-urgencias .seccion-bloque');
        if (urg.length > 1 && !document.getElementById('aviso-gases') && !CONFIG.certificadoGases) {
            var g = caja('ℹ️ Los trabajos con gases refrigerantes solo los realiza personal con certificación de gases fluorados.', 'margin-top:12px;font-size:.82rem;color:#94a3b8');
            g.id = 'aviso-gases';
            urg[1].appendChild(g);
        }
    }

    function modal(titulo, html) {
        var viejo = document.getElementById('modal-legal');
        if (viejo) viejo.remove();
        var m = document.createElement('div');
        m.id = 'modal-legal';
        m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:1000000;display:flex;align-items:center;justify-content:center;padding:15px';
        m.innerHTML = '<div style="background:#131e2b;border:1px solid #223347;border-radius:12px;max-width:640px;width:100%;max-height:85vh;overflow:auto;padding:22px;color:#e2e8f0;font-size:.9rem;line-height:1.55">' +
            '<h3 style="margin:0 0 12px 0;color:#188fa7">' + titulo + '</h3>' + html +
            '<button type="button" id="cerrar-modal-legal" style="margin-top:14px;width:100%;padding:10px">Cerrar</button></div>';
        document.body.appendChild(m);
        m.addEventListener('click', function (e) { if (e.target === m || e.target.id === 'cerrar-modal-legal') m.remove(); });
    }

    function responsable() {
        return '<p><strong>Titular:</strong> ' + CONFIG.titular + ' (J.F Instalación y Mantenimiento)<br><strong>NIF:</strong> ' + CONFIG.nif +
            '<br><strong>Domicilio:</strong> ' + CONFIG.domicilio + '<br><strong>Correo:</strong> ' + CONFIG.email + '<br><strong>Teléfono:</strong> ' + CONFIG.telefono + '</p>';
    }

    function abrirLegal() {
        modal('Aviso legal', responsable() +
            '<p>Esta plataforma ofrece información técnica orientativa y herramientas de cálculo. Parte de las respuestas se generan con inteligencia artificial, pueden contener errores y no sustituyen la valoración de un técnico habilitado, un proyecto ni la normativa vigente (REBT, RITE y otras). Los cálculos son estimaciones. El titular no se responsabiliza del uso que se haga de ellos sin la supervisión de un profesional cualificado.</p>' +
            '<p>Los trabajos eléctricos y de climatización deben realizarlos personas y empresas con la habilitación que exija la ley. Si hay riesgo de incendio, descarga o peligro para las personas, llama al 112.</p>');
    }

    function abrirPrivacidad() {
        modal('Aviso de privacidad', responsable() +
            '<p><strong>Qué datos tratamos:</strong> nombre, teléfono, dirección y descripción de la avería o consulta que nos envíes, y la voz si usas el asistente de voz.</p>' +
            '<p><strong>Para qué:</strong> atender tu consulta o aviso y contactar contigo. Base legal: tu consentimiento y la gestión de tu solicitud.</p>' +
            '<p><strong>Quién más los recibe:</strong> Google (Gemini) procesa las consultas hechas con el asistente de IA, y Meta (WhatsApp) si nos escribes por ahí. No vendemos tus datos.</p>' +
            '<p><strong>Cuánto tiempo:</strong> el necesario para atender tu consulta y cumplir las obligaciones legales.</p>' +
            '<p><strong>Tus derechos:</strong> acceder, rectificar, suprimir, oponerte, limitar el tratamiento y portar tus datos, escribiendo a ' + CONFIG.email + '. Si crees que no se han respetado, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>' +
            '<p style="color:#94a3b8;font-size:.8rem">Texto orientativo: revísalo con una gestoría antes de publicarlo.</p>');
    }

    function pie() {
        if (document.getElementById('pie-legal')) return;
        var p = document.createElement('div');
        p.id = 'pie-legal';
        p.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:9998;font-size:.72rem;background:rgba(10,17,24,.85);padding:5px 9px;border-radius:6px;border:1px solid #223347';
        p.innerHTML = '<a href="#" data-abrir="legal" style="color:#94a3b8">Aviso legal</a> · <a href="#" data-abrir="privacidad" style="color:#94a3b8">Privacidad</a>';
        document.body.appendChild(p);
    }

    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('[data-abrir]');
        if (!a) return;
        e.preventDefault();
        if (a.getAttribute('data-abrir') === 'legal') abrirLegal(); else abrirPrivacidad();
    });

    function aplicar() {
        corregirTextos();
        arreglarEnlacesYFotos();
        avisosEnFormularios();
    }

    function iniciar() {
        aplicar();
        vigilarResultados();
        pie();
        var t = null;
        new MutationObserver(function () {
            clearTimeout(t);
            t = setTimeout(aplicar, 300);
        }).observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();