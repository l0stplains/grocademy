import { Injectable } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class PollingService {
  constructor(private redis: RedisService) {}

  async currentCoursesVersion() {
    return this.redis.getVersion('courses');
  }
  async waitCoursesSince(since: number, timeoutMs = 25000) {
    return this.redis.waitForBump('courses', since, timeoutMs);
  }

  async currentModulesVersion(courseId: number) {
    return this.redis.getVersion(`modules:${courseId}`);
  }
  async waitModulesSince(courseId: number, since: number, timeoutMs = 25000) {
    return this.redis.waitForBump(`modules:${courseId}`, since, timeoutMs);
  }
}
