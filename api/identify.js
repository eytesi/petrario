// api/identify.js — Vercel serverless function
// La API key vive en las variables de entorno de Vercel, nunca en el código.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, imageBase64, imageMimeType } = req.body;

  if (!prompt && !imageBase64) {
    return res.status(400).json({ error: "Se requiere prompt o imagen" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key no configurada" });
  }

  // Construir el contenido para Gemini
  const parts = [];

  if (imageBase64 && imageMimeType) {
    parts.push({
      inline_data: {
        mime_type: imageMimeType,
        data: imageBase64,
      },
    });
  }

  const textPrompt = `Sos un geólogo y mineralogista experto. ${
    imageBase64
      ? "Analizá esta imagen de una roca o mineral."
      : `Analizá esta descripción de una roca o mineral: "${prompt}".`
  }
Respondé ÚNICAMENTE con un objeto JSON válido, sin markdown, sin bloques de código, sin texto antes ni después. El JSON debe tener exactamente estas claves:
{
  "name": "nombre común en español",
  "scientificName": "nombre científico o variedad",
  "formula": "fórmula química o composición principal",
  "mohs": "número de dureza Mohs (solo el número, puede ser decimal como 6.5)",
  "group": "grupo mineralógico o tipo de roca",
  "formation": "proceso geológico de formación",
  "color": "color típico",
  "luster": "tipo de brillo",
  "curiosity": "un dato curioso interesante en una oración",
  "confidence": "alta, media o baja"
}`;

  parts.push({ text: textPrompt });

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("Gemini error:", err);
      return res.status(502).json({ error: "Error en Gemini API", detail: err });
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Limpiar posible markdown que Gemini a veces agrega igual
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return res.status(502).json({ error: "Respuesta inválida de Gemini", raw: clean });
    }

    return res.status(200).json({ ...parsed, identified: true });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Error interno", detail: err.message });
  }
}
