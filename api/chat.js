// ==========================================
// SERVICIO Y GESTIÓN SM - API DE ELENA
// Gemini API mediante REST
// ==========================================

export default async function handler(req, res) {

  // ------------------------------------------
  // CORS
  // ------------------------------------------
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ------------------------------------------
  // Solo permitimos POST
  // ------------------------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método no permitido'
    });
  }

  // ------------------------------------------
  // API KEY
  // ------------------------------------------
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_KEY;

  if (!apiKey) {
    console.error('ERROR: No existe GEMINI_API_KEY');

    return res.status(500).json({
      error: 'Falta configurar GEMINI_API_KEY en Vercel.'
    });
  }

  try {

    // ------------------------------------------
    // RECIBIR PROMPT
    // ------------------------------------------
    const body = req.body || {};
    const prompt = typeof body.prompt === 'string'
      ? body.prompt.trim()
      : '';

    if (!prompt) {
      return res.status(400).json({
        error: 'El mensaje está vacío.'
      });
    }

    // ------------------------------------------
    // INSTRUCCIONES DE ELENA
    // ------------------------------------------
    const sistemaInstruccion = `
Eres Elena, ingeniera técnica industrial y eléctrica
de la empresa "Servicio y Gestión SM" en España.

Tu función es asesorar a instaladores autorizados,
electricistas y técnicos.

Tus especialidades incluyen:

- REBT
- RITE
- ITC-BT
- ITC-BT-52
- ITC-BT-40
- ICT-2
- instalaciones eléctricas
- protecciones
- diferenciales
- magnetotérmicos
- caída de tensión
- secciones de conductores
- vehículos eléctricos
- instalaciones fotovoltaicas
- telecomunicaciones
- automatización

Responde siempre en español.

Habla en femenino.

Utiliza un tono técnico, claro, profesional y directo.

Cuando sea necesario, indica la ITC o normativa aplicable.

No inventes artículos ni valores reglamentarios.
Si no puedes confirmar un dato normativo, indícalo claramente.

Puedes utilizar HTML sencillo para facilitar la lectura:

<strong>
<br>
<ul>
<li>

No utilices Markdown complejo.
`;

    // ------------------------------------------
    // URL GEMINI
    // ------------------------------------------
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    // ------------------------------------------
    // PETICIÓN A GEMINI
    // ------------------------------------------
    const respuestaGemini = await fetch(url, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },

      body: JSON.stringify({

        systemInstruction: {
          parts: [
            {
              text: sistemaInstruccion
            }
          ]
        },

        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],

        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }

      })
    });

    // ------------------------------------------
    // LEER RESPUESTA DE GOOGLE
    // ------------------------------------------
    const datos = await respuestaGemini.json();

    // ------------------------------------------
    // SI GEMINI DEVUELVE ERROR
    // ------------------------------------------
    if (!respuestaGemini.ok) {

      console.error(
        'Error de Gemini:',
        JSON.stringify(datos, null, 2)
      );

      const mensajeGoogle =
        datos?.error?.message ||
        'Error desconocido de Gemini';

      return res.status(respuestaGemini.status).json({
        error: 'Gemini ha rechazado la solicitud.',
        details: mensajeGoogle
      });
    }

    // ------------------------------------------
    // EXTRAER TEXTO
    // ------------------------------------------
    const textoRespuesta =
      datos?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || '')
        .join('')
        .trim();

    if (!textoRespuesta) {

      console.error(
        'Gemini respondió sin texto:',
        JSON.stringify(datos, null, 2)
      );

      return res.status(502).json({
        error: 'Gemini no devolvió texto.',
        details: 'La respuesta no contiene candidates/content/parts.'
      });
    }

    // ------------------------------------------
    // RESPUESTA FINAL A MAIN.JS
    // ------------------------------------------
    return res.status(200).json({
      text: textoRespuesta,
      respuesta: textoRespuesta
    });

  } catch (error) {

    console.error(
      'ERROR INTERNO API ELENA:',
      error
    );

    return res.status(500).json({
      error: 'Error interno del servidor.',
      details: error?.message || String(error)
    });
  }
}