const { findUid } = global.utils;
const regExCheckURL = /^(http|https):\/\/[^ "]+$/;

module.exports = {
	config: {
		name: "uid",
		version: "1.5",
		author: "AkHi",
		countDown: 5,
		role: 0,
		description: "View facebook user id of user",
		category: "information",
		guide: "{pn} [mention/link/reply/blank]"
	},

	onStart: async function ({ message, event, args }) {
		const { senderID, messageReply, mentions } = event;

		// ১. শুধু !uid দিলে নিজের আইডি দেখাবে
		if (args.length === 0 && !messageReply) {
			return message.reply(senderID);
		}

		// ২. রিপ্লাই করলে ওই ইউজারের আইডি দেখাবে
		if (messageReply) {
			return message.reply(messageReply.senderID);
		}

		// ৩. মেনশন (Tag) করলে আইডি দেখাবে
		const mentionKeys = Object.keys(mentions);
		if (mentionKeys.length > 0) {
			let msgMentions = "";
			for (const id of mentionKeys) {
				msgMentions += `${mentions[id].replace("@", "")}: ${id}\n`;
			}
			return message.reply(msgMentions.trim());
		}

		// ৪. লিংক থেকে আইডি বের করা
		if (args[0] && regExCheckURL.test(args[0])) {
			let msg = "";
			for (const link of args) {
				try {
					const uid = await findUid(link);
					if (uid) {
						msg += `🆔 UID: ${uid}\n🔗 Link: ${link}\n\n`;
					} else {
						msg += `❌ Could not find UID for this link: ${link}\n\n`;
					}
				} catch (e) {
					msg += `❌ Error: ${link} => ${e.message}\n\n`;
				}
			}
			return message.reply(msg.trim());
		}

		// ৫. সঠিক ফরম্যাটে না দিলে এরর মেসেজ
		return message.reply("Please tag someone, reply to a message, or provide a link to view the UID.");
	}
};
