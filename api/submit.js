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
  const stage = body.stage;
  if (stage !== "details" && stage !== "contact") {
    return res.status(400).json({ error: "Invalid submission step." });
  }
  const fields = {
    name: cleanField(body.name, 600),
    surname: cleanField(body.surname, 80),
    surnameDetails: cleanField(body.surnameDetails, 1000),
    favoriteColour: cleanField(body.favoriteColour, 40),
    favoriteColourReason: cleanField(body.favoriteColourReason, 1000),
    email: cleanField(body.email, 254),
    topic: cleanField(body.topic, 120),
  };
  const submitted = ["name", "surname", "favoriteColour"]
    .filter((fieldName) => fields[fieldName])
    .map((fieldName) => [fieldName, fields[fieldName]]);
  if (submitted.length !== 1) {
    return res.status(400).json({ error: "Please submit one completed section at a time." });
  }
  if (stage === "contact" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }
  const [fieldName, fieldValue] = submitted[0];
  if ((fieldName === "surname" && !fields.surnameDetails) ||
      (fieldName !== "surname" && fields.surnameDetails) ||
      (fieldName === "favoriteColour" && !fields.favoriteColourReason) ||
      (fieldName !== "favoriteColour" && fields.favoriteColourReason)) {
    return res.status(400).json({ error: "Please complete the fields for your selected section only." });
  }
  const label = fieldName === "favoriteColour" ? "Favorite colour" : fieldName === "name" ? "Name" : "Surname";

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

    const detailLines = [
      ...(fields.topic ? [`Topic: ${fields.topic}`] : []),
      "",
      `${label}: ${fieldValue}`,
      ...(fieldName === "surname" ? [`Additional details: ${fields.surnameDetails}`] : []),
      ...(fieldName === "favoriteColour" ? [`Why is it their favorite?: ${fields.favoriteColourReason}`] : []),
    ];
    await transporter.sendMail({
      from: SMTP_USER,
      to: RECIPIENT_EMAIL,
      ...(stage === "contact" ? { replyTo: fields.email } : {}),
      subject: stage === "details" ? "New support request details" : "Support request contact email",
      text: [
        stage === "details" ? "A visitor submitted support request details:" : "A visitor provided a contact email for their support request:",
        ...(stage === "contact" ? ["", `Visitor email: ${fields.email}`, "", "Related request details:"] : []),
        ...detailLines,
      ].join("\n"),
    });

    return res
      .status(200)
      .json({ message: stage === "details" ? "Your details have been sent to support." : "Your email has been sent to support." });
  } catch (error) {
    console.error("Unable to send form submission:", error.message);
    return res.status(502).json({
      error: "We could not send your response. Please try again later.",
    });
  }
};
