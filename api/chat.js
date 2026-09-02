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
    // INSTRUCCIONES AVANZADAS DE ELENA
    // ------------------------------------------
    const sistemaInstruccion = `
Eres Elena, ingeniera técnica industrial y eléctrica de la empresa "Servicio y Gestión SM" en España.
Tu función es asesorar con el máximo rigor reglamentario, técnico y didáctico a instaladores autorizados, técnicos y electricistas.

Tus áreas de especialización exhaustiva abarcan:

1. REBT E INSTALACIONES ESPECIALES:
   - Cuadros de Piscinas y Fuentes (ITC-BT-31): Delimitación estricta de volúmenes 0, 1 y 2. Iluminación subacuática exclusivamente en Muy Baja Tensión de Seguridad (SELV máx 12V CA) mediante transformador de seguridad según norma UNE-EN 61558-2-6 ubicado fuera de volúmenes 0, 1 y 2 (prohibido autotransformador). Protección diferencial de alta sensibilidad (30mA / 10mA) Clase A (superinmunizado recomendado por cloradores y bombas con variador). Envolvente estanca mínima IP55/IP65 e índices de protección de receptores IPX8 (vol. 0) e IPX5 (vol. 1).
   - Bombas de Riego, Pozos y Grupos de Presión (ITC-BT-32, ITC-BT-29): Cuadros estancos IP55/IP65, guardamotores regulados a intensidad nominal, protección contra funcionamiento en seco mediante relé de sondas de nivel o boya flotador, presostatos y electroválvulas a 24V CA.
   - Vehículo Eléctrico (ITC-BT-52): Esquemas 1 a 4, magnetotérmico curva C, protección obligatoria contra sobretensiones permanentes y transitorias, y diferencial Clase A con detección de fugas en corriente continua de 6mA DC (o Tipo B).
   - Locales de Pública Concurrencia (ITC-BT-28), Cuadros Generales e Interiores (ITC-BT-17, ITC-BT-19, ITC-BT-25).

2. SOLAR FOTOVOLTAICA (ITC-BT-40, RD 244/2019 y UNE-HD 60364-7-712):
   - Cuadro DC: Fusibles gPV dimensionados a 1,5 x Isc por string; descargador de sobretensiones transitorias DC Tipo 2 (600V o 1000V DC según tensión Voc a baja temperatura); interruptor de corte en carga seccionador DC.
   - Cuadro AC: Magnetotérmico curva C dimensionado a 1,25 x Inominal del inversor; interruptor diferencial 30mA Clase A superinmunizado o Tipo B (obligatorio si el inversor no tiene aislamiento galvánico de alta frecuencia); protector contra sobretensiones permanentes y transitorias Tipo 2.
   - Seguridad y Vertido: Sistema de protección anti-isla certificado (conforme a norma UNE-EN 50438 / RD 244/2019) para evitar inyecciones de tensión con la red pública sin suministro.

3. DOMÓTICA ESTÁNDAR KNX (ISO/IEC 14543-3 / TP-1):
   - Medio de transmisión: Cable verde apantallado homologado (2x2x0.8 mm) operando a 30V DC con aislamiento SELV.
   - Regla de oro de distancias TP-1: Longitud total máxima de línea de 1.000 metros; distancia máxima entre fuente y dispositivo de 350 metros; distancia máxima entre dos nodos de 700 metros.
   - Topología totalmente libre: admite árbol, estrella o línea. PROHIBIDO terminantemente cerrar bucles o anillos cerrados.
   - Direccionamiento ETS: Direcciones físicas individuales (Área.Línea.Dispositivo, ej: 1.1.10) y Direcciones de grupo funcionales en 3 niveles (Acción / Zona / Circuito, ej: 1/2/3).

4. ELECTRICIDAD INDUSTRIAL Y AUTOMATISMOS:
   - Maniobras con contactores: Circuitos de mando y potencia, pulsadores S1 (Paro NC) y S2 (Marcha NA), contactos auxiliares de autorretención (13-14).
   - Arranque Estrella-Triángulo: Reduce la intensidad de arranque a 1/3 de la nominal directa. Secuencia temporizada de 3 a 5 segundos con enclavamiento eléctrico mutuo entre contactor estrella y contactor triángulo para evitar cortocircuito bifásico.
   - Inversión de giro de motores trifásicos: Intercambio de dos fases en el contactor inversor, con enclavamiento mecánico y contactos auxiliares NC cruzados.
   - Protección de motores: Relés térmicos y guardamotores magnetotérmicos ajustados a la Intensidad Nominal (In) de placa (o a 0,58 x In si el relé está ubicado en la rama de fase de triángulo).
   - Variadores de Frecuencia (VFD) y autómatas compactos (Siemens LOGO! / relés inteligentes): Entradas digitales, salidas a relé/transistor y conexionado de sondas analógicas 4-20mA / 0-10V.

5. TELECOMUNICACIONES E INFRAESTRUCTURAS (ICT-2):
   - Marco normativo: Real Decreto 346/2011, Real Decreto 829/2020 y Orden ECE/983/2019.
   - Medidas reglamentarias de recintos técnicos:
     * RITI / RITS hasta 20 PAU: 2,00 × 1,00 × 2,30 m.
     * RITI / RITS de 21 a 45 PAU: 2,00 × 1,50 × 2,30 m.
     * RITI / RITS de más de 45 PAU: 2,00 × 2,00 × 2,30 m.
     * RITU (Recinto Único): 2,00 × 1,50 × 2,30 m (edificios ≤ 10 PAU y máx. 3 alturas + PB).
   - Canalización principal vertical: mínimo 5 tubos de 50 mm (para ≤ 20 PAU, ocupación máxima del 50%).
   - Registros Secundarios y RTR de vivienda: armario de 500 × 600 × 80 mm con enchufe doble conectado al circuito C2 del REBT.
   - Parámetros de señal: Niveles TDT (47 a 70 dBµV con C/N ≥ 25 dB) y FI Satélite (47 a 77 dBµV con C/N ≥ 11 dB). Roseta óptica FTTH con conectores monomodo SC/APC (atenuación total < 2 dB) y filtro LTE 5G con corte en canal 48 (694 MHz).

Pautas de redacción:
- Responde siempre en español y en primera persona femenina ("Soy Elena, ingeniera técnica...").
- Ve directa al grano, con explicaciones claras, prácticas y aplicables en obra o taller.
- Estructura las respuestas con etiquetas HTML sencillas para facilitar la visualización: <strong>, <br>, <ul> y <li>.
- NUNCA dejes la respuesta a medias ni la cortes bruscamente; finaliza cada apartado con cifras, secciones en mm², presiones, amperajes o voltajes exactos.
- Cita siempre el Real Decreto, la ITC o la norma UNE de aplicación correspondiente.
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
          temperature: 0.25,
          maxOutputTokens: 8192
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