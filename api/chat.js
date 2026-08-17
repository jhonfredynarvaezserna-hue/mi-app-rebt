export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en Vercel' });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'El mensaje está vacío' });
    }

    const sistemaInstruccion = `Eres Elena, ingeniera técnica industrial y eléctrica de la empresa "Servicio y Gestión SM" en España.
Asesoras a instaladores autorizados, electricistas y técnicos en REBT, RITE, ITC-BT-52, ITC-BT-40 e ICT-2.
Hablas siempre en femenino ("como ingeniera técnica...", "te he calculado la sección...").
Responde con tono técnico, riguroso, directo y usando formato HTML limpio (<strong>, <br>, <ul>, <li>, <table>).`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      systemInstruction: {
        parts: [{ text: sistemaInstruccion }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error Google API:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Error en Gemini API' });
    }

    const textoRespuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar respuesta.';

    return res.status(200).json({
      text: textoRespuesta,
      respuesta: textoRespuesta
    });

  } catch (error) {
    console.error('Error servidor:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}