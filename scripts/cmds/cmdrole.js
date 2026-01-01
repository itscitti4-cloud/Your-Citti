module.exports = {
    config: {
        name: "cmdrole",
        version: "1.0.1",
        role: 0, 
        author: "AkHi",
        description: "View commands list filtered by role",
        category: "system",
        guide: "{pn} <role_number>"
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID } = event;
        const roleInput = parseInt(args[0]);

        // Input Validation
        if (args.length === 0 || isNaN(roleInput) || roleInput < 0 || roleInput > 4) {
            return api.sendMessage("⚠️ Please provide a valid role number (0, 1, 2, 3, or 4).\nExample: !cmdrole 1", threadID, messageID);
        }

        const categories = {};
        let count = 0;

        // Getting commands from global scope if not provided in params
        const allCommands = global.GoatBot?.commands || global.client?.commands || [];

        // Correct way to iterate through commands
        allCommands.forEach((cmd, name) => {
            // Check if cmd and config exist to avoid further errors
            if (cmd && cmd.config) {
                const cmdRole = cmd.config.role ?? 0;
                
                if (cmdRole === roleInput) {
                    const category = cmd.config.category || "Uncategorized";
                    if (!categories[category]) {
                        categories[category] = [];
                    }
                    categories[category].push(cmd.config.name || name);
                    count++;
                }
            }
        });

        if (count === 0) {
            return api.sendMessage(`❌ No commands found for Role ${roleInput}.`, threadID, messageID);
        }

        // Stylish List Formatting
        let msg = `┏━━━━━━━┓\n   COMMANDS ROLE: ${roleInput}\n┗━━━━━━━┛\n`;
        msg += `✨ Total: ${count} commands found\n`;
        msg += `━━━━━━━━━━━━━━━━━━\n`;

        for (const cat in categories) {
            const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
            msg += `\n📁 [ ${catName} ]\n`;
            msg += `» ${categories[cat].join(", ")}\n`;
        }

        msg += `\n━━━━━━━━━━━━━━━━━━\n💡 Use !help <cmd_name> for details.`;

        return api.sendMessage(msg, threadID, messageID);
    }
};
