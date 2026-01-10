module.exports = {
	config: {
		name: "kick",
		version: "1.5",
		author: "Nawab",
		countDown: 5,
		role: 1,
		description: {
			vi: "Kick thành viên khỏi box chat",
			en: "Kick member out of chat box"
		},
		category: "box chat",
		guide: "{pn} @tags: Use to kick members who are tagged\n   {pn} reply: Reply to a message to kick that user"
	},

	onStart: async function ({ message, event, args, api }) {
		const { threadID, messageReply, mentions, senderID } = event;

		// সরাসরি ফেসবুক থেকে গ্রুপের লেটেস্ট তথ্য সংগ্রহ
		const threadInfo = await api.getThreadInfo(threadID);
		const botID = api.getCurrentUserID();

		// বট অ্যাডমিন কি না তা রিয়েল-টাইম চেক করা
		const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id == botID);

		if (!isBotAdmin) {
			return message.reply("⚠ | I am an admin in this group, but my database is old. Please un-admin me and re-admin me, or wait for the system to sync.");
		}

		// কিক দেওয়ার ফাংশন
		const kick = (uid) => {
			api.removeUserFromGroup(uid, threadID, (err) => {
				if (err) return message.reply("❌ | Could not kick this user. Make sure I have enough permissions.");
			});
		};

		// ১. যদি কোনো মেসেজে রিপ্লাই করে !kick লেখা হয়
		if (messageReply) {
			if (messageReply.senderID == botID) return message.reply("I can't kick myself!");
			return kick(messageReply.senderID);
		}

		// ২. যদি মেনশন (Tag) করা হয়
		const uids = Object.keys(mentions);
		if (uids.length > 0) {
			for (const uid of uids) {
				if (uid == botID) continue;
				kick(uid);
			}
			return;
		}

		// ৩. যদি রিপ্লাই বা মেনশন না থাকে তবে সিনট্যাক্স এরর
		return message.reply("⚠ | Please tag the person you want to kick or reply to their message.");
	}
};
