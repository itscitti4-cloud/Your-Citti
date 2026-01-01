const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair",
    version: "1.1.1",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Create a pair between group members",
    longDescription: "This command randomly selects two members of the group and creates a pair.",
    category: "fun",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) { 
    const { threadID, messageID } = event;

    try {
      // থ্রেড ইনফো থেকে মেম্বার লিস্ট নেওয়া
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs;

      if (participantIDs.length < 2) {
        return api.sendMessage("পেয়ার তৈরি করতে গ্রুপে কমপক্ষে ২ জন সদস্য প্রয়োজন!", threadID, messageID);
      }

      // র‍্যান্ডম দুইজন মেম্বার সিলেক্ট করা
      let id1 = participantIDs[Math.floor(Math.random() * participantIDs.length)];
      let id2 = participantIDs[Math.floor(Math.random() * participantIDs.length)];

      while (id1 === id2) {
        id2 = participantIDs[Math.floor(Math.random() * participantIDs.length)];
      }

      // api.getUserInfo ব্যবহার করে নাম সংগ্রহ করা
      const userData = await api.getUserInfo([id1, id2]);
      
      const name1 = userData[id1].name;
      const name2 = userData[id2].name;

      const msg = `আজকের সেরা জুটি হলো:\n\n💞 ${name1} x ${name2} 💞\n\nতোমাদের দুজনের জন্য অনেক অনেক শুভকামনা! 🥳`;

      return api.sendMessage(msg, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage(`একটি সমস্যা হয়েছে: ${error.message}`, threadID, messageID);
    }
  }
};
