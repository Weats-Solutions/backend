import 'dotenv/config';
import { PrismaClient } from '@weats/database';
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
          fontFamily: 'Poppins',
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