import { makeInMemoryStore, Browsers, makeCacheableSignalKeyStore, makeWASocket, useMultiFileAuthState } from "@fizzxydev/baileys-pro"
import pino from "pino"
import NodeCache from "node-cache"
import Serialize from "./lib/serialize.js"
import handler from "./lib/handler.js"
import { DatabaseJson } from "./database/index.js"

const msgRetryCounterCache = new NodeCache()
const logger = pino({ level: "silent" })
const store = makeInMemoryStore({})
const db = new DatabaseJson()
process.on("SIGINT", () => {
  console.log("Signal Interupt")
  process.exit()
})
process.on("exit", (code) => {
  db.save()
  console.log("Exiting with code", code)
})

void async function main() {
  const { state, saveCreds } = await useMultiFileAuthState("./session/")
  const sock = makeWASocket({
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: Browsers.macOS("Chrome"),
    msgRetryCounterCache
  });

  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      const number = '62895359263399'
      const code = await sock.requestPairingCode(number, "AGUS1234")
      console.log(code)
    }, 3000)
  }
  store.bind(sock.ev)
  sock.ev.on("messages.upsert", (event) => {
    if (event.type != "notify") return;

    let message = event.messages[0]
    const m = new Serialize(message, sock, store, db)
    handler({ m, sock, db, store })
  })
  sock.ev.on("connection.update", (update) => {
    let { connection, receivedPendingNotifications } = update
    if (connection == "close") {
      console.log("close")
      main()
    }
    if (receivedPendingNotifications) {
      sock.sendMessage(sock.user.id, { text: "Bot ready for respon any message" })
    }
    console.log(update)
  })
  sock.ev.on("creds.update", saveCreds)
}()
