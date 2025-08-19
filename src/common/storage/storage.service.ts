export interface IStorageService {
  save(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ url: string; key: string }>;
  removeByUrl(url: string): Promise<void>;
}
