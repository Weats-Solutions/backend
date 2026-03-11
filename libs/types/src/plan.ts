export type PlanCycleKey = "MONTHLY" | "TIMESTRAL" | string;

export interface PlanCycle {
    id: string;
    price: number;
}

export type PlanCycles = Record<PlanCycleKey, PlanCycle>;

export type PlanFeatureType = "BOOLEAN" | "QUANTITY";

export interface PlanFeature {
    name: string;
    type: PlanFeatureType;
    valueBoolean: boolean | null;
    valueQuantity: number | null;
}

export interface Plan {
    id: string;
    name: string;
    price: number;
    cycles: PlanCycles;
    features: PlanFeature[];
}
