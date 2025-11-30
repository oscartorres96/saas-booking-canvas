/* eslint-disable @typescript-eslint/no-var-requires */
// Thin TS wrapper around the plain JS helper so Nest services can import typed functions.
const { sendEmail: sendEmailJs } = require('../../utils/email');

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await sendEmailJs(options.to, options.subject, options.html, options.from);
  } catch (error) {
    console.error('[email] send failed:', error);
  }
};

export const validateEmailConfig = (): boolean => {
  const required = ['SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`[email] Missing SMTP configuration: ${missing.join(', ')}`);
    return false;
  }

  return true;
};
