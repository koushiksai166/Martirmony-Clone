import { EmailService } from './email.service';

describe('EmailService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('does not throw when no SMTP vars are set', async () => {
    const service = new EmailService();
    await expect(service.sendWelcome('test@example.com', 'Test')).resolves.toBeUndefined();
  });

  it('creates transporter when EMAIL_USER and EMAIL_PASS are set (Gmail)', () => {
    process.env.EMAIL_USER = 'user@gmail.com';
    process.env.EMAIL_PASS = 'app-password';
    const service = new EmailService();
    expect((service as any).transporter).not.toBeNull();
  });

  it('creates transporter when SMTP_HOST/USER/PASS are set', () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    const service = new EmailService();
    expect((service as any).transporter).not.toBeNull();
  });

  it('does not throw when transporter send fails', async () => {
    process.env.EMAIL_USER = 'user@gmail.com';
    process.env.EMAIL_PASS = 'app-password';
    const service = new EmailService();
    (service as any).transporter = {
      sendMail: jest.fn().mockRejectedValue(new Error('SMTP error')),
    };
    await expect(service.sendWelcome('test@example.com', 'Test')).resolves.toBeUndefined();
  });
});
