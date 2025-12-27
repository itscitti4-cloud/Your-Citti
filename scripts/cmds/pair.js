const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair",
    version: "1.1.0",
    author: "AkHi",
    countDown: 5,
    role: 0,
    shortDescription: "Create a pair between group members",
    longDescription: "This command randomly selects two members of the group and creates a pair.",
    category: "entertainment",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;

    try {
      // Get thread info to get participant list
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs;

      if (participantIDs.length < 2) {
        return api.sendMessage("The group needs at least 2 members to make a pair!", threadID, messageID);
      }

      // Randomly select two distinct members
      let id1 = participantIDs[Math.floor(Math.random() * participantIDs.length)];
      let id2 = participantIDs[Math.floor(Math.random() * participantIDs.length)];

      // Ensure id1 and id2 are not the same person
      while (id1 === id2) {
        id2 = participantIDs[Math.floor(Math.random() * participantIDs.length)];
      }

      // Fetch names using usersData (fixing the TypeError)
      const name1 = await usersData.getNameUser(id1);
      const name2 = await usersData.getNameUser(id2);

      // Prepare the message
      const msg = `Today's best match is:\n\n💞 ${name1} x ${name2} 💞\n\nCongratulations to both of you! 🥳`;

      // Optional: You can add profile pictures as attachments here
      return api.sendMessage(msg, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage(`An error occurred: ${error.message}`, threadID, messageID);
    }
  }
};
