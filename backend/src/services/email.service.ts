import nodemailer from 'nodemailer';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (config.smtpHost) {
      transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      });
      logger.info(`SMTP transporter created: ${config.smtpHost}:${config.smtpPort}`);
    } else {
      transporter = nodemailer.createTransport({ jsonTransport: true });
      logger.info('SMTP not configured — using JSON transport (emails logged to console)');
    }
  }
  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const t = getTransporter();
  const info = await t.sendMail({
    from: config.smtpFrom,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  if (config.nodeEnv === 'development') {
    logger.debug(`Email sent to ${options.to}: "${options.subject}"`);
    if (info.messageId) {
      logger.debug(`Message ID: ${info.messageId}`);
    }
    if ((info as any).message) {
      logger.debug(`Email body preview:\n${(info as any).message}`);
    }
  }
}

export function createEmail2faCode(): string {
  const length = config.email2faCodeLength;
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export function buildEmail2faBody(code: string): { text: string; html: string } {
  const text = [
    `Your VaultLock verification code is: ${code}`,
    '',
    'This code expires in 5 minutes.',
    'If you did not request this code, please ignore this email.',
    '',
    '— VaultLock Security Team',
  ].join('\n');

  const html = [
    '<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px;">',
    '  <div style="text-align: center; margin-bottom: 24px;">',
    '    <h1 style="font-size: 20px; color: #0a0a0b; margin: 0;">VaultLock</h1>',
    '    <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">Verification Code</p>',
    '  </div>',
    '  <div style="background: #ffffff; border-radius: 8px; padding: 24px; text-align: center; border: 1px solid #e5e7eb;">',
    `    <p style="font-size: 36px; letter-spacing: 8px; font-weight: 700; color: #0a0a0b; margin: 0;">${code}</p>`,
    '    <p style="color: #6b7280; font-size: 14px; margin: 16px 0 0;">This code expires in 5 minutes.</p>',
    '  </div>',
    '  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">',
    '    If you did not request this code, please ignore this email.',
    '  </p>',
    '</div>',
  ].join('\n');

  return { text, html };
}
