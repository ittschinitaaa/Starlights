// codigo creado por China
// github.com/ittschinitaaa

import fetch from "node-fetch";
import FormData from "form-data";

export default {
  command: ["hd", "remini", "enhance"],
  description: "Mejora la calidad de una imagen usando IA.",
  category: "tools",
  run: async (client, m, args, { prefix }) => {
    const q = m.quoted || m;
    const mime = (q.msg || q).mimetype || q.mediaType || "";

    if (!mime) return m.reply("❀ Por favor, responde a una imagen con el comando.");
    if (!/image\/(jpe?g|png)/.test(mime))
      return m.reply(`ꕥ Formato no compatible (${mime}). Usa una imagen jpg o png.`);

    const buffer = await q.download();
    if (!buffer || buffer.length < 1000) return m.reply("⚠︎ Imagen no válida.");

    await m.react("🕒");

    try {
      const url = await subirAuguu(buffer);
      const motores = [mejorarSiputzx, mejorarVreden];
      const tareas = motores.map(fn =>
        fn(url)
          .then(res => ({ engine: fn.engineName, result: res }))
          .catch(err => Promise.reject({ engine: fn.engineName, error: err }))
      );

      const { engine, result } = await Promise.any(tareas);

      await client.sendFile(
        m.chat,
        Buffer.isBuffer(result) ? result : result,
        "imagen_hd.jpg",
        `❀ Imagen mejorada exitosamente\n🪷 Servidor usado: \`${engine}\``,
        m
      );

      await m.react("✅");
    } catch (err) {
      await m.react("❌");
      const errores = Array.isArray(err.errors)
        ? err.errors
            .map(
              e =>
                `• ${e?.engine || "Desconocido"}: ${
                  e?.error?.message || e?.message || String(e)
                }`
            )
            .join("\n")
        : `• ${err?.engine || "Desconocido"}: ${
            err?.error?.message || err?.message || String(err)
          }`;

      m.reply(`⚠︎ No se pudo mejorar la imagen\n> Usa *${prefix}report* para informarlo.\n\n${errores}`);
    }
  }
};

async function subirAuguu(buffer) {
  const body = new FormData();
  body.append("files[]", buffer, "image.jpg");
  const res = await fetch("https://uguu.se/upload.php", {
    method: "POST",
    body,
    headers: body.getHeaders()
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    const url = json.files?.[0]?.url;
    if (!url || !url.startsWith("https://"))
      throw new Error(`Respuesta inválida de Uguu.\n> ${text}`);
    return url.trim();
  } catch (e) {
    throw new Error(`Falló al parsear respuesta de Uguu.\n> ${text}`);
  }
}

async function mejorarSiputzx(url) {
  const res = await fetch(
    `${global.APIs.siputzx.url}/api/iloveimg/upscale?image=${encodeURIComponent(url)}&scale=4`
  );
  if (!res.ok) throw new Error(`Siputzx falló con código ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
mejorarSiputzx.engineName = "Siputzx";

async function mejorarVreden(url) {
  const res = await fetch(
    `${global.APIs.vreden.url}/api/artificial/hdr?url=${encodeURIComponent(url)}&pixel=4`
  );
  if (!res.ok) throw new Error(`Vreden falló con código ${res.status}`);
  const json = await res.json();
  const finalUrl = json?.resultado?.datos?.descargaUrls?.[0];
  if (!finalUrl || !finalUrl.startsWith("https://"))
    throw new Error("Respuesta inválida de Vreden");
  return finalUrl;
}
mejorarVreden.engineName = "Vreden";
