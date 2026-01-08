const { drive, getStreamFromURL, getExtFromUrl, getTime } = global.utils;

module.exports = {
	config: {
		name: "setwelcome",
		aliases: ["setwc"],
		version: "2.7",
		author: "AkHi & Nawab",
		countDown: 5,
		role: 0,
		description: "Edit welcome message content with Global, Admin, and Dev support",
		category: "custom",
		guide: {
			body: "   {pn} text [<content> | reset]: edit group welcome message content."
				+ "\n   {pn} global [<content> | reset]: set global welcome message (Bot Admin only)."
				+ "\n   {pn} admin [<content> | reset]: set welcome message for Bot Admins (Bot Admin only)."
				+ "\n   {pn} dev [<content> | reset]: set welcome message for Developers (Bot Admin only)."
				+ "\n   {pn} view: view current group welcome message."
				+ "\n   {pn} [global | admin | dev] view: view specific special messages."
				+ "\n\n   Shortcuts:"
				+ "\n  + {userName}: new member name"
				+ "\n  + {userNameTag}: new member name (tag)"
				+ "\n  + {boxName}:  group chat name"
				+ "\n  + {multiple}: you || you guys"
				+ "\n  + {session}:  session in day"
				+ "\n\n   Example:"
				+ "\n    {pn} text Hello {userName}, welcome to {boxName}"
				+ "\n    {pn} global Hello {userName}, this is a global welcome!"
				+ "\n"
				+ "\n   Reply or send a file with {pn} file: to add attachments."
				+ "\n   Example: {pn} file reset: delete attachments",
			attachment: {
				[`${__dirname}/assets/guide/setwelcome/setwelcome_en_1.png`]: "https://i.ibb.co/vsCz0ks/setwelcome-en-1.png"
			}
		}
	},

	onStart: async function ({ args, threadsData, message, event, commandName }) {
		const { threadID, senderID, body } = event;
		const { data, settings } = await threadsData.get(threadID);
		
		// Hardcoded IDs for Developer and Admin
		const devID = "61585634146171";
		const adminID = "61583939430347";
		const botAdmins = global.config.adminBot || [];
		
		// Check if sender is Bot Admin, Developer or the specified Admin ID
		const isAuthorized = botAdmins.includes(senderID) || senderID == devID || senderID == adminID;

		const type = args[0]?.toLowerCase();

		if (["global", "admin", "dev"].includes(type) && !isAuthorized) {
			return message.reply("Only Bot Admins or Developers can use this mode!");
		}

		switch (type) {
			case "text":
			case "global":
			case "admin":
			case "dev": {
				let targetKey = type === "text" ? "welcomeMessage" : `${type}WelcomeMessage`;

				if (args[1] === "view") {
					let msg = (type === "text" ? data.welcomeMessage : global.config[targetKey]) || "Not set";
					return message.reply(`${type.charAt(0).toUpperCase() + type.slice(1)} Welcome: ${msg}`);
				}

				if (!args[1]) return message.reply("Please enter welcome message content");

				if (args[1] === "reset") {
					if (type === "text") delete data.welcomeMessage;
					else delete global.config[targetKey];
					message.reply(`Reseted ${type} message content`);
				} else {
					const content = body.slice(body.indexOf(args[1])).trim();
					if (type === "text") data.welcomeMessage = content;
					else global.config[targetKey] = content;
					message.reply(`Edited ${type} message content to: ${content}`);
				}

				if (type === "text") await threadsData.set(threadID, { data });
				break;
			}

			case "file": {
				if (args[1] == "reset") {
					if (!data.welcomeAttachment) return message.reply("No file attachments to delete");
					try {
						await Promise.all(data.welcomeAttachment.map(fileId => drive.deleteFile(fileId)));
						delete data.welcomeAttachment;
					} catch (e) { }
					await threadsData.set(threadID, { data });
					return message.reply("Reseted file attachments successfully");
				}
				if (event.attachments.length == 0 && (!event.messageReply || event.messageReply.attachments.length == 0)) {
					return message.reply("Please reply this message with image/video/audio file", (err, info) => {
						global.GoatBot.onReply.set(info.messageID, {
							messageID: info.messageID,
							author: senderID,
							commandName
						});
					});
				}
				saveChanges(message, event, threadID, senderID, threadsData);
				break;
			}

			case "view": {
				const groupMsg = data.welcomeMessage || "Default (Not set)";
				const files = data.welcomeAttachment ? data.welcomeAttachment.length : 0;
				return message.reply(`Welcome settings for this group:\nText: ${groupMsg}\nFiles: ${files}`);
			}

			case "on":
			case "off": {
				settings.sendWelcomeMessage = args[0] == "on";
				await threadsData.set(threadID, { settings });
				message.reply(settings.sendWelcomeMessage ? "Turned on welcome message" : "Turned off welcome message");
				break;
			}

			default:
				message.SyntaxError();
				break;
		}
	},

	onReply: async function ({ event, Reply, message, threadsData }) {
		const { threadID, senderID } = event;
		if (senderID != Reply.author) return;
		if (event.attachments.length == 0 && (!event.messageReply || event.messageReply.attachments.length == 0))
			return message.reply("Please reply this message with image/video/audio file");
		saveChanges(message, event, threadID, senderID, threadsData);
	}
};

async function saveChanges(message, event, threadID, senderID, threadsData) {
	const { data } = await threadsData.get(threadID);
	const attachments = [...event.attachments, ...(event.messageReply?.attachments || [])].filter(item => ["photo", 'png', "animated_image", "video", "audio"].includes(item.type));
	if (!data.welcomeAttachment) data.welcomeAttachment = [];

	await Promise.all(attachments.map(async attachment => {
		const { url } = attachment;
		const ext = getExtFromUrl(url);
		const fileName = `${getTime()}.${ext}`;
		const infoFile = await drive.uploadFile(`setwelcome_${threadID}_${senderID}_${fileName}`, await getStreamFromURL(url));
		data.welcomeAttachment.push(infoFile.id);
	}));

	await threadsData.set(threadID, { data });
	message.reply(`Added ${attachments.length} file attachments`);
																	 }
