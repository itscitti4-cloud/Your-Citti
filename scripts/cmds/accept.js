const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "accept",
    aliases: ["friendrequest", "acp"],
    version: "2.0",
    author: "AkHi",
    countDown: 10,
    role: 2,
    shortDescription: "Accept or delete friend requests",
    longDescription: "View, accept, or delete pending Facebook friend requests.",
    category: "Utility",
    guide: "{pn}"
  },

  onStart: async function ({ event, api, commandName }) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303", // This ID may need updates based on FB changes
        variables: JSON.stringify({ input: { scale: 3 } })
      };

      const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const data = JSON.parse(res);
      const listRequest = data?.data?.viewer?.friending_possibilities?.edges || [];

      if (listRequest.length === 0) {
        return api.sendMessage("✅ No pending friend requests found.", event.threadID, event.messageID);
      }

      let msg = "📩 𝐏𝐞𝐧𝐝𝐢𝐧𝐠 𝐅𝐫𝐢𝐞𝐧𝐝 𝐑𝐞𝐪𝐮𝐞𝐬𝐭𝐬:\n━━━━━━━━━━━━━━━━━━\n";
      listRequest.forEach((user, index) => {
        msg += `\n${index + 1}. 𝐍𝐚𝐦𝐞: ${user.node.name}\n𝐈𝐃: ${user.node.id}\n`;
      });

      api.sendMessage(
        `${msg}\n━━━━━━━━━━━━━━━━━━\nReply with:\n➤ add <number | all>\n➤ del <number | all>`,
        event.threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            listRequest,
            author: event.senderID
          });
        },
        event.messageID
      );
    } catch (err) {
      api.sendMessage("❌ Error fetching requests. FB might have blocked this action.", event.threadID);
    }
  },

  onReply: async function ({ event, api, Reply }) {
    const { author, listRequest, messageID } = Reply;
    if (event.senderID !== author) return;

    const args = event.body.toLowerCase().split(" ");
    const action = args[0];
    const target = args[1];

    if (!["add", "del"].includes(action)) return;

    api.unsendMessage(messageID);
    api.sendMessage(`⏳ Processing ${action === 'add' ? 'acceptance' : 'deletion'}...`, event.threadID);

    let targets = target === "all" ? listRequest.map((_, i) => i + 1) : args.slice(1).map(Number);
    const success = [], failed = [];

    for (const index of targets) {
      const user = listRequest[index - 1];
      if (!user) continue;

      const form = {
        av: api.getCurrentUserID(),
        fb_api_caller_class: "RelayModern",
        variables: JSON.stringify({
          input: {
            source: "friends_tab",
            actor_id: api.getCurrentUserID(),
            friend_requester_id: user.node.id,
            client_mutation_id: Math.round(Math.random() * 19).toString()
          },
          scale: 3
        })
      };

      if (action === "add") {
        form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
        form.doc_id = "3147613905362928";
      } else {
        form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
        form.doc_id = "4108254489275063";
      }

      try {
        const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
        if (res.includes("errors")) failed.push(user.node.name);
        else success.push(user.node.name);
      } catch (e) {
        failed.push(user.node.name);
      }
    }

    api.sendMessage(
      `✅ 𝐃𝐨𝐧𝐞!\n━━━━━━━━━━━━━━━━━━\n✨ Success: ${success.length}\n❌ Failed: ${failed.length}\n━━━━━━━━━━━━━━━━━━`,
      event.threadID,
      event.messageID
    );
    global.GoatBot.onReply.delete(messageID);
  }
};
  
