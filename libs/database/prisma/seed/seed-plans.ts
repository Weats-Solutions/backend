import 'dotenv/config';
import { PrismaClient } from '../core/generated/core';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.CORE_DB_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    // ======================
    // FEATURES (upsert safe)
    // ======================
    const features = [
        // 
        { name: 'menu', type: 'QUANTITY', showInPlans: false },
        { name: 'languages', type: 'QUANTITY', showInPlans: false },
        { name: 'menu_settings', type: 'BOOLEAN', showInPlans: false },
        { name: 'points', type: 'QUANTITY', showInPlans: true },
        { name: 'zones', type: 'QUANTITY', showInPlans: true },
        { name: 'products', type: 'QUANTITY', showInPlans: true },
        { name: 'custom_variants', type: 'QUANTITY', showInPlans: true },
        { name: 'custom_addons', type: 'QUANTITY', showInPlans: true },
        { name: 'livechat', type: 'BOOLEAN', showInPlans: true },
        { name: 'templates_builder', type: 'BOOLEAN', showInPlans: true },
        { name: 'metadata', type: 'BOOLEAN', showInPlans: true },
        { name: 'devices', type: 'BOOLEAN', showInPlans: true },
        { name: 'employees', type: 'BOOLEAN', showInPlans: true },
        { name: 'marketplace', type: 'BOOLEAN', showInPlans: true },
        { name: 'ai', type: 'BOOLEAN', showInPlans: true },
        { name: 'images', type: 'QUANTITY', showInPlans: true },
        { name: 'monthly_emails', type: 'QUANTITY', showInPlans: true },
        // Functions
        { name: 'takeaway', type: 'BOOLEAN', showInPlans: true },
        { name: 'booking', type: 'BOOLEAN', showInPlans: true },
    ];

    for (const f of features) {
        await prisma.feature.upsert({
            where: { name: f.name },
            update: { showInPlans: f.showInPlans },
            create: {
                name: f.name,
                type: f.type as any,
                showInPlans: f.showInPlans,
            },
        });
    }

    // ======================
    // PLANS
    // ======================
    const plans = [
        {
            name: 'Weats Start',
            cycles: [
                { price: 49.99, priceId: 'price_1TZYLgCsiqCEyBVBlAjqQ6mE', cycle: 'MONTHLY' },
                { price: 134.99, priceId: 'price_1TZYLgCsiqCEyBVBNO7ofcuh', cycle: 'TIMESTRAL' },
            ],
            features: {
                menu: 1,
                languages: 1,
                points: 100,
                zones: 3,
                products: 125,
                custom_variants: 25,
                custom_addons: 15,
                images: 100,
                templates_builder: true,
                livechat: true,
                metadata: false,
            },
        },
        {
            name: 'Weats Plus',
            cycles: [
                { price: 149.99, priceId: 'price_1SOjbgELJnossyvmruC7yY2r', cycle: 'MONTHLY' },
                { price: 404.99, priceId: 'price_1SOjfnELJnossyvmB3wg7YZH', cycle: 'TIMESTRAL' },
            ],
            features: {
                menu: 3,
                languages: 3,
                points: 250,
                zones: 10,
                products: 300,
                custom_variants: 100,
                custom_addons: 85,
                images: 250,
                templates_builder: true,
                livechat: true,
                metadata: true,
            },
        },
        {
            name: 'Weats Pro',
            cycles: [
                { price: 199.99, priceId: 'price_1SOjgnELJnossyvmGL2tjEFm', cycle: 'MONTHLY' },
                { price: 539.99, priceId: 'price_1SOjhCELJnossyvmrlr5ecrC', cycle: 'TIMESTRAL' },
            ],
            features: {
                menu: 10,
                languages: 6,
                points: 500,
                zones: 25,
                products: 550,
                custom_variants: 250,
                custom_addons: 150,
                images: 500,
                templates_builder: true,
                livechat: true,
                metadata: true,
            },
        },
    ];

    for (const p of plans) {
        // find or create plan
        let plan = await prisma.plan.findFirst({
            where: { name: p.name },
        });

        if (!plan) {
            plan = await prisma.plan.create({
                data: { name: p.name },
            });
        }

        // ======================
        // RESET FEATURES (safe)
        // ======================
        await prisma.planFeature.deleteMany({
            where: { planId: plan.id },
        });

        for (const featureName of Object.keys(p.features)) {
            const feature = await prisma.feature.findUnique({
                where: { name: featureName },
            });
            if (!feature) continue;

            const rawValue = p.features[featureName];

            const valueQuantity =
                typeof rawValue === 'number' ? rawValue : null;

            const valueBoolean =
                typeof rawValue === 'boolean' ||
                    rawValue === 0 ||
                    rawValue === 1
                    ? !!rawValue
                    : null;

            await prisma.planFeature.create({
                data: {
                    planId: plan.id,
                    featureId: feature.id,
                    valueQuantity,
                    valueBoolean,
                },
            });
        }

        // ======================
        // PLAN CYCLES (SAFE UPSERT)
        // NÃO apagar (há subscriptions)
        // ======================
        for (const cycle of p.cycles) {
            await prisma.planCycle.upsert({
                where: { priceId: cycle.priceId },
                update: {
                    price: cycle.price,
                    cycle: cycle.cycle as any,
                    planId: plan.id, // garante ligação correta
                },
                create: {
                    planId: plan.id,
                    price: cycle.price,
                    priceId: cycle.priceId,
                    cycle: cycle.cycle as any,
                },
            });
        }
    }

    console.log('✅ Plans synced successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });