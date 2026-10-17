export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  let cuerpo = req.body;
  if (typeof cuerpo === "string") {
    try { cuerpo = JSON.parse(cuerpo); } catch { cuerpo = {}; }
  }
  const clave = String((cuerpo && cuerpo.clave) || "").trim().toUpperCase();
  const validas = (process.env.CLAVES_LICENCIA || "")
    .split(",").map(s => s.trim().toUpperCase()).filter(Boolean);

  res.status(200).json({ ok: clave !== "" && validas.includes(clave) });
}