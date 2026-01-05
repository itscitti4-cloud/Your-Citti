const { getStreamsFromAttachment } = global.utils;
const moment = require("moment-timezone");
const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

// সরাসরি অ্যাডমিনদের প্রোফাইল আইডি (String হিসেবে)
const ADMIN_IDS = ["61585634146171", "61583939430347", "61573170325989"];

module.exports = {
	config: {
		name: "callad",
		version: "2.9",
		author: "AkHi",
		countDown: 5,
		role: 0,
		description: "Fixed big ID sending issue with auto-skip",
		category: "contacts admin",
		guide: "{pn} <message>"
	},

	onStart: async function ({ args, message, event, usersData, api, commandName }) {
		const { senderID, threadID, isGroup, messageID } = event;

		if (!args[0]) return message.reply("❌ Please enter a message for the admins.");

		const time = moment.tz("Asia/Dhaka").format("hh:mm A");
		const senderName = await usersData.getName(senderID);
		
		let groupName = "Private Message";
		if (isGroup) {
			try {
				const threadInfo = await global.threadsData.get(threadID);
				groupName = threadInfo.threadName || "Unnamed Group";
			} catch (e) { groupName = "Group Chat"; }
		}

		const body = "»—☀️— **𝙲𝙰𝙻𝙻 𝙰𝙳𝙼𝙸𝙽** —☀️—«\n\n"
			+ ` ➤ 𝐓𝐢𝐦𝐞: ${time}\n`
			+ ` ➤ 𝐔𝐬𝐞𝐫: ${senderName}\n`
			+ ` ➤ 𝐔𝐈𝐃: ${senderID}\n`
			+ ` ➤ 𝐆𝐫𝐨𝐮𝐩: ${groupName}\n\n`
			+ `»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n`
			+ `»─────────────────«\n💬 Reply to chat`;

		let count = 0;
		let successNames = [];

		for (const id of ADMIN_IDS) {
			const target = id.toString();
			try {
				// API কলটিকে সরাসরি প্রমিজ আকারে ব্যবহার করা হচ্ছে
				const info = await new Promise((resolve, reject) => {
					api.sendMessage({ body, mentions: [{ id: senderID, tag: senderName }] }, target, (err, res) => {
						if (err) return reject(err);
						resolve(res);
					});
				});

				if (info) {
					global.GoatBot.onReply.set(info.messageID, {
						commandName,
						messageID: info.messageID,
						threadID,
						messageIDSender: messageID,
						type: "userCallAdmin"
					});
					count++;
					const name = await usersData.getName(target);
					successNames.push(name);
				}
			} catch (e) {
				// এরর আসলে এখানে কনসোলে দেখা যাবে ঠিক কী সমস্যা হচ্ছে
				console.log(`[CallAd] Failed to send to ${id}: ${e.errorDescription || e.errorMessage || "Unknown FB Error"}`);
				continue; // এরর আসলে স্কিপ করে পরেরটাতে যাবে
			}
		}

		if (count > 0) {
			return message.reply(`✅ Message sent to ${count} admin(s): ${successNames.join(", ")}`);
		} else {
			return message.reply("❌ FAULT: Facebook rejected the message requests. Please ensure the bot is a friend of the admin or the admin's inbox is open to everyone.");
		}
	},

	onReply: async ({ args, event, api, message, Reply, usersData, commandName }) => {
		const { type, threadID, messageIDSender } = Reply;
		const senderName = await usersData.getName(event.senderID);
		const time = moment.tz("Asia/Dhaka").format("hh:mm A");
		const attachments = event.attachments.filter(item => mediaTypes.includes(item.type));

		const isUserToAdmin = type === "userCallAdmin";
		const header = isUserToAdmin ? "𝐀𝐃𝐌𝐈𝐍 𝐑𝐄𝐒𝐏𝐎𝐍𝐒𝐄" : "𝐔𝐒𝐄𝐑 𝐑𝐄𝐏𝐋𝐘";
		const icon = isUserToAdmin ? "📩" : "👤";

		const body = `»—${icon}— **${header}** —${icon}—«\n\n ➤ 𝐓𝐢𝐦𝐞: ${time}\n ➤ 𝐍𝐚𝐦𝐞: ${senderName}\n\n»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n»─────────────────«\n✍️ Reply to continue`;

		api.sendMessage({
			body,
			mentions: [{ id: event.senderID, tag: senderName }],
			attachment: attachments.length > 0 ? await getStreamsFromAttachment(attachments) : []
		}, threadID, (err, info) => {
			if (err) return message.reply("❌ Failed to send reply.");
			message.reply(`✅ Response sent!`);
			global.GoatBot.onReply.set(info.messageID, {
				commandName,
				messageID: info.messageID,
				messageIDSender: event.messageID,
				threadID: event.threadID,
				type: isUserToAdmin ? "adminReply" : "userCallAdmin"
			});
		}, messageIDSender);
	}
};
