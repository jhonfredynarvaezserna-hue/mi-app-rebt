// ==========================================
// api/chat.js  ·  Función de Vercel para Elena y las propuestas KNX
// Recibe { prompt } (o { message }) y devuelve { text }.
// La clave se lee de la variable de entorno GEMINI_API_KEY (panel de Vercel).
// ==========================================

const MODELO = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_CARACTERES = 8000;      // tamaño máximo de cada consulta
const MAX_POR_MINUTO = 15;        // consultas por minuto y por IP
const MAX_SALIDA = 8192;          // tokens máximos de respuesta

// Límite básico por IP (en memoria: frena abusos simples, no es un límite perfecto)
const registro = new Map();
function demasiadasPeticiones(ip) {
  const ahora = Date.now();
  const lista = (registro.get(ip) || []).filter(t => ahora - t < 60000);
  lista.push(ahora);
  registro.set(ip, lista);
  if (registro.size > 5000) registro.clear();
  return lista.length > MAX_POR_MINUTO;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Falta la variable GEMINI_API_KEY en Vercel");
    return res.status(500).json({ error: "El servidor no está configurado todavía." });
  }

  // Cuerpo de la petición (acepta "prompt" o "message")
  let cuerpo = req.body;
  if (typeof cuerpo === "string") {
    try { cuerpo = JSON.parse(cuerpo); } catch { cuerpo = {}; }
  }
  const prompt = cuerpo && (cuerpo.prompt || cuerpo.message);

  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "Falta la consulta." });
  }
  if (prompt.length > MAX_CARACTERES) {
    return res.status(413).json({ error: "La consulta es demasiado larga." });
  }

  const ip = String(req.headers["x-forwarded-for"] || "desconocida").split(",")[0].trim();
  if (demasiadasPeticiones(ip)) {
    return res.status(429).json({ error: "Demasiadas consultas seguidas. Espera un minuto." });
  }

  const generationConfig = { maxOutputTokens: MAX_SALIDA, temperature: 0.4 };
  // En Gemini 2.5 Flash se desactiva el "pensamiento" para que no consuma la respuesta
  if (MODELO.startsWith("gemini-2.5-flash")) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig
        })
      }
    );

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      // El detalle real solo se guarda en los Logs de Vercel, no se enseña al usuario
      console.error("Error de Gemini:", r.status, JSON.stringify(data).slice(0, 500));
      const msg = r.status === 429
        ? "El servicio de IA está saturado. Inténtalo en un minuto."
        : "No se pudo obtener respuesta de la IA.";
      return res.status(502).json({ error: msg });
    }

    const text = (data.candidates?.[0]?.content?.parts || [])
      .map(p => p.text || "")
      .join("")
      .trim();

    if (!text) {
      console.error("Respuesta vacía de Gemini:", JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: "La IA no devolvió respuesta. Inténtalo de nuevo." });
    }

    return res.status(200).json({ text });
  } catch (err) {
    console.error("Fallo al llamar a Gemini:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}