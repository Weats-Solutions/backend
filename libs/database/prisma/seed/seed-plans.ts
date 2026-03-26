import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.CORE_DB_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    // Features definitions 
    const features = [
        { name: 'menu', type: 'QUANTITY', showInPlans: false }, // Technical, don't show
        { name: 'languages', type: 'QUANTITY', showInPlans: false }, // Technical, don't show
        { name: 'menu_settings', type: 'BOOLEAN', showInPlans: false }, // Internal
        { name: 'booking', type: 'BOOLEAN', showInPlans: true }, // User-facing
        { name: 'points', type: 'QUANTITY', showInPlans: true }, // User-facing
        { name: 'livechat', type: 'BOOLEAN', showInPlans: true }, // User-facing
        { name: 'templates', type: 'BOOLEAN', showInPlans: true }, // User-facing
        { name: 'takeaway', type: 'BOOLEAN', showInPlans: true }, // User-facing
        { name: 'devices', type: 'BOOLEAN', showInPlans: true }, // User-facing
        { name: 'employees', type: 'BOOLEAN', showInPlans: true }, // User-facing
        { name: 'zones', type: 'BOOLEAN', showInPlans: true }, // User-facing
        { name: 'marketplace', type: 'BOOLEAN', showInPlans: true }, // User-facing
        { name: 'ai', type: 'BOOLEAN', showInPlans: true }, // User-facing
        { name: 'monthly_emails', type: 'QUANTITY', showInPlans: true }, // User-facing
    ];

    // Ensure features exist
    for (const f of features) {
        await prisma.feature.upsert({
            where: { name: f.name },
            update: { showInPlans: f.showInPlans },
            create: { name: f.name, type: f.type as any, showInPlans: f.showInPlans },
        });
    }

    // Plans definitions
    const plans = [
        {
            name: 'Weats Start',
            cycles: [
                {
                    price: 49.99,
                    priceId: 'price_1SOjZ1ELJnossyvmBHIJY1ii',
                    cycle: 'MONTHLY',
                },
                {
                    price: 134.99,
                    priceId: 'price_1SOjfGELJnossyvmMwuO154E',
                    cycle: 'TIMESTRAL',
                },
            ],
            features: {
                menu: 1,
                languages: 1,
                menu_settings: 0,
                booking: 0,
                points: 0,
                livechat: 0,
                templates: 0,
                takeaway: 0,
                devices: 0,
                employees: 0,
                zones: 0,
                marketplace: 0,
                ai: 0,
                monthly_emails: 1000,
            },
        },
        {
            name: 'Weats Plus',
            cycles: [
                {
                    price: 149.99,
                    priceId: 'price_1SOjbgELJnossyvmruC7yY2r',
                    cycle: 'MONTHLY',
                },
                {
                    price: 404.99,
                    priceId: 'price_1SOjfnELJnossyvmB3wg7YZH',
                    cycle: 'TIMESTRAL',
                },
            ],
            features: {
                menu: 3,
                languages: 3,
                menu_settings: 1,
                booking: 1,
                points: 10,
                livechat: 1,
                templates: 1,
                takeaway: 1,
                devices: 1,
                employees: 1,
                zones: 1,
                marketplace: 1,
                ai: 1,
                monthly_emails: 5000,
            },
        },
        {
            name: 'Weats Pro',
            cycles: [
                {
                    price: 199.99,
                    priceId: 'price_1SOjgnELJnossyvmGL2tjEFm',
                    cycle: 'MONTHLY',
                },
                {
                    price: 539.99,
                    priceId: 'price_1SOjhCELJnossyvmrlr5ecrC',
                    cycle: 'TIMESTRAL',
                },
            ],
            features: {
                menu: 10,
                languages: 7,
                menu_settings: 1,
                booking: 1,
                points: 50,
                livechat: 1,
                templates: 1,
                takeaway: 1,
                devices: 1,
                employees: 1,
                zones: 1,
                marketplace: 1,
                ai: 1,
                monthly_emails: 20000,

            },
        },
    ];

    for (const p of plans) {
        // Create or update the Plan (without price)
        // Since 'name' is not @unique, we use findFirst + create/update pattern
        let plan = await prisma.plan.findFirst({
            where: { name: p.name },
        });

        if (!plan) {
            plan = await prisma.plan.create({
                data: { name: p.name },
            });
        }

        // Attach Plan features
        for (const featureName of Object.keys(p.features)) {
            const feature = await prisma.feature.findUnique({
                where: { name: featureName },
            });
            if (!feature) continue;

            const valueQuantity =
                typeof p.features[featureName] === 'number'
                    ? p.features[featureName]
                    : null;
            const valueBoolean =
                typeof p.features[featureName] === 'boolean' ||
                    p.features[featureName] === 0 ||
                    p.features[featureName] === 1
                    ? !!p.features[featureName]
                    : null;

            await prisma.planFeature.upsert({
                where: { planId_featureId: { planId: plan.id, featureId: feature.id } },
                update: { valueQuantity, valueBoolean },
                create: {
                    planId: plan.id,
                    featureId: feature.id,
                    valueQuantity,
                    valueBoolean,
                },
            });
        }

        // Create PlanCycles
        for (const cycle of p.cycles) {
            await prisma.planCycle.upsert({
                where: { priceId: cycle.priceId },
                update: { price: cycle.price, cycle: cycle.cycle as any },
                create: {
                    planId: plan.id,
                    price: cycle.price,
                    priceId: cycle.priceId,
                    cycle: cycle.cycle as any,
                },
            });
        }
    }

    console.log('Seeded plans, features, and plan cycles');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });