import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.CORE_DB_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    const taxes = [
        // --- PORTUGAL CONTINENTE ---
        { countryCode: 'PT', region: 'Continente', name: 'IVA Normal', rate: 23.0, fiscalCode: 'NOR' },
        { countryCode: 'PT', region: 'Continente', name: 'IVA Intermédio', rate: 13.0, fiscalCode: 'INT' },
        { countryCode: 'PT', region: 'Continente', name: 'IVA Reduzido', rate: 6.0, fiscalCode: 'RED' },

        // --- PORTUGAL MADEIRA ---
        { countryCode: 'PT', region: 'Madeira', name: 'IVA Normal (RAM)', rate: 22.0, fiscalCode: 'NOR_RAM' },
        { countryCode: 'PT', region: 'Madeira', name: 'IVA Intermédio (RAM)', rate: 12.0, fiscalCode: 'INT_RAM' },
        { countryCode: 'PT', region: 'Madeira', name: 'IVA Reduzido (RAM)', rate: 5.0, fiscalCode: 'RED_RAM' },

        // --- PORTUGAL AÇORES ---
        { countryCode: 'PT', region: 'Açores', name: 'IVA Normal (RAA)', rate: 16.0, fiscalCode: 'NOR_RAA' },
        { countryCode: 'PT', region: 'Açores', name: 'IVA Intermédio (RAA)', rate: 9.0, fiscalCode: 'INT_RAA' },
        { countryCode: 'PT', region: 'Açores', name: 'IVA Reduzido (RAA)', rate: 4.0, fiscalCode: 'RED_RAA' },

        // --- ESPANHA ---
        { countryCode: 'ES', region: null, name: 'IVA General', rate: 21.0, fiscalCode: 'ES_GEN' },
        { countryCode: 'ES', region: null, name: 'IVA Reducido', rate: 10.0, fiscalCode: 'ES_RED' },
        { countryCode: 'ES', region: null, name: 'IVA Superreducido', rate: 4.0, fiscalCode: 'ES_SUP' },

        // --- FRANÇA ---
        { countryCode: 'FR', region: null, name: 'TVA Normale', rate: 20.0, fiscalCode: 'FR_NOR' },
        { countryCode: 'FR', region: null, name: 'TVA Intermédiaire', rate: 10.0, fiscalCode: 'FR_INT' },
        { countryCode: 'FR', region: null, name: 'TVA Réduite', rate: 5.5, fiscalCode: 'FR_RED' },

        // --- REINO UNIDO ---
        { countryCode: 'GB', region: null, name: 'VAT Standard', rate: 20.0, fiscalCode: 'GB_STD' },
        { countryCode: 'GB', region: null, name: 'VAT Reduced', rate: 5.0, fiscalCode: 'GB_RED' },
        { countryCode: 'GB', region: null, name: 'VAT Zero', rate: 0.0, fiscalCode: 'GB_ZERO' }
    ]

    console.log('Iniciando o seed da TaxTable...')

    for (const tax of taxes) {
        await prisma.taxTable.create({ data: tax })
    }

    console.log('Seed da TaxTable concluído com sucesso!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })