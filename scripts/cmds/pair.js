const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair",
    version: "1.0.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "গ্রুপের সদস্যদের মধ্যে জুটি তৈরি করুন",
    longDescription: "এটি গ্রুপের দুইজন সদস্যকে র‍্যান্ডমলি সিলেক্ট করে একটি জুটি বানিয়ে ছবি তৈরি করবে।",
    category: "entertainment",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, Users }) {
    const { threadID, messageID } = event;
    
    // গ্রুপের সব মেম্বার আইডি নেওয়া
    const threadInfo = await api.getThreadInfo(threadID);
    const participantIDs = threadInfo.participantIDs;
    
    // র‍্যান্ডম দুইজন সদস্য নির্বাচন
    const id1 = participantIDs[Math.floor(Math.random() * participantIDs.length)];
    const id2 = participantIDs[Math.floor(Math.random() * participantIDs.length)];
    
    // নাম সংগ্রহ করা
    const name1 = await Users.getNameUser(id1);
    const name2 = await Users.getNameUser(id2);
    
    // ছবি ডাউনলোড করার পাথ
    const pathImg = path.join(__dirname, "cache", "pair.png");
    
    // একটি সুন্দর রিলেশনশিপ ইমেজ এপিআই (উদাহরণস্বরূপ)
    // নোট: এখানে আপনি যেকোনো লভ-মেকার এপিআই লিঙ্ক ব্যবহার করতে পারেন
    const pairUrl = `https://graph.facebook.com/${id1}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const pairUrl2 = `https://graph.facebook.com/${id2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    const msg = `আজকের সেরা জুটি হলো:\n\n💞 ${name1} x ${name2} 💞\n\nঅভিনন্দন আপনাদের! 🥳`;

    return api.sendMessage(msg, threadID, messageID);
  }
};
