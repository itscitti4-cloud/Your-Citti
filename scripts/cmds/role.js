module.exports = {
    config: {
        name: "role",
        version: "1.0.0",
        role: 0,
        author: "Gemini",
        description: "See who can use which role levels",
        category: "system",
        guide: "{pn}"
    },

    onStart: async function ({ api, event }) {
        const { threadID, messageID } = event;

        // Goatbot এর কনফিগারেশন থেকে ডাটা খোঁজা
        const adminIDs = global.GoatBot.config.adminBot || [];
        const operatorIDs = global.GoatBot.config.operators || [];

        let msg = "╔══════════════════╗\n";
        msg += "       👑 ROLE PERMISSIONS\n";
        msg += "╚══════════════════╝\n\n";

        // Role 0: Everyone
        msg += "👤 [ ROLE 0 ] — Everyone\n";
        msg += "» Accessible by all group members.\n\n";

        // Role 1: Moderators (যদি আপনার বটে আলাদাভাবে মডারেটর সেট করা থাকে)
        msg += "🛡️ [ ROLE 1 ] — Group admin\n";
        msg += "» Only for admin of current group.\n\n";

        // Role 2: Bot Admins
        msg += "⚙️ [ ROLE 2 ] — Bot Admins\n";
        msg += `» Total Admins: ${adminIDs.length}\n`;
        msg += "» Users listed in bot's admin config.\n\n";

        // Role 3: Group Admins
        msg += "👥 [ ROLE 3 ] — Premium\n";
        msg += "» Only premium user's use this.\n\n";

        // Role 4: Bot Owners/Operators
        msg += "💎 [ ROLE 4 ] — Bot Developers\n";
        msg += `» Total Developers: ${developerIDs.length}\n`;
        msg += "» Main developers and owners of the bot.\n";

        msg += "━━━━━━━━━━━━━━━━━━\n";
        msg += "💡 Use !cmdrole <number> to see commands for a specific role.";

        return api.sendMessage(msg, threadID, messageID);
    }
};
