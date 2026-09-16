import { BadRequestException } from '@nestjs/common';
import { imageFileFilter, uploadLimits } from './upload.storage';

function makeFile(mimetype: string): Express.Multer.File {
  return { mimetype } as Express.Multer.File;
}

describe('imageFileFilter', () => {
  it('accepts image/jpeg', (done) => {
    imageFileFilter({}, makeFile('image/jpeg'), (err, ok) => {
      expect(err).toBeNull();
      expect(ok).toBe(true);
      done();
    });
  });

  it('accepts image/png', (done) => {
    imageFileFilter({}, makeFile('image/png'), (err, ok) => {
      expect(err).toBeNull();
      expect(ok).toBe(true);
      done();
    });
  });

  it('accepts image/webp', (done) => {
    imageFileFilter({}, makeFile('image/webp'), (err, ok) => {
      expect(err).toBeNull();
      expect(ok).toBe(true);
      done();
    });
  });

  it('rejects image/gif', (done) => {
    imageFileFilter({}, makeFile('image/gif'), (err, ok) => {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(ok).toBe(false);
      done();
    });
  });

  it('rejects application/pdf', (done) => {
    imageFileFilter({}, makeFile('application/pdf'), (err, ok) => {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(ok).toBe(false);
      done();
    });
  });
});

describe('uploadLimits', () => {
  it('enforces 5 MB max file size', () => {
    expect(uploadLimits.fileSize).toBe(5 * 1024 * 1024);
  });
});
