// codigo creado por china
// github.com/ittschinitaaa
module.exports = {
  command: ["open", "abrir"],
  description: "Abre el grupo (todos pueden hablar)",
  category: "groups",
  isGroup: true,
  isAdmin: true,
  botAdmin: true,
  run: async (client, m) => {
    try {
      await client.groupSettingUpdate(m.chat, "not_announcement");
      await m.react('✅');
      //  m.reply("🔓 El grupo ahora está *abierto* .");
    } catch (e) {
      console.error(e);
      m.reply("❌ No se pudo abrir el grupo");
    }
  },
};
