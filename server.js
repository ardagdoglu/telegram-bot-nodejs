const express = require("express");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

const app = express();

app.use(express.json());

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 30
}));

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!TELEGRAM_TOKEN || !CHAT_ID) {
  console.error("ENV eksik!");
  process.exit(1);
}

let lastHash = "";

function createHash(text) {
  return crypto.createHash("md5").update(text).digest("hex");
}

function getTag(text) {
  const t = text.toLowerCase();

  if (t.includes("performance max")) return "📊 PMAX";
  if (t.includes("advantage")) return "⚡ META";
  if (t.includes("ai")) return "🤖 AI";

  return "📢 UPDATE";
}

app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/webhook", async (req, res) => {
  try {

    const text = req.body.text || "";
    const title = req.body.title || "Update";
    const url = req.body.url || "";

    if (!text) {
      return res.sendStatus(200);
    }

    const hash = createHash(text);

    if (hash === lastHash) {
      return res.sendStatus(200);
    }

    lastHash = hash;

    const tag = getTag(text);

    const message = `
${tag}

${title}

${text.substring(0, 700)}

${url}
`;

    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text: message
      }
    );

    res.sendStatus(200);

  } catch (err) {
    console.error(err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
