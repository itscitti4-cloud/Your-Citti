const axios = require('axios');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: "botinfo",
        aliases: ["inf", "info", "in4"],
        version: "2.7",
        author: "AkHi",
        countDown: 5,
        role: 0,
        shortDescription: "Sends bot and developer info.",
        longDescription: "Sends bot and developer info along with an image.",
        category: "Information",
        guide: "{pn}"
    },

    onStart: async function ({ message }) {
        this.sendInfo(message);
    },

    onChat: async function ({ event, message }) {
        if (event.body && event.body.trim().toLowerCase() === "info") {
            this.sendInfo(message);
        }
    },

    sendInfo: async function (message) {
        try {
            message.reply("Please wait😘").then(async (waitMsg) => {
                setTimeout(() => {
                    message.unsend(waitMsg.messageID);
                }, 4000);

                const botName = "Your Citti";
                const botPrefix = `${global.GoatBot.config.prefix}`;

                const now = moment().tz('Asia/Dhaka');
                const date = now.format('dddd, MMMM Do YYYY');
                const time = now.format('h:mm:ss A');

                const uptime = process.uptime();
                const seconds = Math.floor(uptime % 60);
                const minutes = Math.floor((uptime / 60) % 60);
                const hours = Math.floor((uptime / (60 * 60)) % 24);
                const days = Math.floor(uptime / (60 * 60 * 24));
                const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`.replace(/^0d 0h /, "");

                // ইমেজের পাথ সেট করা
                const imagePath = path.join(process.cwd(), "scripts/cmds/assets/image/Picsart_25-11-04_14-05-39-316.jpg");

                const msgBody = `
╭──── BOT & DEV INFO ────╮
  🤖 Bot: ${botName}
  🔰 Prefix: ${botPrefix}
  👤 Owner: Nawab & AkHi
  👤 Dev: Shahryar Sabu (Nawab)
  👤 Dev 2: Lubna Jannat (AkHi)
  
  📆 Date: ${date}
  ⏰ Time: ${time}
  ⚙️ Uptime: ${uptimeString}
  
  🌐 Dev info: {pn} dinfo
  🌐 Dev2 info: {pn} adinfo
╰─────────────────────╯`;

                // চেক করা হচ্ছে ফাইলটি ওই লোকেশনে আছে কি না
                if (fs.existsSync(imagePath)) {
                    message.reply({
                        body: msgBody,
                        attachment: fs.createReadStream(imagePath)
                    });
                } else {
                    // ফাইল না থাকলে শুধু টেক্সট পাঠাবে
                    message.reply(msgBody);
                }
            });

        } catch (error) {
            console.error(error);
            message.reply("An error occurred while fetching information.");
        }
    }
};
