module.exports = {
 config: {
 name: "offbot",
 version: "1.0",
 author: "AkHi",
 countDown: 45,
 role: 2,
 shortDescription: "Turn off bot",
 longDescription: "Turn off bot",
 category: "Admin",
 guide: "{p}{n}"
 },
 onStart: async function ({event, api}) {
 const permission = [ "61583939430347" ];
 if (!permission.includes(event.senderID)) {
 api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\nYou don't have permission to use this command.\n═══ஜ۩۞۩ஜ═══╝", event.threadID, event.messageID);
 return;
 }
 api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\nsuccessfully Turned Off System ✅\═══ஜ۩۞۩ஜ═══╝",event.threadID, () =>process.exit(0))}
};
