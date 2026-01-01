module.exports = {
  config: {
    name: "post",
    aliases: ["fbpost"],
    version: "1.5",
    author: "AkHi",
    role: 2, // শুধুমাত্র বট এডমিন
    category: "Social",
    countDown: 10,
    shortDescription: "Post on Facebook profile",
    guide: {
      en: "{p}post <caption text>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const content = args.join(" ");

    if (!content) {
      return api.sendMessage("Enter your post caption", threadID, messageID);
    }

    try {
      // কিছু FCA ভার্সনে createPost এর বদলে handleCreatePost বা সরাসরি এপিআই কল লাগে।
      // এখানে সবথেকে প্রচলিত মেথডটি ব্যবহার করা হয়েছে।
      
      const postResponse = await api.share(content);

      // সফল হলে (যদি এরর না আসে)
      return api.sendMessage("AkHi Ma'am, Post done successfully ✅", threadID, messageID);

    } catch (error) {
      // যদি api.createPost সাপোর্ট না করে
      console.error("Post Error:", error);
      
      if (error.message.includes("is not a function")) {
          return api.sendMessage("Sorry Ma'am, timeline post doesn't support in your FCA library 🥺", threadID, messageID);
      }
      
      return api.sendMessage(`AkHi Ma'am, I'm so sorry, post failed 🥺\nError: ${error.message}`, threadID, messageID);
    }
  }
};
