module.exports = {
  config: {
    name: "authority",
    aliases: ["auth", "admins", "authlist"],
    version: "1.3",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "View bot authority list",
    longDescription: "Shows Developers, Premium Users, Admins, and Operators with names and IDs.",
    category: "information",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData, message }) {
    const fs = require("fs-extra");
    const path = require("path");
    
    try {
      const configPath = path.join(process.cwd(), "config.json");
      const config = fs.readJsonSync(configPath);

      // সিরিয়াল অনুযায়ী রোলগুলো (Role 4 to 1)
      const roles = [
        { name: "DEVELOPERS (Role 4)", key: "devUsers", icon: "👑" },
        { name: "PREMIUM USERS (Role 3)", key: "premiumUsers", icon: "💎" },
        { name: "BOT ADMINS (Role 2)", key: "adminBot", icon: "🛡️" },
        { name: "OPERATORS (Role 1)", key: "operators", icon: "⚙️" }
      ];

      let msg = "✨ ━━━━ [ 𝗔𝗨𝗧𝗛𝗢𝗥𝗜𝗧𝗬 ] ━━━━ ✨\n\n";

      for (const role of roles) {
        const ids = config[role.key] || [];
        msg += `${role.icon} ─── ${role.name} ───\n`;

        if (ids.length > 0) {
          for (let i = 0; i < ids.length; i++) {
            const uid = ids[i].toString();
            const user = await usersData.get(uid);
            const userName = user ? user.name : "Facebook User";
            
            // শুধুমাত্র নাম এবং আইডি ফরমেট
            msg += `  ${i + 1}. ${userName}\n     ID: ${uid}\n`;
          }
        } else {
          msg += "  ( No users assigned )\n";
        }
        msg += "\n";
      }

      msg += "━━━━━━━━━━━━━━━━━━━━━━━━━\n";
      msg += "⚡ Status: System Online\n";
      msg += "🕒 Date: " + new Date().toLocaleDateString();
      
      return message.reply(msg);
    } catch (error) {
      console.error(error);
      return message.reply("❌ | Error: Could not load authority data.");
    }
  }
};
