// queues.config.ts
import { BullModuleOptions } from '@nestjs/bull';
import { RedisConfigService } from '@weats/configs/redis-config.service';

export const bullConfigFactory = async (
    redisConfig: RedisConfigService,
): Promise<BullModuleOptions> => ({
    redis: redisConfig.getConnectionOptions('jobs'),

    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
