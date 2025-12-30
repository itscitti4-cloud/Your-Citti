const axios = require('axios');
const moment = require('moment-timezone');

module.exports = {
    config: {
        name: "info",
        aliases: ["inf", "in4"],
        version: "2.6",
        author: "AkHi",
        countDown: 5,
        role: 0,
        shortDescription: { en: "Sends bot and admin info." },
        longDescription: { en: "Sends bot and admin info along." },
        category: "Information",
        guide: { en: "{pn}" }
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
        try { // <--- এখানে try ব্লক শুরু করা হয়েছে
            message.reply("Please wait😘").then(async (waitMsg) => {
                setTimeout(() => {
                    message.unsend(waitMsg.messageID);
                }, 4000);

                const botName = "Your Citti";
                const botPrefix = `${global.GoatBot.config.prefix}`;
                const authorName = "Lubna Jannat AkHi";
                const authorFB = "https://www.facebook.com/LubnaaJannat.AkHi";
                const authorInsta = "@lubnajannat_";
                const status = "Married to Shahryar Sabu";

                const now = moment().tz('Asia/Dhaka');
                const date = now.format('dddd, MMMM Do YYYY');
                const time = now.format('h:mm:ss A');

                const uptime = process.uptime();
                const seconds = Math.floor(uptime % 60);
                const minutes = Math.floor((uptime / 60) % 60);
                const hours = Math.floor((uptime / (60 * 60)) % 24);
                const days = Math.floor(uptime / (60 * 60 * 24));
                const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`.replace(/^0d 0h /, "");
                
                message.reply({
                    body: `╭─╼━━━[ 🌟 𝑩𝑶𝑻 & 𝑨𝑼𝑻𝑯𝑶𝑹 𝑰𝑵𝑭𝑶 🌟 ]━━━╾─╮
┃
┃ 👤 Bot Owner: ${authorName}
┃ 🤖 Bot name : ${botName}
┃ 🔰 Prefix   : ${botPrefix}
┃ ❤ Status    : ${status}
┃
┃ 📆 Date     : ${date}
┃ ⏰ Time     : ${time}
┃ ⚙ Uptime    : ${uptimeString}
┃
┃ 🌐 Facebook  : ${authorFB}
┃ 📸 Insta     : ${authorInsta}
┃
╰─╼━━━━━━━━━━━━━━━━━━━━━━━━━━━━╾─╯`
                }); // <--- এখানে }); দিয়ে ফাংশন শেষ করা হয়েছে
            });

        } catch (error) { // <--- catch ব্লকটি এখন কাজ করবে
            console.error(error);
            message.reply("An error occurred while fetching information.");
        }
    }
};
