# Email form

A small web form that collects a name, surname, and favorite colour, then emails those values to a fixed recipient. The app does not store submissions in a database.

## Requirements

- Node.js 20 or newer
- SMTP credentials from an email provider

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Fill in the SMTP host, port, username, password, and the destination `RECIPIENT_EMAIL` in `.env`. Keep `.env` private and never commit it.
4. Start the app with `npm start` (or use `npm run dev` while developing).
5. Open `http://localhost:3000` in a browser.

For port 465, set `SMTP_PORT=465` and `SMTP_SECURE=true`. For most providers using port 587, use `SMTP_SECURE=false` and STARTTLS is negotiated by Nodemailer.

The destination is configured server-side; it is never accepted from the browser. The endpoint validates required fields, limits request size, and rate-limits repeated submissions. SMTP errors are logged on the server, while generic errors are returned to visitors.

## Deployment notes

Set the same environment variables in your hosting provider’s secret/configuration settings. Serve the site over HTTPS in production, choose an SMTP provider that permits application sending, and review applicable privacy requirements before collecting or forwarding personal data. The app sends the submitted values by email, so ensure the recipient mailbox is appropriate for that information.
