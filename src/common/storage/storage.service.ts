export interface IStorageService {
  save(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ url: string; key: string }>;
  saveBuffer(
    buf: Buffer,
    filename: string,
    folder: string,
    mimetype?: string,
  ): Promise<{ url: string; key: string }>;
  removeByUrl(url: string): Promise<void>;
}
