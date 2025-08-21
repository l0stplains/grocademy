import { Injectable } from '@nestjs/common';
import { IStorageService } from './storage.service';
import { promises as fs } from 'fs';
import { join, basename, extname } from 'path';
import { randomUUID } from 'crypto';

function sanitize(name: string) {
  const base = basename(name).replace(/[^\w.\-]+/g, '_');
  return base.replace(/_+/g, '_');
}

@Injectable()
export class LocalStorageService implements IStorageService {
  private publicRoot = join(process.cwd(), 'public');

  private async writeFile(
    buffer: Buffer,
    folder: string,
    originalname: string,
  ) {
    // Note: size limit set up in mutler on controller level yak
    const dir = join(this.publicRoot, 'uploads', folder);
    await fs.mkdir(dir, { recursive: true });

    const ext = extname(originalname) || '';
    const safeName = sanitize(originalname.replace(ext, ''));
    const filename = `${Date.now()}-${randomUUID()}-${safeName}${ext}`;

    const full = join(dir, filename);
    await fs.writeFile(full, buffer);

    const url = `/static/uploads/${folder}/${filename}`;
    return { url, key: `uploads/${folder}/${filename}` };
  }

  async save(file: Express.Multer.File, folder: string) {
    return this.writeFile(file.buffer, folder, file.originalname);
  }

  async saveBuffer(buf: Buffer, filename: string, folder: string) {
    return this.writeFile(buf, folder, filename);
  }

  async removeByUrl(url: string) {
    if (!url.startsWith('/static/')) return;
    const p = url.replace('/static/', '');
    const full = join(this.publicRoot, p);
    try {
      await fs.unlink(full);
    } catch {
      /* ignore */
    }
  }
}
