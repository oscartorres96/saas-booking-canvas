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
  const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS;
  const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;

  if (!hasSmtpConfig && !hasEmailConfig) {
    console.warn('[email] Missing email configuration: SMTP_USER/EMAIL_USER and SMTP_PASS/EMAIL_PASS required');
    return false;
  }

  return true;
};
