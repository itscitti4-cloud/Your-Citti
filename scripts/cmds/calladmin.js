const { getStreamsFromAttachment } = global.utils;
const moment = require("moment-timezone");
const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

// Admin IDs - Ensure they are exactly as they appear in the URL/UID
const ADMIN_IDS = ["61585634146171", "61583939430347", "61573170325989"];

module.exports = {
	config: {
		name: "callad",
		version: "3.0",
		author: "AkHi",
		countDown: 5,
		role: 0,
		description: "Send report to admins with strict ID handling",
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
			// নতুন ১৫ ডিজিটের আইডিগুলোর জন্য String conversion মাস্ট
			const targetID = id.toString();
			
			try {
				// এই পদ্ধতিতে কলব্যাক এবং রিটার্ন চেক করা হচ্ছে
				const info = await new Promise((resolve) => {
					api.sendMessage({ body, mentions: [{ id: senderID, tag: senderName }] }, targetID, (err, msgInfo) => {
						if (err) {
							console.error(`[CallAd] Failed for ID ${targetID}:`, err);
							resolve(null);
						} else {
							resolve(msgInfo);
						}
					});
				});

				if (info && info.messageID) {
					global.GoatBot.onReply.set(info.messageID, {
						commandName,
						messageID: info.messageID,
						threadID,
						messageIDSender: messageID,
						type: "userCallAdmin"
					});
					count++;
					const name = await usersData.getName(targetID);
					successNames.push(name);
				}
			} catch (e) {
				console.error(`[CallAd] Error in loop for ${targetID}:`, e);
			}
		}

		if (count > 0) {
			return message.reply(`✅ Message sent to ${count} admin(s): ${successNames.join(", ")}`);
		} else {
			// যদি ফ্রেন্ড হওয়ার পরেও না যায়, তবে AppState বা Token এ সমস্যা থাকতে পারে
			return message.reply("❌ API Failure: Even though you are friends, Facebook refused the message. This often happens if the bot account's AppState is old or restricted from sending too many PMs.");
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
