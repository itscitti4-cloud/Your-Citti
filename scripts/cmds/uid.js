const { findUid } = global.utils;
const regExCheckURL = /^(http|https):\/\/[^ "]+$/;

module.exports = {
	config: {
		name: "uid",
		version: "1.4",
		author: "AkHi",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem user id facebook của người dùng",
			en: "View facebook user id of user"
		},
		category: "information",
		guide: {
			vi: "{pn} <link profile>: xem id facebook của link profile",
			en: "{pn} <profile link>: view facebook user id of profile link"
		}
	},

	langs: {
		vi: {
			syntaxError: "Vui lòng tag người muốn xem uid hoặc để trống để xem uid của bản thân",
			error: "Không thể tìm thấy UID cho liên kết này: "
		},
		en: {
			syntaxError: "Please tag the person you want to view uid or leave it blank to view your own uid",
			error: "Could not find UID for this link: "
		}
	},

	onStart: async function ({ message, event, args, getLang }) {
		const { senderID, messageReply, mentions } = event;

		// ১. রিপ্লাই করলে আইডি দেখাবে
		if (messageReply) {
			return message.reply(messageReply.senderID);
		}

		// ২. শুধু কমান্ড দিলে নিজের আইডি দেখাবে
		if (args.length === 0) {
			return message.reply(senderID);
		}

		// ৩. লিংক থেকে আইডি বের করা
		if (args[0].match(regExCheckURL)) {
			let msg = "";
			for (const link of args) {
				try {
					// findUid এর জন্য অপেক্ষা করা হচ্ছে
					const uid = await findUid(link);
					if (uid) {
						msg += `🔗 Link: ${link}\n🆔 UID: ${uid}\n\n`;
					} else {
						msg += `❌ ${getLang("error")}${link}\n\n`;
					}
				}
				catch (e) {
					msg += `❌ Error: ${link} => ${e.message}\n\n`;
				}
			}
			return message.reply(msg.trim());
		}

		// ৪. মেনশন থেকে আইডি বের করা
		let msgMentions = "";
		const mentionKeys = Object.keys(mentions);
		if (mentionKeys.length > 0) {
			for (const id of mentionKeys) {
				msgMentions += `${mentions[id].replace("@", "")}: ${id}\n`;
			}
			return message.reply(msgMentions.trim());
		}

		return message.reply(getLang("syntaxError"));
	}
};
