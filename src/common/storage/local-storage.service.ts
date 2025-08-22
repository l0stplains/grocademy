import { Injectable } from '@nestjs/common';
import { IStorageService } from './storage.service';
import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { randomUUID } from 'crypto';

function sanitize(name: string) {
  const base = basename(name).replace(/[^\w.\-]+/g, '_');
  return base.replace(/_+/g, '_');
}

@Injectable()
export class LocalStorageService implements IStorageService {
  private publicRoot = join(process.cwd(), 'public');

  async upload(params: { buffer: Buffer; key: string; contentType?: string }) {
    // Note: size limit set up in mutler on controller level yak
    const key = params.key.replace(/^\/+|\\+/g, '');
    const abs = join(this.publicRoot, 'uploads', key);
    await fs.mkdir(dirname(abs), { recursive: true });
    await fs.writeFile(abs, params.buffer);
    const url = this.getPublicUrl(key);
    return { key, url };
  }

  async removeByKey(key: string) {
    const rel = key.startsWith('uploads/') ? key : `uploads/${key}`;
    const abs = join(this.publicRoot, rel);
    try {
      await fs.unlink(abs);
    } catch {
      /* ignore missing */
    }
  }

  async removeByUrl(url: string) {
    const prefix = '/static/uploads/';
    if (!url || !url.startsWith(prefix)) return;
    const key = url.slice(prefix.length);
    await this.removeByKey(key);
  }

  getPublicUrl(key: string): string {
    const rel = key.replace(/^\/+|\\+/g, '');
    return `/static/uploads/${rel}`;
  }

  async getSignedUrl(key: string, _expiresIn = 3600): Promise<string> {
    return this.getPublicUrl(key);
  }

  async save(file: Express.Multer.File, folder: string) {
    const ext = extname(file.originalname) || '';
    const safeName = sanitize(file.originalname.replace(ext, ''));
    const key = `${folder}/${Date.now()}-${randomUUID()}-${safeName}${ext}`;
    return this.upload({
      buffer: file.buffer,
      key,
      contentType: file.mimetype,
    });
  }

  async saveBuffer(buf: Buffer, filename: string, folder: string) {
    const ext = extname(filename) || '';
    const safeName = sanitize(filename.replace(ext, ''));
    const key = `${folder}/${Date.now()}-${randomUUID()}-${safeName}${ext}`;
    return this.upload({ buffer: buf, key, contentType: undefined });
  }
}
