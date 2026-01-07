module.exports = {
	config: {
		name: "unsend",
		aliases: ["u", "r", "un", "del"],
		version: "1.5",
		author: "AkHi",
		countDown: 5,
		role: 1, // অন্য ইউজারের মেসেজ ডিলিট করার জন্য এডমিন রোল (1) দেওয়া হয়েছে
		description: {
			vi: "Gỡ tin nhắn bất kỳ (Bot cần quyền Admin)",
			en: "Unsend any message (Bot must be Admin)"
		},
		category: "box chat",
		guide: {
			vi: "reply tin nhắn muốn gỡ và gọi lệnh {pn}",
			en: "reply to the message you want to unsend and type {pn}"
		}
	},

	langs: {
		vi: {
			syntaxError: "Vui lòng reply tin nhắn muốn gỡ",
			error: "Bot cần quyền Quản trị viên để gỡ tin nhắn của người khác!"
		},
		en: {
			syntaxError: "Please reply to the message you want to unsend",
			error: "Bot needs Admin privileges to unsend messages from others!"
		}
	},

	onStart: async function ({ message, event, api, getLang }) {
		// রিপ্লাই না করলে এরর দিবে
		if (!event.messageReply) {
			return message.reply(getLang("syntaxError"));
		}

		try {
			// আপনার API লিস্ট অনুযায়ী unsendMessage ফাংশনটি ব্যবহার করা হয়েছে
			await api.unsendMessage(event.messageReply.messageID);
		} catch (e) {
			// বট এডমিন না হলে বা অন্য সমস্যা থাকলে এই মেসেজ দিবে
			return message.reply(getLang("error"));
		}
	}
};
