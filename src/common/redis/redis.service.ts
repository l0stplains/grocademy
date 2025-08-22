import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { Logger } from '@nestjs/common';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private sub: Redis;

  constructor() {
    const logger = new Logger('RedisService');
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    const opts: RedisOptions = {
      lazyConnect: false,
      maxRetriesPerRequest: null,
    };
    this.client = new Redis(url, opts);
    this.sub = new Redis(url, opts);

    this.client.on('connect', () => logger.log(`Connected to Redis at ${url}`));
    this.client.on('error', (e) => logger.error(`Redis error: ${e.message}`));
    this.sub.on('connect', () => logger.log(`Subscribed to Redis at ${url}`));
    this.sub.on('error', (e) =>
      logger.error(`Redis subscription error: ${e.message}`),
    );

    this.client.info().then((info) => {
      const m = info.match(/run_id:(.*)\r\n/);
      if (m) {
        logger.log(`Redis server run_id: ${m[1]}`);
      } else {
        logger.warn('Could not retrieve Redis server run_id');
      }
    });
  }

  // KV
  async get<T = any>(key: string): Promise<T | null> {
    const v = await this.client.get(key);
    return v ? JSON.parse(v) : null;
    // Note: for primitives, still fine because JSON.parse("123") -> 123
  }
  async set(key: string, value: any, ttlSec?: number) {
    const payload = JSON.stringify(value);
    if (ttlSec && ttlSec > 0) await this.client.set(key, payload, 'EX', ttlSec);
    else await this.client.set(key, payload);
  }
  async del(key: string) {
    await this.client.del(key);
  }

  // versions (monotonic counters) + PubSub
  async getVersion(name: string): Promise<number> {
    const v = await this.client.get(`v:${name}`);
    if (!v) {
      await this.client.set(`v:${name}`, '1');
      return 1;
    }
    return Number(v);
  }
  async bumpVersion(name: string): Promise<number> {
    const v = await this.client.incr(`v:${name}`);
    await this.client.publish(`ch:v:${name}`, String(v));
    return v;
  }

  // longpoll helper
  async waitForBump(
    name: string,
    since: number,
    timeoutMs = 25000,
  ): Promise<number> {
    const current = await this.getVersion(name);
    if (current > since) return current;

    return new Promise<number>((resolve) => {
      const channel = `ch:v:${name}`;
      let done = false;
      const onMessage = (_: string, message: string) => {
        const newest = Number(message);
        if (!done && newest > since) {
          done = true;
          this.sub.off('message', onMessage);
          resolve(newest);
        }
      };
      this.sub.on('message', onMessage);
      this.sub.subscribe(channel).then(() => {
        setTimeout(() => {
          if (!done) {
            done = true;
            this.sub.off('message', onMessage);
            resolve(current);
          }
        }, timeoutMs);
      });
    });
  }

  onModuleDestroy() {
    this.client.quit();
    this.sub.quit();
  }
}
