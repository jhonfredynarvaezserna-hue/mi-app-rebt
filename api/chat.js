// ==========================================
// api/chat.js  ·  Función para Elena y las propuestas KNX
// Recibe { prompt } (o { message }) y devuelve { text }.
// La clave se lee de la variable de entorno GEMINI_API_KEY.
// Si Gemini está saturado (503) reintenta y usa un modelo de respaldo.
// ==========================================

const MODELO = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MODELO_RESPALDO = process.env.GEMINI_MODEL_RESPALDO || "gemini-2.5-flash-lite";
const MAX_CARACTERES = 8000;      // tamaño máximo de cada consulta
const MAX_POR_MINUTO = 15;        // consultas por minuto y por IP
const MAX_SALIDA = 8192;          // tokens máximos de respuesta
const TIEMPO_MAX_MS = 8000;       // espera máxima por intento

// Límite básico por IP (en memoria)
const registro = new Map();
function demasiadasPeticiones(ip) {
  const ahora = Date.now();
  const lista = (registro.get(ip) || []).filter(t => ahora - t < 60000);
  lista.push(ahora);
  registro.set(ip, lista);
  if (registro.size > 5000) registro.clear();
  return lista.length > MAX_POR_MINUTO;
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function llamarGemini(modelo, apiKey, prompt) {
  const generationConfig = { maxOutputTokens: MAX_SALIDA, temperature: 0.4 };
  if (modelo.startsWith("gemini-2.5-flash")) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_MAX_MS);
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig
        }),
        signal: control.signal
      }
    );
    const data = await r.json().catch(() => ({}));
    return { r, data };
  } finally {
    clearTimeout(reloj);
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Falta la variable GEMINI_API_KEY en el entorno");
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

  // Intentos: modelo principal, reintento tras una pausa corta, y modelo de respaldo
  const intentos = [
    { modelo: MODELO, pausa: 0 },
    { modelo: MODELO, pausa: 800 },
    { modelo: MODELO_RESPALDO, pausa: 0 }
  ];

  let ultimoEstado = 0;
  for (const intento of intentos) {
    if (intento.pausa) await esperar(intento.pausa);
    try {
      const { r, data } = await llamarGemini(intento.modelo, apiKey, prompt);

      if (r.ok) {
        const text = (data.candidates?.[0]?.content?.parts || [])
          .map(p => p.text || "")
          .join("")
          .trim();
        if (text) {
          return res.status(200).json({ text });
        }
        console.error("Respuesta vacía de Gemini (" + intento.modelo + "):", JSON.stringify(data).slice(0, 500));
        ultimoEstado = 502;
        continue;
      }

      console.error("Error de Gemini (" + intento.modelo + "):", r.status, JSON.stringify(data).slice(0, 500));
      ultimoEstado = r.status;
      // Con 400, 401 o 403 reintentar no sirve: el problema es la petición o la clave
      if ([400, 401, 403].includes(r.status)) break;
      // Con 404, 429 o 5xx se prueba el siguiente intento
    } catch (err) {
      console.error("Fallo al llamar a Gemini (" + intento.modelo + "):", err && err.name === "AbortError" ? "tiempo agotado" : err);
      ultimoEstado = 0;
    }
  }

  if ([400, 401, 403].includes(ultimoEstado)) {
    return res.status(502).json({ error: "La IA no está configurada correctamente. Avisa a J.F por WhatsApp." });
  }
  return res.status(503).json({ error: "La IA está muy ocupada ahora mismo. Inténtalo de nuevo en unos segundos." });
}