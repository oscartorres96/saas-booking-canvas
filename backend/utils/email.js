const nodemailer = require('nodemailer');

// Create the SMTP transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587),
    secure: (process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true') || (process.env.SMTP_PORT === '465' || process.env.EMAIL_PORT === '465'),
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
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
  const fromAddress = from || process.env.SMTP_FROM || process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || process.env.EMAIL_USER;

  const mailOptions = {
    from: fromAddress,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
  };

  try {
    console.log(`[email] Attempting to send email to: ${to}, subject: ${subject}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('[email] Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('[email] send failed for:', to);
    console.error('[email] error details:', error.message || error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  createTransporter,
};
