const { getStreamsFromAttachment, log } = global.utils;
const moment = require("moment-timezone");
const mediaTypes = ["photo", 'png', "animated_image", "video", "audio"];

module.exports = {
	config: {
		name: "callad",
		version: "2.2",
		author: "AkHi",
		countDown: 5,
		role: 0,
		description: "send report, feedback, bug,... to admin bot",
		category: "contacts admin",
		guide: "{pn} <message>"
	},

	onStart: async function ({ args, message, event, usersData, threadsData, api, commandName }) {
		const { config } = global.GoatBot;
		if (!args[0]) return message.reply("❌ Please enter the message you want to send to admin");
		
		const { senderID, threadID, isGroup } = event;
		
		// কনফিগ থেকে আইডিগুলো নিয়ে সেগুলোকে স্ট্রিং-এ রূপান্তর নিশ্চিত করা
		let adminBot = config.adminBot || [];
		if (typeof adminBot === "string") adminBot = [adminBot];

		if (adminBot.length == 0) return message.reply("🚫 Bot has no admin at the moment");

		const time = moment.tz("Asia/Dhaka").format("hh:mm A");
		const senderName = await usersData.getName(senderID);
		
		let groupName = "Private Message";
		if (isGroup) {
			try {
				const threadInfo = await threadsData.get(threadID);
				groupName = threadInfo.threadName || "Unnamed Group";
			} catch(e) { groupName = "Unknown Group"; }
		}

		const msg = "»—☀️— **𝙲𝙰𝙻𝙻 𝙰𝙳𝙼𝙸𝙽** —☀️—«\n\n"
			+ ` ➤ 𝐓𝐢𝐦𝐞: ${time}\n`
			+ ` ➤ 𝐔𝐬𝐞𝐫: ${senderName}\n`
			+ ` ➤ 𝐔𝐈𝐃: ${senderID}\n`
			+ ` ➤ 𝐆𝐫𝐨𝐮𝐩: ${groupName}\n\n`
			+ `»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n`
			+ `»─────────────────«\n💬 Reply to this message to chat`;

		const formMessage = {
			body: msg,
			mentions: [{ id: senderID, tag: senderName }]
		};

		const successIDs = [];
		const adminNames = [];

		for (const uid of adminBot) {
			try {
				const targetID = String(uid).trim(); // নিশ্চিতভাবে স্ট্রিং এবং স্পেস মুক্ত করা
				
				// এডমিনের নাম নেওয়ার চেষ্টা
				let name = "Admin";
				try {
					name = await usersData.getName(targetID);
				} catch(e) { console.log("Could not get admin name for: " + targetID); }

				// সরাসরি API ব্যবহার করে পাঠানো
				await api.sendMessage(formMessage, targetID, (err, info) => {
					if (err) {
						console.error(`🔴 API Error for UID ${targetID}:`, err);
						return;
					}
					
					successIDs.push(targetID);
					adminNames.push({ id: targetID, name: name });

					global.GoatBot.onReply.set(info.messageID, {
						commandName,
						messageID: info.messageID,
						threadID,
						messageIDSender: event.messageID,
						type: "userCallAdmin"
					});
				});
			} catch (err) { 
				console.error(`🔴 Loop Error for UID ${uid}:`, err);
			}
		}

		// যেহেতু sendMessage অ্যাসিংক্রোনাস, আমরা সামান্য সময় অপেক্ষা করবো সাকসেস মেসেজের জন্য
		setTimeout(() => {
			if (successIDs.length > 0) {
				let listAdmin = adminNames.map(a => ` <@${a.id}> (${a.name})`).join("\n");
				return message.reply({ 
					body: `✅ Sent your message to ${successIDs.length} admin(s) successfully!\n${listAdmin}`, 
					mentions: adminNames.map(a => ({ id: a.id, tag: a.name })) 
				});
			} else {
				return message.reply("❌ Error: Could not reach any admin. Please check bot's terminal/console for exact error code.");
			}
		}, 2000);
	},

	onReply: async ({ args, event, api, message, Reply, usersData, threadsData, commandName }) => {
		const { type, threadID, messageIDSender } = Reply;
		const senderName = await usersData.getName(event.senderID);
		const time = moment.tz("Asia/Dhaka").format("hh:mm A");

		switch (type) {
			case "userCallAdmin": {
				try {
					const attachments = event.attachments.filter(item => mediaTypes.includes(item.type));
					const formMessage = {
						body: `»—📩— **𝐀𝐃𝐌𝐈𝐍 𝐑𝐄𝐒𝐏𝐎𝐍𝐒𝐄** —📩—«\n\n ➤ 𝐓𝐢𝐦𝐞: ${time}\n ➤ 𝐀𝐝𝐦𝐢𝐧: ${senderName}\n\n»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n»─────────────────«\n✍️ Reply to continue`,
						mentions: [{ id: event.senderID, tag: senderName }],
						attachment: attachments.length > 0 ? await getStreamsFromAttachment(attachments) : []
					};

					api.sendMessage(formMessage, threadID, (err, info) => {
						if (err) return message.reply("❌ Failed to send reply to User.");
						message.reply("✅ Response sent to User successfully!");
						global.GoatBot.onReply.set(info.messageID, { 
							commandName, 
							messageID: info.messageID, 
							messageIDSender: event.messageID, 
							threadID: event.threadID, 
							type: "adminReply" 
						});
					}, messageIDSender);
				} catch (e) { console.error(e); }
				break;
			}
			case "adminReply": {
				try {
					let groupInfo = "Private Message";
					if (event.isGroup) {
						try {
							const threadInfo = await threadsData.get(event.threadID);
							groupInfo = threadInfo.threadName || "Unnamed Group";
						} catch(e) { groupInfo = "Unknown Group"; }
					}

					const attachments = event.attachments.filter(item => mediaTypes.includes(item.type));
					const formMessage = {
						body: `»—👤— **𝐔𝐒𝐄𝐑 𝐑𝐄𝐏𝐋𝐘** —👤—«\n\n ➤ 𝐓𝐢𝐦𝐞: ${time}\n ➤ 𝐔𝐬𝐞𝐫: ${senderName}\n ➤ 𝐔𝐈𝐃: ${event.senderID}\n ➤ 𝐆𝐫𝐨𝐮𝐩: ${groupInfo}\n\n»——— 𝐂𝐨𝐧𝐭𝐞𝐧𝐭 ———«\n\n${args.join(" ")}\n\n»─────────────────«\n💬 Reply to chat`,
						mentions: [{ id: event.senderID, tag: senderName }],
						attachment: attachments.length > 0 ? await getStreamsFromAttachment(attachments) : []
					};

					api.sendMessage(formMessage, threadID, (err, info) => {
						if (err) return message.reply("❌ Failed to send reply to Admin.");
						message.reply("✅ Response sent to Admin!");
						global.GoatBot.onReply.set(info.messageID, { 
							commandName, 
							messageID: info.messageID, 
							messageIDSender: event.messageID, 
							threadID: event.threadID, 
							type: "userCallAdmin" 
						});
					}, messageIDSender);
				} catch (e) { console.error(e); }
				break;
			}
		}
	}
};
					
