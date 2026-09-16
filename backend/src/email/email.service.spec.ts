import { EmailService } from './email.service';

describe('EmailService', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('does not throw when SMTP is not configured', async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    const service = new EmailService();
    await expect(service.sendWelcome('test@example.com', 'Test')).resolves.toBeUndefined();
  });

  it('does not throw when transporter send fails', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    const service = new EmailService();
    // Force transporter to fail
    (service as any).transporter = {
      sendMail: jest.fn().mockRejectedValue(new Error('SMTP error')),
    };
    await expect(service.sendWelcome('test@example.com', 'Test')).resolves.toBeUndefined();
  });
});
