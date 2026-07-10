const nodemailer = require("nodemailer");

// ===== Email transporter (Nodemailer) =====
let transporter = null;
const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
};

// ===== SMS client (Twilio) - optional, mocked if no credentials =====
let twilioClient = null;
const getTwilioClient = () => {
  if (twilioClient) return twilioClient;
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;

  const twilio = require("twilio");
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return twilioClient;
};

const sendEmail = async (to, subject, text) => {
  const t = getTransporter();
  if (!t) {
    console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | ${text}`);
    return { mocked: true };
  }
  try {
    await t.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
    return { mocked: false, sent: true };
  } catch (error) {
    console.error(`Email send failed to ${to}: ${error.message}`);
    return { mocked: false, sent: false, error: error.message };
  }
};

const sendSMS = async (to, body) => {
  const client = getTwilioClient();
  if (!client) {
    console.log(`[MOCK SMS] To: ${to} | ${body}`);
    return { mocked: true };
  }
  try {
    await client.messages.create({ body, from: process.env.TWILIO_PHONE_NUMBER, to });
    return { mocked: false, sent: true };
  } catch (error) {
    console.error(`SMS send failed to ${to}: ${error.message}`);
    return { mocked: false, sent: false, error: error.message };
  }
};

/**
 * Notify a list of TrustedContact documents about an SOS alert.
 * Respects each contact's notifyBy preference (sms/email/push).
 */
const notifyTrustedContacts = async (contacts, alert, user) => {
  const levelLabel = { 1: "Feeling Unsafe", 2: "Need Help", 3: "EMERGENCY" }[alert.level];
  const mapsLink = `https://www.google.com/maps?q=${alert.currentLocation.coordinates[1]},${alert.currentLocation.coordinates[0]}`;
  const message =
    `${user.name} triggered a Level ${alert.level} (${levelLabel}) safety alert. ` +
    `Location: ${alert.address || "unknown"}. Live map: ${mapsLink}`;

  const results = await Promise.allSettled(
    contacts.map(async (contact) => {
      const tasks = [];
      if (contact.notifyBy.includes("sms")) tasks.push(sendSMS(contact.phone, message));
      if (contact.notifyBy.includes("email") && contact.email)
        tasks.push(sendEmail(contact.email, `Safety Alert: ${user.name} needs help`, message));
      // "push" would hook into FCM/APNs in a real mobile app build
      await Promise.all(tasks);
      return contact._id;
    })
  );

  return results;
};

/**
 * Simulated police / emergency services notification.
 * In production this would call a real dispatch integration or webhook.
 */
const notifyPolice = async (alert, user) => {
  if (process.env.EMERGENCY_WEBHOOK_URL) {
    try {
      const axios = require("axios");
      await axios.post(process.env.EMERGENCY_WEBHOOK_URL, {
        userName: user.name,
        userPhone: user.phone,
        location: alert.currentLocation.coordinates,
        address: alert.address,
        level: alert.level,
        timestamp: new Date().toISOString(),
      });
      return { simulated: false, dispatched: true };
    } catch (error) {
      console.error(`Police webhook failed: ${error.message}`);
      return { simulated: false, dispatched: false, error: error.message };
    }
  }

  console.log(
    `[SIMULATED POLICE ALERT] ${user.name} (${user.phone}) - Level 3 Emergency at ${alert.address}`
  );
  return { simulated: true, dispatched: true };
};

module.exports = { sendEmail, sendSMS, notifyTrustedContacts, notifyPolice };
