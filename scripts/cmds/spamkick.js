module.exports.config = {
  name: "spamkick",
  version: "1.0.1",
  role: 0, 
  author: "AkHi",
  usePrefix: true,
  description: { 
      en: "Automatically kick a user who spams messages in a group chat"
  },
  category: "Box Chat",
  guide: { en:"[on/off] or [settings]"},
  countDown: 5
};

module.exports.onChat = async ({ api, event, usersData, commandName }) => {
  const { senderID, threadID } = event;
  if (!global.antispam) global.antispam = new Map();

  // চেক করা হচ্ছে এই থ্রেডে অ্যান্টি-স্প্যাম অন আছে কি না
  if (!global.antispam.has(threadID)) return;

  const threadInfo = global.antispam.get(threadID);
  if (!(senderID in threadInfo.users)) {
    threadInfo.users[senderID] = { count: 1, time: Date.now() };
  } else {
    threadInfo.users[senderID].count++;
    const timePassed = Date.now() - threadInfo.users[senderID].time;
    const messages = threadInfo.users[senderID].count;
    const timeLimit = 80000;
    const messageLimit = 14; 

    if (messages > messageLimit && timePassed < timeLimit) {
      if(global.GoatBot.config.adminBot.includes(senderID)) return;

      // সরাসরি ফেসবুক থেকে ডাটা নিয়ে অ্যাডমিন চেক
      const facebookThreadInfo = await api.getThreadInfo(threadID);
      const botID = api.getCurrentUserID();
      const adminIDs = facebookThreadInfo.adminIDs.map(admin => admin.id);

      if (!adminIDs.includes(botID)) {
        // বট অ্যাডমিন না হলে ডাটা রিসেট করে মেসেজ দিবে
        threadInfo.users[senderID] = { count: 1, time: Date.now() };
        return api.sendMessage("🚫 Spam detected! But I can't kick the user because I am not an admin.", threadID);
      }

      api.removeUserFromGroup(senderID, threadID, async (err) => {
        if (err) {
          console.error(err);
        } else {
          api.sendMessage({body: `${await usersData.getName(senderID)} has been removed for spamming.\nUser ID: ${senderID}\nReact to this message to add him again.`}, threadID, (error,info) => {
              global.GoatBot.onReaction.set(info.messageID, { 
                  commandName, 
                  uid: senderID,
                  messageID: info.messageID
              });
          });
        }
      });

      threadInfo.users[senderID] = { count: 1, time: Date.now() };
    } else if (timePassed > timeLimit) {
      threadInfo.users[senderID] = { count: 1, time: Date.now() };
    }
  }

  global.antispam.set(threadID, threadInfo);
};

module.exports.onReaction = async ({ api, event, Reaction, threadsData, usersData , role }) => {
    const { uid, messageID } = Reaction;
    const { threadID } = event;
    
    // রিয়েল-টাইম ডাটা চেক
    const facebookThreadInfo = await api.getThreadInfo(threadID);
    const adminIDs = facebookThreadInfo.adminIDs.map(admin => admin.id);
    const approvalMode = facebookThreadInfo.approvalMode;
    const botID = api.getCurrentUserID();

    if (role < 1) return;
    var msg = "";

    try {
        if (!adminIDs.includes(botID)) {
            return api.sendMessage("I need to be an admin to add users back.", threadID);
        }

        await api.addUserToGroup(uid, threadID);
        if (approvalMode === true && !adminIDs.includes(botID)){
            msg += `Successfully added ${await usersData.getName(uid)} to approval list.`;
            await api.unsendMessage(messageID);
        }
        else{
            msg += `Successfully added ${await usersData.getName(uid)} to this group.`;
            await api.unsendMessage(messageID);
        }
    }
    catch (err) {
        msg += `Failed to add ${await usersData.getName(uid)} to this group.`;
    }
    api.sendMessage(msg, threadID);
};

module.exports.onStart = async ({ api, event, args }) => {
  switch (args[0]) {
      case "on":
        if (!global.antispam) global.antispam = new Map();
        global.antispam.set(event.threadID, { users: {} });
        api.sendMessage("Spam kick has been turned on for this Group.", event.threadID, event.messageID);
        break;
      case "off":
        if (global.antispam && global.antispam.has(event.threadID)) {
          global.antispam.delete(event.threadID);
          api.sendMessage("Spam kick has been turned off for this group", event.threadID, event.messageID);
        } else {
          api.sendMessage("Spam kick is not active on this group", event.threadID, event.messageID);
        }
        break;
      default:
        api.sendMessage("Please use 'on' to activate or 'off' to deactivate the Spam kick.", event.threadID, event.messageID);
    }
};
