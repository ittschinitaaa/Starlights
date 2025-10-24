const axios = require('axios')
const cheerio = require('cheerio')

module.exports = {
  command: ["twitter", "x", "xdl"],
  description: "Descarga imágenes o videos de Twitter/X",
  category: "downloader",
  run: async (client, m, args, { prefix }) => {
    const text = args.join(" ")
    if (!text) return client.sendMessage(m.chat, { text: `❀ Te faltó el link de una imagen/video de Twitter.` }, { quoted: m })

    try {
      await client.sendMessage(m.chat, { react: { text: "🕒", key: m.key } })

      const result = await twitterScraper(text)
      if (!result.status) return client.sendMessage(m.chat, { text: `ꕥ No se pudo obtener el contenido de Twitter/X` }, { quoted: m })

      if (result.data.type === 'video') {
        const caption = `\`⭐ Twitter - Download ⭐\`\n\n> ✨ Título » ${result.data.title}\n> ⏰ Duración » ${result.data.duration}\n> 🔗 URL » ${text}`
        await client.sendMessage(m.chat, { video: { url: result.data.dl[0].url }, caption }, { quoted: m })
        await client.sendMessage(m.chat, { react: { text: "✅", key: m.key } })
      } else {
        await client.sendMessage(
          m.chat,
          { image: { url: result.data.imageUrl }, caption: `\`🌟 Twitter - Download 🌟\`\n\n> 🔗 URL » ${text}` },
          { quoted: m }
        )
        await client.sendMessage(m.chat, { react: { text: "✅", key: m.key } })
      }
    } catch (e) {
      await client.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
      client.sendMessage(
        m.chat,
        { text: `⚠︎ Se ha producido un problema.\n> Usa *${prefix}report* para informarlo.\n\n${e.message}` },
        { quoted: m }
      )
    }
  }
}

async function twitterScraper(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const twitterUrlMatch = url.match(/(https:\/\/x.com\/[^?]+)/)
      const tMatch = url.match(/t=([^&]+)/)
      const twitterUrl = twitterUrlMatch ? twitterUrlMatch[1] : ''
      const t = tMatch ? tMatch[1] : ''
      const urlnya = encodeURIComponent(`${twitterUrl}?t=${t}&s=19`)

      const response = await axios.post("https://savetwitter.net/api/ajaxSearch", `q=${urlnya}&lang=en`)
      const $ = cheerio.load(response.data.data)
      const isVideo = $('.tw-video').length > 0
      const twitterId = $('#TwitterId').val()

      if (isVideo) {
        const videoThumbnail = $('.tw-video .thumbnail .image-tw img').attr('src')
        const data = []
        $('.dl-action a').each((i, elem) => {
          const quality = $(elem).text().trim()
          const url = $(elem).attr('href')
          if ($(elem).hasClass('action-convert')) {
            const audioUrl = $(elem).attr('data-audioUrl')
            data.push({ quality: quality, url: audioUrl || 'URL not found' })
          } else {
            data.push({ quality: quality, url: url })
          }
        })
        const title = $('.tw-middle h3').text().trim()
        const videoDuration = $('.tw-middle p').text().trim()
        resolve({
          status: true,
          data: { type: "video", title, duration: videoDuration, twitterId, videoThumbnail, dl: data }
        })
      } else {
        const imageUrl = $('.photo-list .download-items__thumb img').attr('src')
        const downloadUrl = $('.photo-list .download-items__btn a').attr('href')
        resolve({
          status: true,
          data: { type: "image", twitterId, imageUrl, dl: downloadUrl }
        })
      }
    } catch (error) {
      reject(error)
    }
  })
}
