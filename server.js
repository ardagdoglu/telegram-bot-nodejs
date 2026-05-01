const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ENV değişkenleri (Railway'de girilecek)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!TELEGRAM_TOKEN || !CHAT_ID) {
  console.error("ENV eksik!");
  process.exit(1);
}

// basit in-memory cache
let lastHash = "";

function createHash(text) {
  return require("crypto")
    .createHash("md5")
    .update(text)
    .digest("hex");
}

function getTag(text) {
  const t = text.toLowerCase();

  if (t.includes("performance max")) return "📊 PMAX";
  if (t.includes("advantage")) return "⚡ META";
  if (t.includes("ai")) return "🤖 AI";
  if (t.includes("shopping")) return "🛒 SHOPPING";

  return "📢 UPDATE";
}

app.post("/webhook", async (req, res) => {
  try {
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