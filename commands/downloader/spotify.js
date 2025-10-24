const axios = require("axios")

module.exports = {
  command: ["spotify", "splay"],
  description: "Descarga canciones desde Spotify",
  category: "downloader",
  group: true,
  run: async (client, m, args, { prefix }) => {
    const text = args.join(" ")
    if (!text) return client.sendMessage(m.chat, { text: "❀ Por favor, proporciona el nombre de una canción o artista." }, { quoted: m })

    try {
      await client.sendMessage(m.chat, { react: { text: "🕒", key: m.key } })

      let trackUrl = text
      let info = null
      let data = null

      // Detecta si es link de Spotify
      const isUrl = /https?:\/\/(open\.)?spotify\.com\/track\/[a-zA-Z0-9]+/.test(text)

      if (!isUrl) {
        // Si no es URL, usamos una API pública de búsqueda Spotify
        const search = await axios.get(`https://api.delirius.tech/search/spotify?q=${encodeURIComponent(text)}&limit=1`)
        const result = Array.isArray(search.data?.data) ? search.data.data[0] : null
        if (!result || !result.url) throw new Error("ꕥ No se encontraron resultados.")
        trackUrl = result.url
        info = {
          title: result.title || "Desconocido",
          artist: result.artist || "Desconocido",
          album: result.album || null,
          duration: result.duration || null,
          popularity: result.popularity || null,
          release: result.publish || null,
          image: result.image || null,
          url: result.url
        }
      }

      // Descarga de la canción
      const res = await axios.get(`https://api.delirius.tech/download/spotifydl?url=${encodeURIComponent(trackUrl)}`)
      const d = res.data?.data
      if (!res.data?.status || !d?.url) throw new Error("ꕥ No se pudo obtener el audio.")

      data = {
        title: d.title || info?.title || "Desconocido",
        artist: d.author || info?.artist || "Desconocido",
        album: info?.album || "Desconocido",
        duration: info?.duration || `${Math.floor(d.duration / 60000)}:${String(Math.floor((d.duration % 60000) / 1000)).padStart(2, '0')}`,
        popularity: info?.popularity || "Desconocido",
        release: info?.release || "Desconocido",
        type: d.type,
        source: d.source,
        image: d.image || info?.image,
        download: d.url,
        url: info?.url || trackUrl
      }

      const caption = `「✦」Descargando *<${data.title}>*\n\n> 🌷 Autor » *${data.artist}*\n${data.album && data.album !== "Desconocido" ? `> 🗂 Álbum » *${data.album}*\n` : ''}${data.duration ? `> ⏰ Duración » *${data.duration}*\n` : ''}${data.popularity && data.popularity !== "Desconocido" ? `> 🌟 Popularidad » *${data.popularity}*\n` : ''}${data.release && data.release !== "Desconocido" ? `> 💻 Publicado » *${data.release}*\n` : ''}${data.url ? `> 🔗 Enlace » ${data.url}` : ''}`

      await client.sendMessage(
        m.chat,
        {
          text: caption,
          contextInfo: {
            externalAdReply: {
              showAdAttribution: true,
              containsAutoReply: true,
              renderLargerThumbnail: true,
              title: '✧ s⍴᥆𝗍і𝖿ᥡ • mᥙsіᥴ ✧',
              body: "Mía",
              mediaType: 1,
              thumbnailUrl: data.image,
              mediaUrl: data.url,
              sourceUrl: data.url
            }
          }
        },
        { quoted: m }
      )

      await client.sendMessage(m.chat, { audio: { url: data.download }, fileName: `${data.title}.mp3`, mimetype: 'audio/mpeg' }, { quoted: m })
      await client.sendMessage(m.chat, { react: { text: "✅", key: m.key } })

    } catch (err) {
      await client.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
      client.sendMessage(m.chat, { text: `⚠︎ Se ha producido un problema.\n> Usa *${prefix}report* para informarlo.\n\n${err.message}` }, { quoted: m })
    }
  }
          }
