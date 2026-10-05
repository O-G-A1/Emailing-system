require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const path = require("node:path");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many submissions. Please try again in a few minutes.",
  },
});

function cleanField(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

function getMailConfiguration() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, RECIPIENT_EMAIL } =
    process.env;
  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !RECIPIENT_EMAIL
  ) {
    return null;
  }

  const portNumber = Number(SMTP_PORT);
  if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
    return null;
  }

  return {
    host: SMTP_HOST,
    port: portNumber,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  };
}

app.post("/api/submit", submitLimiter, async (req, res) => {
  const name = cleanField(req.body?.name, 80);
  const surname = cleanField(req.body?.surname, 80);
  const favoriteColour = cleanField(req.body?.favoriteColour, 40);

  if (!name || !surname || !favoriteColour) {
    return res.status(400).json({ error: "Please complete all three fields." });
  }

  const mailConfiguration = getMailConfiguration();
  if (!mailConfiguration) {
    console.error(
      "Email delivery is not configured. Check the server environment variables.",
    );
    return res
      .status(503)
      .json({
        error: "Email service is not configured yet. Please try again later.",
      });
  }

  try {
    const transporter = nodemailer.createTransport(mailConfiguration);
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: "New form submission",
      text: [
        "A visitor submitted the form:",
        "",
        `Name: ${name}`,
        `Surname: ${surname}`,
        `Favorite colour: ${favoriteColour}`,
      ].join("\n"),
    });

    return res
      .status(200)
      .json({ message: "Thanks! Your response has been sent." });
  } catch (error) {
    console.error("Unable to send form submission:", error.message);
    return res
      .status(502)
      .json({
        error: "We could not send your response. Please try again later.",
      });
  }
});

app.listen(port, () => {
  console.log(`Form server listening on http://localhost:${port}`);
});
