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
        { name: 'menu', type: 'QUANTITY', showInPlans: true, showInDetailsOnly: false, position: 1 },
        { name: 'languages', type: 'QUANTITY', showInPlans: true, showInDetailsOnly: false, position: 2 },
        { name: 'products', type: 'QUANTITY', showInPlans: true, showInDetailsOnly: false, position: 3 },
        { name: 'custom_variants', type: 'QUANTITY', showInPlans: true, showInDetailsOnly: false, position: 4 },
        { name: 'custom_addons', type: 'QUANTITY', showInPlans: true, showInDetailsOnly: false, position: 5 },
        { name: 'zones', type: 'QUANTITY', showInPlans: true, showInDetailsOnly: false, position: 6 },
        { name: 'points', type: 'QUANTITY', showInPlans: true, showInDetailsOnly: false, position: 7 },
        { name: 'images', type: 'QUANTITY', showInPlans: true, showInDetailsOnly: false, position: 8 },

        { name: 'custom_qrcodes', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 9 },
        { name: 'qrcode_rules', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 10 },
        { name: 'call_staff', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 11 },
        { name: 'reservations', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 12 },
        { name: 'external_links', type: 'QUANTITY', showInPlans: true, showInDetailsOnly: false, position: 13 },

        { name: 'livechat', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 14 },
        { name: 'theme_builder', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 15 },
        { name: 'expenses', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 16 },
        { name: 'metadata', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 17 },
        { name: 'google_analytics', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 18 },
        { name: 'academy', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 19 },

        { name: 'menu_categories', type: 'QUANTITY', showInPlans: false, showInDetailsOnly: false, position: 20 },
        { name: 'menu_subcategories', type: 'QUANTITY', showInPlans: false, showInDetailsOnly: false, position: 21 },

        //{ name: 'devices', type: 'BOOLEAN', showInPlans: true },
        //{ name: 'employees', type: 'BOOLEAN', showInPlans: true },
        //{ name: 'marketplace', type: 'BOOLEAN', showInPlans: true },
        //{ name: 'ai', type: 'BOOLEAN', showInPlans: true },
        //{ name: 'monthly_emails', type: 'QUANTITY', showInPlans: true },
        //{ name: 'takeaway', type: 'BOOLEAN', showInPlans: true },
        //{ name: 'booking', type: 'BOOLEAN', showInPlans: true },
    ];

    //bloquear 10 categorias
    //bloquear 25 subcategorias
    for (const f of features) {
        await prisma.feature.upsert({
            where: { name: f.name },
            update: {
                type: f.type as any,
                showInPlans: f.showInPlans,
                showInDetailsOnly: f.showInDetailsOnly,
                position: f.position,
            },
            create: {
                name: f.name,
                type: f.type as any,
                showInPlans: f.showInPlans,
                showInDetailsOnly: f.showInDetailsOnly,
                position: f.position,
            },
        });
    }

    // ======================
    // PLANS
    // ======================
    //dev
    const plans = [
        {
            name: 'Weats Starter',
            cycles: [
                { price: 14.99, priceId: 'price_1Tg4RWCsiqCEyBVBA0aDXa6w', cycle: 'MONTHLY' },
                { price: 39.99, priceId: 'price_1TbnC5CsiqCEyBVBHrIdHu2z', cycle: 'TIMESTRAL' },
            ],
            features: {
                menu: 1,
                languages: 2,

                products: 125,
                images: 125,

                custom_variants: 100,
                custom_addons: 100,

                zones: 2,
                points: 50,

                custom_qrcodes: true,
                qrcode_rules: false,

                call_staff: false,
                reservations: false,
                external_links: 0,


                livechat: true,
                theme_builder: false,

                metadata: false,
                google_analytics: false,
                academy: false,

                menu_categories: 10,
                menu_subcategories: 25,
            },
        },

        {
            name: 'Weats Pro',
            cycles: [
                { price: 29.99, priceId: "price_1TbnCnCsiqCEyBVBDjfX0Swh", cycle: 'MONTHLY' },
                { price: 79.99, priceId: "price_1TbnCmCsiqCEyBVBww2nOa48", cycle: 'TIMESTRAL' },
            ],
            features: {
                menu: 3,
                languages: 4,

                products: 250,
                images: 250,

                custom_variants: 200,
                custom_addons: 200,

                zones: 5,
                points: 150,

                custom_qrcodes: true,
                qrcode_rules: true,
                external_links: 5,

                call_staff: true,
                reservations: true,

                livechat: true,
                theme_builder: true,

                metadata: true,
                google_analytics: true,
                academy: true,

                menu_categories: 10,
                menu_subcategories: 25,
            },
        },

        {
            name: 'Weats Scale',
            cycles: [
                { price: 59.99, priceId: "price_1Tg4T1CsiqCEyBVBk3ao89CZ", cycle: 'MONTHLY' },
                { price: 159.99, priceId: "price_1TbnDCCsiqCEyBVBfFPfFKA4", cycle: 'TIMESTRAL' },
            ],
            features: {
                menu: 10,
                languages: 6,

                products: 500,
                images: 500,

                custom_variants: 350,
                custom_addons: 350,

                zones: 20,
                points: 300,

                custom_qrcodes: true,
                qrcode_rules: true,
                external_links: 10,

                call_staff: true,
                reservations: true,

                livechat: true,
                theme_builder: true,
                expenses: true,

                metadata: true,
                google_analytics: true,
                academy: true,

                menu_categories: 10,
                menu_subcategories: 25,
            },
        },
    ];

    //prod
    /* const plans = [
        {
            name: 'Weats Starter',
            cycles: [
                { price: 14.99, priceId: 'price_1Tg4YFAMnnKxWZm8Xxh9lSKq', cycle: 'MONTHLY' },
                { price: 39.99, priceId: 'price_1Tg4YkAMnnKxWZm8RPVhIXuc', cycle: 'TIMESTRAL' },
            ],
            features: {
                menu: 1,
                languages: 2,

                products: 125,
                images: 125,

                custom_variants: 100,
                custom_addons: 100,

                zones: 2,
                points: 50,

                custom_qrcodes: true,
                qrcode_rules: false,

                call_staff: false,


                livechat: true,
                theme_builder: false,

                metadata: false,
                google_analytics: false,
                academy: false,

                menu_categories: 10,
                menu_subcategories: 25,
            },
        },

        {
            name: 'Weats Pro',
            cycles: [
                { price: 29.99, priceId: "price_1Tg4ZjAMnnKxWZm8WfYnd0El", cycle: 'MONTHLY' },
                { price: 79.99, priceId: "price_1Tbp33AMnnKxWZm8nT7hjNXb", cycle: 'TIMESTRAL' },
            ],
            features: {
                menu: 3,
                languages: 4,

                products: 250,
                images: 250,

                custom_variants: 200,
                custom_addons: 200,

                zones: 5,
                points: 150,

                custom_qrcodes: true,
                qrcode_rules: true,

                call_staff: true,

                livechat: true,
                theme_builder: true,

                metadata: true,
                google_analytics: true,
                academy: true,

                menu_categories: 10,
                menu_subcategories: 25,
            },
        },

        {
            name: 'Weats Scale',
            cycles: [
                { price: 59.99, priceId: "price_1Tg4bOAMnnKxWZm8WyP6KG2i", cycle: 'MONTHLY' },
                { price: 159.99, priceId: "price_1Tg4bjAMnnKxWZm81GwYE4zM", cycle: 'TIMESTRAL' },
            ],
            features: {
                menu: 10,
                languages: 6,

                products: 500,
                images: 500,

                custom_variants: 350,
                custom_addons: 350,

                zones: 20,
                points: 300,

                custom_qrcodes: true,
                qrcode_rules: true,

                call_staff: true,

                livechat: true,
                theme_builder: true,
                expenses: true,

                metadata: true,
                google_analytics: true,
                academy: true,

                menu_categories: 10,
                menu_subcategories: 25,
            },
        },
    ];
 */
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
            const existingCycle = await prisma.planCycle.findFirst({
                where: {
                    planId: plan.id,
                    cycle: cycle.cycle as any,
                },
            });

            if (existingCycle) {
                await prisma.planCycle.update({
                    where: { id: existingCycle.id },
                    data: {
                        price: cycle.price,
                        priceId: cycle.priceId,
                    },
                });
            } else {
                await prisma.planCycle.create({
                    data: {
                        planId: plan.id,
                        price: cycle.price,
                        priceId: cycle.priceId,
                        cycle: cycle.cycle as any,
                    },
                });
            }
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