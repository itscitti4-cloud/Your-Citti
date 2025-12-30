module.exports = {
  config: {
    name: "richest",
    aliases: ["top", "rich"],
    version: "1.0.0",
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
      en: "{p}richest"
    }
  },

  onStart: async function ({ api, event, Users }) {
    try {
      // Fetch all users from database
      const allUsers = await Users.getAll();
      
      // Sort users by balance in descending order
      const topUsers = allUsers
        .sort((a, b) => (b.money || 0) - (a.money || 0))
        .slice(0, 20);

      if (topUsers.length === 0) {
        return api.sendMessage("No user data found in the database.", event.threadID);
      }

      let msg = "🏆 TOP 20 RICHEST USERS 🏆\n";
      msg += "━━━━━━━━━━━━━━━━━━\n";

      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const name = user.name || "Unknown User";
        const balance = (user.money || 0).toLocaleString();
        
        // Formatting each line
        msg += `${i + 1}. ${name}\n💰 Balance: $${balance}\n`;
        if (i < topUsers.length - 1) msg += "------------------\n";
      }

      msg += "━━━━━━━━━━━━━━━━━━\n";
      msg += "Keep earning to reach the top!";

      return api.sendMessage(msg, event.threadID);
    } catch (error) {
      console.error(error);
      return api.sendMessage("An error occurred while fetching the rich list.", event.threadID);
    }
  }
};
