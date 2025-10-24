const fetch = require("node-fetch");
const yts = require("yt-search");
const axios = require("axios");

const youtubeRegexID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/;

module.exports = {
  command: ["playaudio","play"],
  description: "Descarga audio de YouTube",
  category: "downloader",
  run: async (client, m, args, { prefix }) => {
    try {
      if (!args.join(" ").trim()) 
        return client.sendMessage(m.chat, { text: "🔔 *Por favor, ingresa el nombre o link del audio a descargar.*" }, { quoted: m });
      await m.react('⏱️');
      await client.sendMessage(m.chat, { text: "🎧 Buscando tu audio..." }, { quoted: m });

      const text = args.join(" ");
      let videoIdMatch = text.match(youtubeRegexID);
      let search = await yts(videoIdMatch ? 'https://youtu.be/' + videoIdMatch[1] : text);
      let video = videoIdMatch
        ? search.all.find(v => v.videoId === videoIdMatch[1]) || search.videos.find(v => v.videoId === videoIdMatch[1])
        : search.videos?.[0];

      if (!video) return client.sendMessage(m.chat, { text: '❌ *No se encontraron resultados para tu búsqueda.*' }, { quoted: m });

      const { title, thumbnail, timestamp, views, ago, url, author } = video;
      const vistas = formatViews(views);
      const canal = author?.name || 'Desconocido';

      const infoMessage = `*🎵 Título:* ${title}
*🎬 Canal:* ${canal}
*👀 Vistas:* ${vistas}
*⏳ Duración:* ${timestamp}
*🤩 Calidad:* 200kbps
*📆 Publicado:* ${ago}
*🔗 Link:* ${url}`.trim();

      const thumb = (await client.getFile(thumbnail))?.data;
      const external = {
        contextInfo: {
          externalAdReply: {
            title,
            body: 'Descargando audio',
            mediaType: 1,
            previewType: 0,
            mediaUrl: url,
            sourceUrl: url,
            thumbnail: thumb,
            renderLargerThumbnail: true
          }
        }
      };

      await client.sendMessage(m.chat, { text: infoMessage, mentions: [m.sender], ...external }, { quoted: m });

      // Descarga el audio
      const res = await fetch(`https://api.vreden.my.id/api/v1/download/youtube/audio?url=${url}&quality=200`);
      const json = await res.json();

      if (!json.result?.download?.url) throw '*⚠️ No se obtuvo un enlace válido.*';

      await client.sendMessage(m.chat, {
        audio: { url: json.result.download.url },
        mimetype: 'audio/mpeg',
        fileName: json.result.download.filename || `${json.result.metadata?.title || title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title,
            body: 'audio descargado',
            mediaType: 1,
            thumbnail: thumb,
            mediaUrl: url,
            sourceUrl: url,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });

      await m.react('✅');

    } catch (err) {
      return client.sendMessage(m.chat, { text: `❌ *Ocurrió un error* \n${err}` }, { quoted: m });
    }
  }
};

// Funciones auxiliares
function formatViews(views) {
  if (views === undefined) return "No disponible";
  if (views >= 1e9) return `${(views / 1e9).toFixed(1)}B (${views.toLocaleString()})`;
  if (views >= 1e6) return `${(views / 1e6).toFixed(1)}M (${views.toLocaleString()})`;
  if (views >= 1e3) return `${(views / 1e3).toFixed(1)}K (${views.toLocaleString()})`;
  return views.toString();
        }
