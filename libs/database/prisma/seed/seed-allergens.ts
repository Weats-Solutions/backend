import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AllergenCode } from "@weats/database";

// ============================================
// CONFIGURAÇÃO
// ============================================
const connectionString = process.env.CORE_DB_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding allergens...');

    const allergens = [
        AllergenCode.CELERY,
        AllergenCode.CRUSTACEAN,
        AllergenCode.EGG,
        AllergenCode.FISH,
        AllergenCode.GLUTEN,
        AllergenCode.LUPINS,
        AllergenCode.MILK,
        AllergenCode.MUSTARD,
        AllergenCode.NUTS,
        AllergenCode.PEANUTS,
        AllergenCode.SESAME,
        AllergenCode.SHELLFISH,
        AllergenCode.SOY,
        AllergenCode.SULFITES,
    ];

    for (const code of allergens) {
        await prisma.allergen.create({
            data: { code },
        });
    }

    console.log('Allergens seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
