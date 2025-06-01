export default function handler({ m, sock, db, store }) {
  // checking the databasejson
  if (m.isGroup && !db.checkGroup(m.chat)) db.addGroup(m.chat)
  if (!db.checkUser(m.sender)) db.addUser(m.sender)
  // add your custom features
  // examples
  switch (m.command) {
    case "test": {
      sock.sendMessage(m.chat, { text: "Bot is Online." })
    }
      break;
    case "ping": {
      m.reply("pong!")
    }
      break;
  }
}
