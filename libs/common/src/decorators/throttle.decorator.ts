import { SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_LIMITS } from '@weats/common';

export const ThrottleStrict = () =>
  Throttle({
    default: {
      limit: THROTTLE_LIMITS.STRICT.limit,
      ttl: THROTTLE_LIMITS.STRICT.ttl,
    },
  });

export const ThrottleVeryStrict = () =>
  Throttle({
    default: {
      limit: THROTTLE_LIMITS.VERY_STRICT.limit,
      ttl: THROTTLE_LIMITS.VERY_STRICT.ttl,
    },
  });

export const ThrottleLenient = () =>
  Throttle({
    default: {
      limit: THROTTLE_LIMITS.LENIENT.limit,
      ttl: THROTTLE_LIMITS.LENIENT.ttl,
    },
  });

export const ThrottlePublic = () =>
  Throttle({
    default: {
      limit: THROTTLE_LIMITS.PUBLIC.limit,
      ttl: THROTTLE_LIMITS.PUBLIC.ttl,
    },
  });

export const ThrottleRead = () =>
  Throttle({
    default: {
      limit: THROTTLE_LIMITS.READ.limit,
      ttl: THROTTLE_LIMITS.READ.ttl,
    },
  });

export const ThrottleWrite = () =>
  Throttle({
    default: {
      limit: THROTTLE_LIMITS.WRITE.limit,
      ttl: THROTTLE_LIMITS.WRITE.ttl,
    },
  });

export const ThrottleUpload = () =>
  Throttle({
    default: {
      limit: THROTTLE_LIMITS.UPLOAD.limit,
      ttl: THROTTLE_LIMITS.UPLOAD.ttl,
    },
  });

export const ThrottleJobs = () =>
  Throttle({
    default: {
      limit: THROTTLE_LIMITS.JOBS.limit,
      ttl: THROTTLE_LIMITS.JOBS.ttl,
    },
  });

export const SKIP_THROTTLE_KEY = 'skipThrottle';

export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);
