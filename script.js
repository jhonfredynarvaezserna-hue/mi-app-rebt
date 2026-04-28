function mostrar(tipo) {
    const contenedor = document.getElementById('contenido');
    
    if (tipo === 'rebt') {
        contenedor.innerHTML = `
            <h2>⚡ Reglamento Electrotécnico (REBT)</h2>
            <p><strong>Concepto clave:</strong> Seguridad en instalaciones de baja tensión.</p>
            <ul>
                <li>ITC-BT-19: Instalaciones interiores.</li>
                <li>ITC-BT-25: Circuitos en viviendas.</li>
            </ul>
        `;
    } else if (tipo === 'rite') {
        contenedor.innerHTML = `
            <h2>🔥 Reglamento Térmico (RITE)</h2>
            <p><strong>Concepto clave:</strong> Eficiencia energética y bienestar térmico.</p>
            <ul>
                <li>Calidad del aire (IDA).</li>
                <li>Mantenimiento de calderas y aire acondicionado.</li>
            </ul>
        `;
    }
}