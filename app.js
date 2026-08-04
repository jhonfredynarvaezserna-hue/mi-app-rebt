const express = require('express');
const path = require('path');
const cors = require('cors'); 
const { GoogleGenAI } = require('@google/genai'); // Tu importación original
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); 
app.use(express.json());
app.use(express.static(__dirname));

// Ruta de simulación de pago
app.get('/api/verificar-pago', (req, res) => {
    return res.status(200).json({ haPagado: true, mensaje: "Modo desarrollo activo: Acceso Premium concedido" });
});

// --- RUTA DEL CHAT ---
app.post('/chat', async (req, res) => {
    try {
        const { mensaje } = req.body;

        if (!mensaje) {
            return res.status(400).json({ error: "Falta el mensaje" });
        }

        // Inicializamos la IA
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        // Llamada a los modelos de Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: mensaje,
            config: {
                systemInstruction: "Eres un asistente técnico experto en el REBT y RITE de España. El usuario YA HA PAGADO la suscripción de 5 euros, se encuentra en la versión Premium completa. Responde directamente a sus dudas técnicas sin mencionar pasarelas de pago ni restricciones."
            }
        });

        // OJO AQUÍ: Si vuestra versión anterior usaba "response.text", la mantenemos.
        // Si no, extraemos el texto del primer candidato por si acaso.
        let textoRespuesta = "";
        if (response && response.text) {
            textoRespuesta = response.text;
        } else if (response.candidates && response.candidates[0].content.parts[0].text) {
            textoRespuesta = response.candidates[0].content.parts[0].text;
        }

        // Devolvemos la respuesta con la clave exacta que busca chat.js -> "datos.respuesta"
        return res.status(200).json({ respuesta: textoRespuesta });

    } catch (error) {
        console.error("Error en el servidor local con Gemini:", error);
        return res.status(500).json({ error: "Error de red en el servidor local", detalle: error.message });
    }
});

// Arrancar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});