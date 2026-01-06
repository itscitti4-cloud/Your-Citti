module.exports = {
  config: {
    name: "supportgc",
    version: "2.1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Add users to the support group",
    longDescription: "Automatically adds the user or replied user to the official support group.",
    category: "system",
    guide: "{pn} | {pn} link | {pn} name | or reply to a user"
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { threadID, messageID, senderID, type, messageReply } = event;

    // --- CONFIGURATION ---
    const SUPPORT_GC_ID = "25416434654648555"; // Replace with your actual Support Group ID
    const GROUP_NAME = "YOUR CITTI BOT GROUP";
    const GROUP_LINK = "Link Is Private! To add support group type !supporgc"; // Replace with your actual Group Link

    // 1. Get Group Name
    if (args[0] === "name") {
      return message.reply(`📢 **SUPPORT GROUP NAME:**\n━━━━━━━━━━━━━━━━━━\n✨ Name: ${GROUP_NAME}`);
    }

    // 2. Get Group Link
    if (args[0] === "link") {
      return message.reply(`🔗 ** SUPPORT GROUP LINK:**\n━━━━━━━━━━━━━━━━━━\n🌐 Join here: ${GROUP_LINK}\n\nNote: Make sure your "Join Requests" are turned off for direct entry.`);
    }

    // Determine Target User (Self or Replied User)
    let targetID = type === "message_reply" ? messageReply.senderID : senderID;
    let name = await usersData.getName(targetID);

    try {
      // Check if user is already in the support group
      const groupInfo = await api.getThreadInfo(SUPPORT_GC_ID);
      const isExist = groupInfo.participantIDs.includes(targetID);

      if (isExist) {
        return message.reply(`❌ **${name}**, You are already exist in "${GROUP_NAME}"`);
      }

      // Add user to the group
      await api.addUserToGroup(targetID, SUPPORT_GC_ID);

      // --- Success Message (In Current Group) ---
      const msgMain = {
        body: `✅ **SUCCESSFULLY ADDED!**\n━━━━━━━━━━━━━━━━━━\n👤 **User:** ${name}\n🛡️ **Target:** ${GROUP_NAME}\n\n✨ The user has been successfully added to our official support group.`,
        mentions: [{ tag: name, id: targetID }]
      };
      await message.reply(msgMain);

      // --- Welcome Message (In Support Group) ---
      const msgSupport = {
        body: `📥 **NEW MEMBER ALERT!**\n━━━━━━━━━━━━━━━━━━\nWelcome ${name} to ${GROUP_NAME}!\n\nFeel free to ask any questions or report bugs regarding the bot here.`,
        mentions: [{ tag: name, id: targetID }]
      };
      await api.sendMessage(msgSupport, SUPPORT_GC_ID);

    } catch (error) {
      return message.reply(`⚠️ **ERROR DETECTED!**\n━━━━━━━━━━━━━━━━━━\nI cannot add the user. Possible reasons:\n1. The user has blocked the bot.\n2. I am not an admin in the support group.\n3. The group is full.`);
    }
  }
};
