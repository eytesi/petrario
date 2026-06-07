// api/identify.js — Vercel serverless function

export default async function handler(req, res) {
  // CORS headers por si acaso
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY no configurada en Vercel" });
  }

  const { prompt, imageBase64, imageMimeType } = req.body || {};

  if (!prompt && !imageBase64) {
    return res.status(400).json({ error: "Se requiere prompt o imagen" });
  }

  const parts = [];

  if (imageBase64 && imageMimeType) {
    parts.push({ inline_data: { mime_type: imageMimeType, data: imageBase64 } });
  }

  parts.push({
    text: `Sos un geólogo experto. ${
      imageBase64
        ? "Analizá esta imagen de una roca o mineral."
        : `Analizá: "${prompt}".`
    } Respondé SOLO con JSON válido sin markdown:
{"name":"nombre común","scientificName":"nombre científico","formula":"fórmula química","mohs":"número","group":"grupo mineralógico","formation":"proceso de formación","color":"color típico","luster":"brillo","curiosity":"dato curioso breve","confidence":"alta/media/baja"}`
  });

  // Intentar modelos en orden hasta que uno funcione
  const models = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-pro",
  ];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
          }),
        }
      );

      clearTimeout(timeout);

      const rawText = await geminiRes.text();
      console.log(`[${model}] status:`, geminiRes.status, "body:", rawText.slice(0, 300));

      if (!geminiRes.ok) {
        console.error(`[${model}] falló, probando siguiente...`);
        continue; // probar siguiente modelo
      }

      const data = JSON.parse(rawText);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();

      let parsed;
      try { parsed = JSON.parse(clean); }
      catch { return res.status(502).json({ error: "JSON inválido de Gemini", raw: clean.slice(0, 200) }); }

      return res.status(200).json({ ...parsed, identified: true, model });

    } catch (err) {
      console.error(`[${model}] error:`, err.message);
      if (err.name === "AbortError") continue;
      continue;
    }
  }

  return res.status(502).json({ error: "Ningún modelo de Gemini respondió correctamente. Verificá la API key." });
}
