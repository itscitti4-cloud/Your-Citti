module.exports = {
	config: {
		name: "unsend",
		aliases: ["u", "r", "un", "del"],
		version: "1.6",
		author: "AkHi",
		countDown: 5,
		role: 1, 
		description: {
			en: "Unsend any message (Bot must be Admin)"
		},
		category: "box chat",
		guide: {
			en: "reply to the message you want to unsend and type {pn}"
		}
	},

	onStart: async function ({ message, event, api }) {
		const { threadID, messageReply, senderID } = event;

		// রিপ্লাই না করলে এরর দিবে
		if (!messageReply) {
			return message.reply("⚠ | Please reply to the message you want to unsend.");
		}

		try {
			// যদি রিপ্লাই করা মেসেজটি বটের নিজের হয়, তবে সরাসরি আনসেন্ড করবে
			if (messageReply.senderID === api.getCurrentUserID()) {
				await api.unsendMessage(messageReply.messageID);
			} 
			else {
				// যদি অন্য কারো মেসেজ হয়, তবে সরাসরি ফেসবুক থেকে চেক করবে বট এডমিন কি না
				const threadInfo = await api.getThreadInfo(threadID);
				const botID = api.getCurrentUserID();
				const adminIDs = threadInfo.adminIDs.map(admin => admin.id);

				if (!adminIDs.includes(botID)) {
					return message.reply("⚠ | I need Admin privileges to unsend messages from others!");
				}

				await api.unsendMessage(messageReply.messageID);
			}
		} catch (e) {
			console.error("Unsend Error:", e);
			return message.reply("✗ | An error occurred while trying to unsend the message.");
		}
	}
};
