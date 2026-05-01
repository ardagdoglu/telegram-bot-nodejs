const express = require("express");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// RATE LIMIT
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 30 // max 30 istek
}));

// ENV
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const SECRET = process.env.SECRET;

// ENV kontrol
if (!TELEGRAM_TOKEN || !CHAT_ID || !SECRET) {
  console.error("ENV eksik! TELEGRAM_TOKEN / CHAT_ID / SECRET");
  process.exit(1);
}

// duplicate kontrol
let lastHash = "";

// hash oluştur
function createHash(text) {
  return crypto.createHash("md5").update(text).digest("hex");
}

// etiketleme
function getTag(text) {
  const t = text.toLowerCase();

  if (t.includes("performance max")) return "📊 PMAX";
  if (t.includes("advantage")) return "⚡ META";
  if (t.includes("ai")) return "🤖 AI";
  if (t.includes("shopping")) return "🛒 SHOPPING";

  return "📢 UPDATE";
}

// WEBHOOK
app.post("/webhook", async (req, res) => {
  try {
    // SECRET kontrol
    const incoming = req.headers["x-secret"];
    if (incoming !== SECRET) {
      return res.sendStatus(403);
    }

    const text = req.body?.text || "";
    const title = req.body?.title || "Update";
    const url = req.body?.url || "";

    if (!text) return res.sendStatus(200);

    const hash = createHash(text);

    // duplicate engelle
    if (hash === lastHash) {
      return res.sendStatus(200);
    }

    lastHash = hash;

    const tag = getTag(text);

    const message = `
${tag}

${title}

${text.substring(0, 800)}

🔗 ${url}
`;

    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text: message,
        disable_web_page_preview: false
      }
    );

    res.sendStatus(200);

  } catch (err) {
    console.error("ERROR:", err.message);
    res.sendStatus(500);
  }
});

// health check
app.get("/", (req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
