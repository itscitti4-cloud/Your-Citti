module.exports = {
  config: {
    name: "richest",
    aliases: ["top", "rich"],
    version: "1.0.1",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "View top 20 users with highest balance."
    },
    longDescription: {
      en: "Displays a list of the top 20 users ranked by their current balance."
    },
    category: "game",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      // Fetch all users data
      // GoatBot এ সাধারণত usersData.getAll() সব ডাটা রিটার্ন করে
      const allUsers = await usersData.getAll();
      
      if (!allUsers || allUsers.length === 0) {
        return api.sendMessage("No user data found in the database.", event.threadID);
      }

      // Sort users by money (descending)
      const topUsers = allUsers
        .filter(user => user.money !== undefined) // যাদের টাকা আছে শুধু তাদের নিবে
        .sort((a, b) => b.money - a.money)
        .slice(0, 20);

      let msg = "🏆 **TOP 20 RICHEST USERS** 🏆\n";
      msg += "━━━━━━━━━━━━━━━━━━\n";

      topUsers.forEach((user, index) => {
        const name = user.name || "Unknown User";
        const balance = (user.money || 0).toLocaleString();
        const icon = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "👤";
        
        msg += `${index + 1}. ${icon} ${name}\n💰 Balance: $${balance}\n`;
        if (index < topUsers.length - 1) msg += "------------------\n";
      });

      msg += "━━━━━━━━━━━━━━━━━━\n";
      msg += "Keep earning to reach the top!";

      return api.sendMessage(msg, event.threadID, event.messageID);
    } catch (error) {
      console.error(error);
      return api.sendMessage("An error occurred: " + error.message, event.threadID);
    }
  }
};
