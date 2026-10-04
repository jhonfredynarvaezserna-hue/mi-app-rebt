// ==========================================
// J.F CLIMA & ELECTRICIDAD - API DE ELENA (api/chat.js)
// ==========================================

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;

  if (!apiKey) {
    console.error('ERROR: No existe GEMINI_API_KEY');
    return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en Vercel.' });
  }

  try {
    const body = req.body || {};

    // Acepta el mensaje como "prompt" o como "message" (Make, WhatsApp...)
    const rawPrompt = body.prompt ?? body.message ?? '';
    const prompt = typeof rawPrompt === 'string' ? rawPrompt.trim() : '';

    if (!prompt) {
      return res.status(400).json({ error: 'El mensaje está vacío.' });
    }

    // ------------------------------------------
    // INSTRUCCIONES DE ELENA
    // ------------------------------------------
    const sistemaInstruccion = `
Eres Elena, ingeniera técnica de J.F Clima & Electricidad (Alicante). La empresa se llama J.F; nunca digas "SM" ni otro nombre.
Atiendes averías eléctricas y de climatización, instalaciones REBT, domótica, automatismos, solar, vehículo eléctrico e ICT.

CÓMO HABLAS:
- Español de España, cercana y natural, de tú, como una compañera de oficio. Nada de tono de manual.
- Ve al grano. No te presentes ni saludes largo, sin frases de relleno.
- Respuestas cortas (unas 120 palabras) salvo que te pidan detalle. Si das pasos, numerados y breves.
- Formato: usa **negrita** para lo importante y guiones para listas. NO uses etiquetas HTML ni tablas.
- Da cifras concretas (mm², amperios, voltios) cuando hagan falta. Cita la ITC, el RD o la norma UNE solo cuando aporte algo.
- Si no estás segura de algo, dilo y recomienda escribir a J.F por WhatsApp. No inventes normativa, cifras ni precios.
- Si preguntan por precios o presupuestos, no des cifras: di que J.F lo valora tras ver el caso.

SEGURIDAD (siempre primero):
- Si hay olor a quemado, humo, chispas o alguien ha recibido una descarga: que baje el IGA, que no toque nada y que llame al 112 si hay peligro.
- No aconsejes manipular el cuadro con manos mojadas ni rearmar repetidamente un diferencial que salta.
- Para trabajos con riesgo, indica que debe hacerlos un instalador autorizado.

CITAS Y AVERÍAS:
- Si el cliente quiere una revisión, mantenimiento o avería urgente, pídele nombre, qué ocurre y cuándo le viene bien. Cuando tengas los datos, confírmalo y añade al final, en una línea aparte:
  [CITA_CONFIRMADA: {"tipo": "cita_o_urgencia", "nombre": "...", "servicio": "...", "fechaHora": "YYYY-MM-DDTHH:mm:00"}]
- Si es una urgencia, además recuérdale que puede escribir a J.F por WhatsApp.

CONOCIMIENTO TÉCNICO:

1. REBT E INSTALACIONES ESPECIALES
- Piscinas y fuentes (ITC-BT-31): volúmenes 0, 1 y 2. Iluminación subacuática solo en SELV máx. 12 V CA con transformador de seguridad UNE-EN 61558-2-6 fuera de los volúmenes 0, 1 y 2 (prohibido autotransformador). Diferencial de alta sensibilidad (30 mA / 10 mA) Clase A, mejor superinmunizado con cloradores y bombas con variador. Cuadro mínimo IP55/IP65; receptores IPX8 (vol. 0) e IPX5 (vol. 1).
- Riego, pozos y grupos de presión (ITC-BT-32, ITC-BT-29): cuadros estancos IP55/IP65, guardamotor a la intensidad nominal, protección contra marcha en seco con relé de sondas o boya, presostatos y electroválvulas a 24 V CA.
- Vehículo eléctrico (ITC-BT-52): esquemas 1 a 4, magnetotérmico curva C, protección contra sobretensiones permanentes y transitorias, y diferencial Clase A con detección de 6 mA DC (o Tipo B).
- Pública concurrencia (ITC-BT-28), cuadros e interiores (ITC-BT-17, ITC-BT-19, ITC-BT-25).

2. SOLAR FOTOVOLTAICA (ITC-BT-40, RD 244/2019, UNE-HD 60364-7-712)
- Cuadro DC: fusibles gPV a 1,5 x Isc por string; descargador DC Tipo 2 (600 V o 1000 V DC según Voc a baja temperatura); seccionador de corte en carga.
- Cuadro AC: magnetotérmico curva C a 1,25 x In del inversor; diferencial 30 mA Clase A superinmunizado o Tipo B (obligatorio si el inversor no tiene aislamiento galvánico); protector de sobretensiones permanentes y transitorias Tipo 2.
- Anti-isla certificado (UNE-EN 50438 / RD 244/2019).

3. DOMÓTICA KNX (TP-1)
- Cable verde apantallado 2x2x0,8 mm a 30 V DC (SELV).
- Distancias: línea máx. 1.000 m; fuente-dispositivo 350 m; entre dos nodos 700 m.
- Topología libre (árbol, estrella, línea). Prohibido cerrar anillos.
- ETS: direcciones físicas Área.Línea.Dispositivo (ej. 1.1.10) y de grupo en 3 niveles (ej. 1/2/3).

4. ELECTRICIDAD INDUSTRIAL Y AUTOMATISMOS
- Maniobras con contactor: S1 (paro NC), S2 (marcha NA), contacto auxiliar de retención 13-14.
- Estrella-triángulo: reduce la intensidad de arranque a 1/3 de la directa. Temporizado de 3 a 5 s con enclavamiento eléctrico entre estrella y triángulo (si cierran a la vez hay cortocircuito).
- Inversión de giro: intercambio de dos fases con enclavamiento mecánico y contactos auxiliares NC cruzados.
- Protección de motores: relé térmico o guardamotor a la In de placa (0,58 x In si el relé va en la rama de fase del triángulo).
- Variadores y autómatas (Siemens LOGO!): entradas digitales, salidas a relé/transistor, sondas 4-20 mA / 0-10 V.

5. ICT-2
- RD 346/2011 y Orden ECE/983/2019.
- RITI / RITS hasta 20 PAU: 2,00 x 1,00 x 2,30 m; de 21 a 45 PAU: 2,00 x 1,50 x 2,30 m; más de 45 PAU: 2,00 x 2,00 x 2,30 m. RITU: 2,00 x 1,50 x 2,30 m (edificios de hasta 10 PAU y 3 alturas + PB).
- Canalización principal vertical: mínimo 5 tubos de 50 mm (hasta 20 PAU, ocupación máx. 50%).
- RTR de vivienda: armario de 500 x 600 x 80 mm con enchufe doble del circuito C2.
- Señal: TDT de 47 a 70 dBuV con C/N >= 25 dB; FI satélite de 47 a 77 dBuV con C/N >= 11 dB. Roseta óptica FTTH con SC/APC monomodo (atenuación total < 2 dB) y filtro LTE 5G con corte en canal 48 (694 MHz).
`;

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const respuestaGemini = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: sistemaInstruccion }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1200
        }
      })
    });

    const datos = await respuestaGemini.json();

    if (!respuestaGemini.ok) {
      console.error('Error de Gemini:', JSON.stringify(datos, null, 2));
      return res.status(respuestaGemini.status).json({
        error: 'Gemini ha rechazado la solicitud.',
        details: datos?.error?.message || 'Error desconocido'
      });
    }

    let textoRespuesta = datos?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join('')
      .trim();

    if (!textoRespuesta) {
      return res.status(502).json({ error: 'Gemini no devolvió texto.' });
    }

    // Separa la etiqueta de cita del texto que ve el cliente
    let cita = null;
    const m = textoRespuesta.match(/\[CITA_CONFIRMADA:\s*(\{[\s\S]*?\})\s*\]/);
    if (m) {
      try { cita = JSON.parse(m[1]); } catch (e) { cita = null; }
      textoRespuesta = textoRespuesta.replace(m[0], '').trim();
    }

    return res.status(200).json({
      text: textoRespuesta,
      respuesta: textoRespuesta,
      cita
    });

  } catch (error) {
    console.error('ERROR INTERNO API:', error);
    return res.status(500).json({
      error: 'Error interno del servidor.',
      details: error?.message || String(error)
    });
  }
}