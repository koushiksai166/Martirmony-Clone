/**
 * ============================================================================
 * EMAIL SERVICE
 * ============================================================================
 * Handles sending transactional emails (like Welcome emails) using Nodemailer.
 * 
 * Configuration:
 * Supports standard SMTP config (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * OR Gmail app-password shorthand (EMAIL_USER, EMAIL_PASS).
 * If neither is configured in .env, emails are gracefully disabled.
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const {
      // Generic SMTP
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      // Gmail shorthand (existing .env keys)
      EMAIL_USER,
      EMAIL_PASS,
    } = process.env;

    // 1. Try standard SMTP first
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT ?? 587),
        secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      this.logger.log(`Email configured via SMTP (${SMTP_HOST})`);
    } 
    // 2. Fall back to Gmail shorthand
    else if (EMAIL_USER && EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      });
      this.logger.log(`Email configured via Gmail (${EMAIL_USER})`);
    } 
    // 3. Gracefully disable if no config is found
    else {
      this.logger.warn('SMTP not configured — emails are disabled');
    }
  }

  /**
   * Fires a Welcome email to the newly registered user.
   * This method catches and logs its own errors so that a failure here
   * doesn't abort the user registration transaction.
   */
  async sendWelcome(to: string, firstName: string): Promise<void> {
    if (!this.transporter) return; // Exit silently if emails aren't configured

    // Determine the sender address
    const from = process.env.SMTP_FROM ?? process.env.EMAIL_USER ?? process.env.SMTP_USER;
    
    try {
      await this.transporter.sendMail({
        from: `"Vivah" <${from}>`,
        to,
        subject: 'Welcome to Vivah 🌸',
        html: welcomeTemplate(firstName),
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Welcome email failed for ${to}: ${(err as Error).message}`);
    }
  }
}

/**
 * Returns a static, inline-styled HTML template for the Welcome email.
 * Inline CSS is required because most email clients strip <style> blocks.
 */
function welcomeTemplate(firstName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#fdf6f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f0;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr><td style="background:#1a1a2e;padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#d9ad71;font-size:32px;letter-spacing:2px;">Vivah</h1>
          <p style="margin:8px 0 0;color:#ffffff99;font-size:13px;letter-spacing:1px;">WHERE HEARTS MEET</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:24px;">Welcome, ${firstName}! 🌸</h2>
          <p style="color:#555;line-height:1.7;margin:0 0 20px;">Your journey to finding a meaningful connection begins today. We're honoured to have you as part of the Vivah family.</p>
          <p style="color:#555;line-height:1.7;margin:0 0 32px;">Complete your profile to help us find your best matches.</p>
          <a href="${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/profile/create"
             style="display:inline-block;background:#1a1a2e;color:#d9ad71;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;letter-spacing:.5px;">
            Complete Your Profile →
          </a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #f0e8e0;text-align:center;">
          <p style="margin:0;color:#aaa;font-size:12px;">© ${new Date().getFullYear()} Vivah. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
