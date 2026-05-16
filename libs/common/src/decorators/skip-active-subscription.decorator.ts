import { SetMetadata } from '@nestjs/common';

export const SKIP_ACTIVE_SUBSCRIPTION_KEY = 'skipActiveSubscription';
export const SkipActiveSubscription = () => SetMetadata(SKIP_ACTIVE_SUBSCRIPTION_KEY, true);
