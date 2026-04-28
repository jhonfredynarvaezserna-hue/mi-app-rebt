function cargarInfo(tipo) {
    const visor = document.getElementById('visor');
    const btnActivo = event.currentTarget;

    // --- EFECTOS VISUALES ---
    if (tipo === 'rebt') {
        btnActivo.classList.add('efecto-rebt');
        setTimeout(() => btnActivo.classList.remove('efecto-rebt'), 500);
        
        visor.innerHTML = `
            <h2 style="color: #d97706">⚡ REBT: Baja Tensión</h2>
            <p><strong>ITC-BT-19:</strong> Instalaciones interiores. Caída máx 3%.</p>
            <p>Colores: Marrón (Fase), Azul (Neutro), Verde/Amarillo (Tierra).</p>
        `;
    } 
    else if (tipo === 'rite') {
        btnActivo.classList.add('efecto-rite');
        setTimeout(() => btnActivo.classList.remove('efecto-rite'), 500);
        
        visor.innerHTML = `
            <h2 style="color: #ef4444">🔥 RITE: Térmicas</h2>
            <p><strong>IDA 2:</strong> Aire de buena calidad para oficinas.</p>
            <p>Revisión obligatoria de calderas y climatización.</p>
        `;
    }
    else if (tipo === 'calculadora') {
        visor.innerHTML = `
            <h2 style="color: #10b981">🧮 Sección de Cable</h2>
            <input type="number" id="potencia" placeholder="Vatios (W)">
            <input type="number" id="longitud" placeholder="Metros (m)">
            <button onclick="calcularCable()" style="background:#10b981; color:white; width:100%; margin-top:10px;">Calcular Sección</button>
            <h3 id="res-cable"></h3>
        `;
    }
    else if (tipo === 'tierra') {
        visor.innerHTML = `
            <h2 style="color: #6366f1">🌱 Resistencia de Tierra</h2>
            <select id="terreno" style="width:100%; padding:10px; margin-bottom:10px;">
                <option value="100">Terreno cultivable (100 Ω·m)</option>
                <option value="500">Suelo pedregoso (500 Ω·m)</option>
                <option value="3000">Roca granítica (3000 Ω·m)</option>
            </select>
            <input type="number" id="picas" placeholder="Número de picas (2m)">
            <button onclick="calcularTierra()" style="background:#6366f1; color:white; width:100%; margin-top:10px;">Calcular Ω</button>
            <h3 id="res-tierra"></h3>
        `;
    }
}

// --- FUNCIONES MATEMÁTICAS ---

function calcularCable() {
    const P = parseFloat(document.getElementById('potencia').value);
    const L = parseFloat(document.getElementById('longitud').value);
    if (P && L) {
        const S = (2 * L * P) / (56 * 6.9 * 230);
        const comerciales = [1.5, 2.5, 4, 6, 10, 16, 25];
        let ok = comerciales.find(s => s >= S);
        document.getElementById('res-cable').innerText = "Sección: " + (ok ? ok + " mm²" : "Muy alta");
    }
}

function calcularTierra() {
    const rho = parseFloat(document.getElementById('terreno').value);
    const n = parseFloat(document.getElementById('picas').value);
    if (rho && n) {
        let R = rho / (n * 2);
        let msg = R.toFixed(2) + " Ω";
        document.getElementById('res-tierra').innerHTML = R > 37 ? msg + " <br><span style='color:red'>⚠️ Alta</span>" : msg + " <br><span style='color:green'>✅ OK</span>";
    }
}