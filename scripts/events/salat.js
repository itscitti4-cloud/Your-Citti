const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "salat",
    version: "2.0.0",
    author: "AkHi",
    envConfig: {
      enable: true,
      city: "Dhaka",
      country: "Bangladesh",
      method: 2 
    }
  },

  onLoad: async function ({ api }) {
    console.log("Salat Auto Notice API Started...");

    if (global.salatInterval) clearInterval(global.salatInterval);

    global.salatInterval = setInterval(async () => {
      try {
        const timezone = "Asia/Dhaka";
        const now = moment.tz(timezone);
        const currentTime = now.format("HH:mm");
        const currentDate = now.format("DD-MM-YYYY");

        const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity/${currentDate}`, {
          params: {
            city: "Dhaka",
            country: "Bangladesh",
            method: 2
          }
        });

        const timings = response.data.data.timings;
        
        const prayers = {
          "Fajr": "Fajr",
          "Dhuhr": "Dhuhr",
          "Asr": "Asr",
          "Maghrib": "Maghrib",
          "Isha": "Isha"
        };

        for (let key in prayers) {
          if (timings[key] === currentTime) {
            const msg = `[ 🕌 Prayer Time Alert ]\n\nAssalamu Alaikum! It is now time for ${prayers[key]} prayer.\n\nCity: Dhaka\nDate: ${currentDate}\n\nPlease prepare for your Salah.`;
            
            const threadList = await api.getThreadList(100, null, ["INBOX"]);
            threadList.forEach(thread => {
              if (thread.isGroup) {
                api.sendMessage(msg, thread.threadID);
              }
            });
          }
        }
      } catch (error) {
        console.error("Prayer API Error:", error);
      }
    }, 60000); 
  }
};
            
