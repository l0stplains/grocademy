import { Injectable } from '@nestjs/common';
import { IStorageService } from './storage.types';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class R2StorageService implements IStorageService {
  private s3: S3Client;
  private bucket: string;
  private publicBase?: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID!;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
    this.bucket = process.env.R2_BUCKET!;
    this.publicBase = process.env.R2_PUBLIC_BASE || undefined;

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  async upload({
    buffer,
    key,
    contentType,
  }: {
    buffer: Buffer;
    key: string;
    contentType?: string;
  }) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
      }),
    );
    const url = this.getPublicUrl(key);
    return { key, url };
  }

  async removeByKey(key: string) {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async removeByUrl(url: string) {
    if (!url) return;
    if (this.publicBase && url.startsWith(this.publicBase)) {
      const key = url.slice(this.publicBase.length + 1); // strip trailing '/'
      await this.removeByKey(key);
      return;
    }
  }

  getPublicUrl(key: string): string {
    if (this.publicBase) return `${this.publicBase}/${key}`;
    return ''; // prefer getSignedUrl() if no public base
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (this.publicBase) return `${this.publicBase}/${key}`;
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, cmd, { expiresIn });
  }
}
