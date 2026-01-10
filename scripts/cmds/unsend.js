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

		if (!messageReply) {
			return message.reply("⚠ | Please reply to the message you want to unsend.");
		}

		try {
			// বটের নিজের মেসেজ হলে সরাসরি ডিলিট করবে
			if (messageReply.senderID === api.getCurrentUserID()) {
				return await api.unsendMessage(messageReply.messageID);
			} 
			
			// অন্য কারো মেসেজ হলে বটের অ্যাডমিন স্ট্যাটাস চেক করবে
			const threadInfo = await api.getThreadInfo(threadID);
			const botID = api.getCurrentUserID();
			const adminIDs = threadInfo.adminIDs.map(admin => admin.id.toString());

			if (!adminIDs.includes(botID.toString())) {
				return message.reply("⚠ | I need Admin privileges to unsend messages from others!");
			}

			// মেসেজ ডিলিট করার চেষ্টা
			await api.unsendMessage(messageReply.messageID);

		} catch (e) {
			console.error("Unsend Error:", e);
			// যদি অ্যাডমিন হওয়ার পরেও এরর আসে, তার মানে API অন্যদের মেসেজ মোছার অনুমতি দিচ্ছে না
			return message.reply("✗ | Failed to unsend. Note: I can only unsend others' messages if the API/Account allows it.");
		}
	}
};
