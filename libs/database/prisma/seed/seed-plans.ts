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

        { name: 'livechat', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 12 },
        { name: 'theme_builder', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 13 },
        { name: 'expenses', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 14 },
        { name: 'metadata', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 15 },
        { name: 'google_analytics', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 16 },
        { name: 'academy', type: 'BOOLEAN', showInPlans: true, showInDetailsOnly: false, position: 17 },

        //{ name: 'devices', type: 'BOOLEAN', showInPlans: true },
        //{ name: 'employees', type: 'BOOLEAN', showInPlans: true },
        //{ name: 'marketplace', type: 'BOOLEAN', showInPlans: true },
        //{ name: 'ai', type: 'BOOLEAN', showInPlans: true },
        //{ name: 'monthly_emails', type: 'QUANTITY', showInPlans: true },
        //{ name: 'takeaway', type: 'BOOLEAN', showInPlans: true },
        //{ name: 'booking', type: 'BOOLEAN', showInPlans: true },
    ];

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
    const plans = [
        {
            name: 'Weats Starter',
            cycles: [
                { price: 25.99, priceId: 'price_1TbnC5CsiqCEyBVBh80NnxYO', cycle: 'MONTHLY' },
                { price: 74, priceId: 'price_1TbnC5CsiqCEyBVBHrIdHu2z', cycle: 'TIMESTRAL' },
            ],
            features: {
                menu: 1,
                languages: 1,
                points: 25,
                zones: 1,
                products: 65,
                custom_variants: 50,
                custom_addons: 50,
                images: 65,

                custom_qrcodes: true,
                qrcode_rules: false,

                call_staff: false,


                livechat: true,
                theme_builder: false,

                metadata: false,
                google_analytics: false,
                academy: false,
            },
        },

        {
            name: 'Weats Pro',
            cycles: [
                { price: 50.99, priceId: "price_1TbnCnCsiqCEyBVBDjfX0Swh", cycle: 'MONTHLY' },
                { price: 145.00, priceId: "price_1TbnCmCsiqCEyBVBww2nOa48", cycle: 'TIMESTRAL' },
            ],
            features: {
                menu: 3,
                languages: 3,
                points: 100,
                zones: 5,
                products: 250,
                custom_variants: 150,
                custom_addons: 150,
                images: 250,

                custom_qrcodes: true,
                qrcode_rules: true,

                call_staff: true,

                livechat: true,
                theme_builder: true,

                metadata: true,
                google_analytics: true,
                academy: true,
            },
        },

        {
            name: 'Weats Scale',
            cycles: [
                { price: 80.99, priceId: "price_1TbnDCCsiqCEyBVBpZu2Bhxk", cycle: 'MONTHLY' },
                { price: 230, priceId: "price_1TbnDCCsiqCEyBVBfFPfFKA4", cycle: 'TIMESTRAL' },
            ],
            features: {
                menu: 10,
                languages: 6,
                points: 500,
                zones: 20,
                products: 500,
                custom_variants: 350,
                custom_addons: 350,
                images: 500,

                custom_qrcodes: true,
                qrcode_rules: true,

                call_staff: true,

                livechat: true,
                theme_builder: true,
                expenses: true,

                metadata: true,
                google_analytics: true,
                academy: true,
            },
        },
    ];

    /*  const plans = [
         {
             name: 'Weats Starter',
             cycles: [
                 { price: 25.99, priceId: 'price_1Tbp34AMnnKxWZm8hqLm36pM', cycle: 'MONTHLY' },
                 { price: 74, priceId: 'price_1Tbp34AMnnKxWZm8OyM9AqSP', cycle: 'TIMESTRAL' },
             ],
             features: {
                 menu: 1,
                 languages: 1,
                 points: 25,
                 zones: 1,
                 products: 65,
                 custom_variants: 50,
                 custom_addons: 50,
                 images: 65,
 
                 custom_qrcodes: true,
                 qrcode_rules: false,
 
                 call_staff: false,
 
                 livechat: true,
                 theme_builder: false,
 
                 metadata: false,
                 google_analytics: false,
                 academy: false,
             },
         },
 
         {
             name: 'Weats Pro',
             cycles: [
                 { price: 50.99, priceId: "price_1Tbp33AMnnKxWZm8uZBQihDz", cycle: 'MONTHLY' },
                 { price: 145.00, priceId: "price_1Tbp33AMnnKxWZm8nT7hjNXb", cycle: 'TIMESTRAL' },
             ],
             features: {
                 menu: 3,
                 languages: 3,
                 points: 100,
                 zones: 5,
                 products: 250,
                 custom_variants: 150,
                 custom_addons: 150,
                 images: 250,
 
                 custom_qrcodes: true,
                 qrcode_rules: true,
 
                 call_staff: true,
 
                 livechat: true,
                 theme_builder: true,
 
                 metadata: true,
                 google_analytics: true,
                 academy: true,
             },
         },
 
         {
             name: 'Weats Scale',
             cycles: [
                 { price: 80.99, priceId: "price_1Tbp31AMnnKxWZm8EuDLgqfM", cycle: 'MONTHLY' },
                 { price: 230, priceId: "price_1Tbp31AMnnKxWZm8eLVPHeve", cycle: 'TIMESTRAL' },
             ],
             features: {
                 menu: 10,
                 languages: 6,
                 points: 500,
                 zones: 20,
                 products: 500,
                 custom_variants: 350,
                 custom_addons: 350,
                 images: 500,
 
                 custom_qrcodes: true,
                 qrcode_rules: true,
 
                 call_staff: true,
 
                 livechat: true,
                 theme_builder: true,
                 expenses: true,
 
                 metadata: true,
                 google_analytics: true,
                 academy: true,
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