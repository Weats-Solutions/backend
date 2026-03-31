import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.CORE_DB_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const themes = [
    {
      name: 'Weats Default',
      isDefault: true,
      config: {
        geral: {
          geralBackgroundColor: "#FCFCFC",
          geralTitleColor: "#1d1b1b",
          borderRadius: "12px",
        },
        card: {
          backgroundColor: "#FFFFFF",
          titleColor: "#171717",
          descriptionColor: "#A3A3A3",
          observationColor: "#A3A3A3",
          iconColor: "#2B7FFF",
          highlightedBackgroundColor: "#000000",
          highlightedTitleColor: "#FFFFFF",
          highlightedDescriptionColor: "#F5F5F5",
          highlightedObservationColor: "#A3A3A3",
          highlightedIconColor: "#FFFFFF",
        },
      },
    },
    {
      name: 'Dark Mode Night',
      isDefault: false,
      config: {
        geral: {
          geralBackgroundColor: "#0F172A",
          geralTitleColor: "#F8FAFC",
          borderRadius: "8px",
        },
        card: {
          backgroundColor: "#1E293B",
          titleColor: "#F1F5F9",
          descriptionColor: "#94A3B8",
          observationColor: "#64748B",
          iconColor: "#38BDF8",
          highlightedBackgroundColor: "#38BDF8",
          highlightedTitleColor: "#0F172A",
          highlightedDescriptionColor: "#0F172A",
          highlightedObservationColor: "#1E293B",
          highlightedIconColor: "#0F172A",
        },
      },
    },
    {
      name: 'Classic Gold',
      isDefault: false,
      config: {
        geral: {
          geralBackgroundColor: "#FDFBF7",
          geralTitleColor: "#433422",
          borderRadius: "4px",
        },
        card: {
          backgroundColor: "#FFFFFF",
          titleColor: "#433422",
          descriptionColor: "#847564",
          observationColor: "#A6998A",
          iconColor: "#D4AF37",
          highlightedBackgroundColor: "#D4AF37",
          highlightedTitleColor: "#FFFFFF",
          highlightedDescriptionColor: "#F9F5E3",
          highlightedObservationColor: "#FFFFFF",
          highlightedIconColor: "#FFFFFF",
        },
      },
    },
    {
      name: 'Eco Green',
      isDefault: false,
      config: {
        geral: {
          geralBackgroundColor: "#F0FDF4",
          geralTitleColor: "#166534",
          borderRadius: "20px",
        },
        card: {
          backgroundColor: "#FFFFFF",
          titleColor: "#166534",
          descriptionColor: "#15803D",
          observationColor: "#166534",
          iconColor: "#22C55E",
          highlightedBackgroundColor: "#166534",
          highlightedTitleColor: "#FFFFFF",
          highlightedDescriptionColor: "#DCFCE7",
          highlightedObservationColor: "#BBF7D0",
          highlightedIconColor: "#FFFFFF",
        },
      },
    },
    {
      name: 'Modern Minimalist',
      isDefault: false,
      config: {
        geral: {
          geralBackgroundColor: "#FFFFFF",
          geralTitleColor: "#000000",
          borderRadius: "0px",
        },
        card: {
          backgroundColor: "#FAFAFA",
          titleColor: "#000000",
          descriptionColor: "#737373",
          observationColor: "#A3A3A3",
          iconColor: "#000000",
          highlightedBackgroundColor: "#000000",
          highlightedTitleColor: "#FFFFFF",
          highlightedDescriptionColor: "#A3A3A3",
          highlightedObservationColor: "#737373",
          highlightedIconColor: "#FFFFFF",
        },
      },
    }
  ];

  console.log('--- Iniciando seed de Themes ---');

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { id: theme.name },
      update: {
        config: theme.config,
        isDefault: theme.isDefault
      },
      create: theme
    });
  }

  console.log('--- Seed de Themes finalizado com sucesso ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });