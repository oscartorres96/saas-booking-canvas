const nodemailer = require('nodemailer');

// Create the SMTP transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Basic helper to send an email.
 * @param {string|string[]} to - Recipient email or list
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @param {string} [from] - Optional custom from address
 */
const sendEmail = async (to, subject, html, from) => {
  const transporter = createTransporter();
  const fromAddress = from || process.env.SMTP_FROM || process.env.SMTP_USER;

  const mailOptions = {
    from: fromAddress,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[email] sent ${info.messageId} to ${mailOptions.to}`);
  } catch (error) {
    console.error('[email] send failed:', error.message || error);
  }
};

module.exports = {
  sendEmail,
  createTransporter,
};
