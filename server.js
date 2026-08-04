require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Airtable = require('airtable');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de middlewares
app.use(cors()); // Habilita peticiones cruzadas para evitar bloqueos del navegador
app.use(express.json());
app.use(express.static(path.join(__dirname, './'))); // Sirve index.html, style.css, chat.js, etc.

// Configuración de Gemini IA
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configuración de Airtable
const baseAirtable = process.env.AIRTABLE_ACCESS_TOKEN && process.env.AIRTABLE_BASE_ID
    ? new Airtable({ apiKey: process.env.AIRTABLE_ACCESS_TOKEN }).base(process.env.AIRTABLE_BASE_ID)
    : null;

// Configuración de columnas en Airtable
const CONFIG_AIRTABLE = {
    TABLA_NOMBRE: process.env.AIRTABLE_TABLE_NAME || 'Articulos', // Si lleva acento en Airtable pon 'Artículos'
    CAMPO_TITULO: 'Titulo',
    CAMPO_ITC: 'ITC',
    CAMPO_CONTENIDO: 'Contenido',
    CAMPO_NORMATIVA: 'Normativa'
};

// ===================================================
// 1. RUTA PARA EL BUSCADOR TÉCNICO (REBT / RITE)
// ===================================================
app.get('/buscar-reglamento', async (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase().trim() : '';
    
    console.log(`\n🔍 [Buscador] Procesando consulta para: "${query}"`);
    
    if (!query) {
        return res.json([]);
    }

    if (!baseAirtable) {
        console.error("❌ [Error Airtable] No se configuró AIRTABLE_ACCESS_TOKEN o AIRTABLE_BASE_ID en el archivo .env");
        return res.status(500).json({ error: "Falta configuración de Airtable en el servidor" });
    }

    try {
        // Limpiamos la cadena de comillas simples para evitar romper la fórmula de Airtable
        const queryLimpia = query.replace(/'/g, "\\'");

        const formulaBusqueda = `OR(
            FIND('${queryLimpia}', LOWER({${CONFIG_AIRTABLE.CAMPO_TITULO}})),
            FIND('${queryLimpia}', LOWER({${CONFIG_AIRTABLE.CAMPO_ITC}})),
            FIND('${queryLimpia}', LOWER({${CONFIG_AIRTABLE.CAMPO_CONTENIDO}}))
        )`;

        const registros = await baseAirtable(CONFIG_AIRTABLE.TABLA_NOMBRE).select({
            maxRecords: 6,
            filterByFormula: formulaBusqueda
        }).firstPage();

        console.log(`✅ [Buscador] Airtable ha devuelto ${registros.length} registros.`);

        const resultados = registros.map(reg => ({
            id: reg.id,
            itc: reg.get(CONFIG_AIRTABLE.CAMPO_ITC) || 'General',
            titulo: reg.get(CONFIG_AIRTABLE.CAMPO_TITULO) || 'Sin título',
            contenido: reg.get(CONFIG_AIRTABLE.CAMPO_CONTENIDO) || 'No hay descripción disponible.',
            normativa: reg.get(CONFIG_AIRTABLE.CAMPO_NORMATIVA) || 'REBT'
        }));

        res.json(resultados);

    } catch (error) {
        console.error("❌ [Error Airtable] Fallo al consultar la base de datos:", error.message);
        res.status(500).json({ error: "Error al consultar la base de datos de Airtable" });
    }
});

// ===================================================
// 2. RUTA PARA EL ASISTENTE TÉCNICO CON GEMINI IA
// ===================================================
app.post('/chat', async (req, res) => {
    const { mensaje } = req.body;

    if (!mensaje) {
        return res.status(400).json({ respuesta: "El mensaje no puede estar vacío." });
    }

    try {
        console.log(`🤖 [IA] Consulta recibida: "${mensaje}"`);

        // Llamada directa a Gemini 2.5 Flash
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: mensaje,
            config: {
                systemInstruction: `Eres un Asistente Técnico experto de la plataforma "Servicio y Gestión SM". 
Especializado en normativa eléctrica española (REBT, RITE, ITC-BT-52 para Vehículo Eléctrico), automatismos industriales, esquemas de maniobra/potencia, domótica KNX y presupuestos.
Responde de forma clara, técnica, precisa y profesional.`,
            }
        });

        const respuestaTexto = response.text;
        res.json({ respuesta: respuestaTexto });

    } catch (error) {
        console.error("❌ [Error Gemini IA]:", error.message);
        res.status(500).json({ 
            respuesta: "Lo siento, ha ocurrido un error al conectar con el motor de IA de Gemini. Revisa la API Key en el archivo .env." 
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`==================================================================`);
    console.log(`⚡ SERVIDOR DE SERVICIO Y GESTIÓN SM ACTIVO`);
    console.log(`🌍 Ejecutándose localmente en: http://localhost:${PORT}`);
    console.log(`==================================================================`);
});