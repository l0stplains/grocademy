export const STORAGE_TOKEN = 'STORAGE_TOKEN';

export interface IStorageService {
  upload(params: {
    buffer: Buffer;
    key: string; // relative key like "thumbnails/123.png"
    contentType?: string;
  }): Promise<{ key: string; url: string }>;

  removeByKey(key: string): Promise<void>;
  removeByUrl(url: string): Promise<void>;

  getPublicUrl(key: string): string; // may return signed URL if accidentally no public base
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
