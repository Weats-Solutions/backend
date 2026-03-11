import { SubscriptionStatus } from "@weats/database";

export interface Subscription {
    status: SubscriptionStatus;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    canceledAt: Date | null;
    cancelAt: Date | null;
}
