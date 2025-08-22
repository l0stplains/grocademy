import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private redis: RedisService) {}

  private makeKey(prefix: string, version: number, suffix: string) {
    return `cache:${prefix}:v${version}:${suffix}`;
  }

  async getVersion(name: string) {
    return this.redis.getVersion(name);
  }
  async bump(name: string) {
    return this.redis.bumpVersion(name);
  }

  async wrap<T>(
    prefix: string,
    versionName: string,
    keySuffix: string,
    ttlSec: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const v = await this.redis.getVersion(versionName);
    const key = this.makeKey(prefix, v, keySuffix);
    const cached = await this.redis.get<T>(key);
    if (cached !== null) return cached;
    const data = await loader();
    await this.redis.set(key, data, ttlSec);
    return data;
  }
}
