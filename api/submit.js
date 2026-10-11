const nodemailer = require("nodemailer");

function cleanField(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const body = req.body || {};
  const name = cleanField(body.name, 80);
  const surname = cleanField(body.surname, 80);
  const favoriteColour = cleanField(body.favoriteColour, 40);

  if (!name || !surname || !favoriteColour) {
    return res.status(400).json({ error: "Please complete all three fields." });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, RECIPIENT_EMAIL } =
    process.env;

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !RECIPIENT_EMAIL
  ) {
    console.error("Email delivery is not configured.");
    return res.status(503).json({
      error: "Email service is not configured yet. Please try again later.",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    await transporter.sendMail({
      from: SMTP_USER,
      to: RECIPIENT_EMAIL,
      subject: "New form submission",
      text: [
        "A user submitted the form:",
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
    return res.status(502).json({
      error: "We could not send your response. Please try again later.",
    });
  }
};
