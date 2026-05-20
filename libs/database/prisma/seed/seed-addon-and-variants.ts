import 'dotenv/config';
import { PrismaClient, UnitType } from '@weats/database';
import { PrismaPg } from '@prisma/adapter-pg';
import { EstablishmentLanguage } from '@weats/database';

// ============================================
// CONFIGURAÇÃO
// ============================================
//const ESTABLISHMENT_ID = '01KJ3MS6X3MK16B7T239KP8Q43'; // ID para o Item de teste

const connectionString = process.env.CORE_DB_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Tipos para as nossas traduções
type MultiLangString = {
  PT: string;
  EN: string;
  ES: string;
  FR: string;
  DE: string;
  IT: string;
};

// ============================================
// DATASETS (O TEU ATIVO MAIS VALIOSO)
// ============================================

const GLOBAL_VARIANTS: { name: MultiLangString; unit: UnitType; quantity: number }[] = [
  // --- TAMANHOS GENÉRICOS (SIZE) ---
  { name: { PT: 'Mini', EN: 'Mini', ES: 'Mini', FR: 'Mini', DE: 'Mini', IT: 'Mini' }, unit: UnitType.UNIT, quantity: 1 },
  { name: { PT: 'Pequena', EN: 'Small', ES: 'Pequeña', FR: 'Petite', DE: 'Klein', IT: 'Piccola' }, unit: UnitType.UNIT, quantity: 1 },
  { name: { PT: 'Média', EN: 'Medium', ES: 'Mediana', FR: 'Moyenne', DE: 'Mittel', IT: 'Media' }, unit: UnitType.UNIT, quantity: 1 },
  { name: { PT: 'Grande', EN: 'Large', ES: 'Grande', FR: 'Grande', DE: 'Groß', IT: 'Grande' }, unit: UnitType.UNIT, quantity: 1 },
  { name: { PT: 'Extra Grande (XL)', EN: 'Extra Large (XL)', ES: 'Extra Grande (XL)', FR: 'Extra Grande (XL)', DE: 'Extra Groß (XL)', IT: 'Extra Grande (XL)' }, unit: UnitType.UNIT, quantity: 1 },
  { name: { PT: 'Familiar', EN: 'Family Size', ES: 'Familiar', FR: 'Familiale', DE: 'Familien', IT: 'Familiare' }, unit: UnitType.UNIT, quantity: 1 },
  { name: { PT: 'Dose', EN: 'Serving', ES: 'Ración', FR: 'Portion', DE: 'Portion', IT: 'Porzione' }, unit: UnitType.UNIT, quantity: 1 },
  { name: { PT: 'Meia Dose', EN: 'Half Serving', ES: 'Media Ración', FR: 'Demi-portion', DE: 'Halbe Portion', IT: 'Mezza Porzione' }, unit: UnitType.HALF, quantity: 1 },
  { name: { PT: 'Fatia', EN: 'Slice', ES: 'Porción', FR: 'Part', DE: 'Stück', IT: 'Trancio' }, unit: UnitType.SLICE, quantity: 1 },

  // --- VOLUMES (SIZE) ---
  { name: { PT: 'Shot', EN: 'Shot', ES: 'Chupito', FR: 'Shooter', DE: 'Shot', IT: 'Cicchetto' }, unit: UnitType.UNIT, quantity: 1 },
  { name: { PT: 'Copo / Caneca (Pint)', EN: 'Pint', ES: 'Pinta', FR: 'Pinte', DE: 'Pint', IT: 'Pinta' }, unit: UnitType.UNIT, quantity: 1 },
  { name: { PT: 'Jarro', EN: 'Pitcher', ES: 'Jarra', FR: 'Pichet', DE: 'Krug', IT: 'Caraffa' }, unit: UnitType.UNIT, quantity: 1 },
  { name: { PT: 'Garrafa', EN: 'Bottle', ES: 'Botella', FR: 'Bouteille', DE: 'Flasche', IT: 'Bottiglia' }, unit: UnitType.UNIT, quantity: 1 },
  { name: { PT: '20cl', EN: '20cl', ES: '20cl', FR: '20cl', DE: '20cl', IT: '20cl' }, unit: UnitType.CENTILITER, quantity: 20 },
  { name: { PT: '33cl', EN: '33cl', ES: '33cl', FR: '33cl', DE: '33cl', IT: '33cl' }, unit: UnitType.CENTILITER, quantity: 33 },
  { name: { PT: '50cl', EN: '50cl', ES: '50cl', FR: '50cl', DE: '50cl', IT: '50cl' }, unit: UnitType.CENTILITER, quantity: 50 },
  { name: { PT: '75cl', EN: '75cl', ES: '75cl', FR: '75cl', DE: '75cl', IT: '75cl' }, unit: UnitType.CENTILITER, quantity: 75 },
  { name: { PT: '1L', EN: '1L', ES: '1L', FR: '1L', DE: '1L', IT: '1L' }, unit: UnitType.LITER, quantity: 1 },
  { name: { PT: '1.5L', EN: '1.5L', ES: '1.5L', FR: '1.5L', DE: '1.5L', IT: '1.5L' }, unit: UnitType.LITER, quantity: 1.5 },

  // --- PESOS (SIZE) ---
  { name: { PT: '100g', EN: '100g', ES: '100g', FR: '100g', DE: '100g', IT: '100g' }, unit: UnitType.GRAM, quantity: 100 },
  { name: { PT: '200g', EN: '200g', ES: '200g', FR: '200g', DE: '200g', IT: '200g' }, unit: UnitType.GRAM, quantity: 200 },
  { name: { PT: '300g', EN: '300g', ES: '300g', FR: '300g', DE: '300g', IT: '300g' }, unit: UnitType.GRAM, quantity: 300 },
  { name: { PT: '500g', EN: '500g', ES: '500g', FR: '500g', DE: '500g', IT: '500g' }, unit: UnitType.GRAM, quantity: 500 },
  { name: { PT: '1kg', EN: '1kg', ES: '1kg', FR: '1kg', DE: '1kg', IT: '1kg' }, unit: UnitType.KILOGRAM, quantity: 1 },

  // --- QUANTIDADES (SIZE) ---
  { name: { PT: '4 Unidades', EN: '4 Pieces', ES: '4 Piezas', FR: '4 Pièces', DE: '4 Stück', IT: '4 Pezzi' }, unit: UnitType.UNIT, quantity: 4 },
  { name: { PT: '6 Unidades', EN: '6 Pieces', ES: '6 Piezas', FR: '6 Pièces', DE: '6 Stück', IT: '6 Pezzi' }, unit: UnitType.UNIT, quantity: 6 },
  { name: { PT: '8 Unidades', EN: '8 Pieces', ES: '8 Piezas', FR: '8 Pièces', DE: '8 Stück', IT: '8 Pezzi' }, unit: UnitType.UNIT, quantity: 8 },
  { name: { PT: '10 Unidades', EN: '10 Pieces', ES: '10 Piezas', FR: '10 Pièces', DE: '10 Stück', IT: '10 Pezzi' }, unit: UnitType.UNIT, quantity: 10 },
  { name: { PT: '20 Unidades', EN: '20 Pieces', ES: '20 Piezas', FR: '20 Pièces', DE: '20 Stück', IT: '20 Pezzi' }, unit: UnitType.UNIT, quantity: 20 },
];

const GLOBAL_ADDONS: { name: MultiLangString }[] = [
  // --- INSTRUÇÕES GERAIS / DIETAS / ALERGIAS ---
  { name: { PT: 'Sem Glúten', EN: 'Gluten-Free', ES: 'Sin Gluten', FR: 'Sans Gluten', DE: 'Glutenfrei', IT: 'Senza Glutine' } },
  { name: { PT: 'Opção Vegan', EN: 'Vegan Option', ES: 'Opción Vegana', FR: 'Option Végane', DE: 'Vegane Option', IT: 'Opzione Vegana' } },
  { name: { PT: 'Sem Sal', EN: 'No Salt', ES: 'Sin Sal', FR: 'Sans Sel', DE: 'Ohne Salz', IT: 'Senza Sale' } },
  { name: { PT: 'Bem Quente', EN: 'Very Hot', ES: 'Muy Caliente', FR: 'Bien Chaud', DE: 'Sehr Heiß', IT: 'Molto Caldo' } },
  { name: { PT: 'Muito Picante', EN: 'Extra Spicy', ES: 'Muy Picante', FR: 'Très Épicé', DE: 'Sehr Scharf', IT: 'Molto Piccante' } },
  { name: { PT: 'Talheres de Plástico', EN: 'Plastic Cutlery', ES: 'Cubiertos', FR: 'Couverts', DE: 'Besteck', IT: 'Posate' } },

  // --- BEBIDAS & CAFÉ (Brunch / Cafetaria) ---
  { name: { PT: 'Sem Gelo', EN: 'No Ice', ES: 'Sin Hielo', FR: 'Sans Glace', DE: 'Kein Eis', IT: 'Senza Ghiaccio' } },
  { name: { PT: 'Com Gelo', EN: 'With Ice', ES: 'Con Hielo', FR: 'Avec Glace', DE: 'Mit Eis', IT: 'Con Ghiaccio' } },
  { name: { PT: 'Rodela de Limão', EN: 'Lemon Slice', ES: 'Rodaja de Limón', FR: 'Tranche de Citron', DE: 'Zitronenscheibe', IT: 'Fetta di Limone' } },
  { name: { PT: 'Descafeinado', EN: 'Decaf', ES: 'Descafeinado', FR: 'Décaféiné', DE: 'Koffeinfrei', IT: 'Decaffeinato' } },
  { name: { PT: 'Leite de Soja', EN: 'Soy Milk', ES: 'Leche de Soja', FR: 'Lait de Soja', DE: 'Sojamilch', IT: 'Latte di Soia' } },
  { name: { PT: 'Leite de Aveia', EN: 'Oat Milk', ES: 'Leche de Avena', FR: 'Lait d\'Avoine', DE: 'Hafermilch', IT: 'Latte di Avena' } },
  { name: { PT: 'Leite de Amêndoa', EN: 'Almond Milk', ES: 'Leche de Almendra', FR: 'Lait d\'Amande', DE: 'Mandelmilch', IT: 'Latte di Mandorla' } },
  { name: { PT: 'Extra Shot de Café', EN: 'Extra Espresso Shot', ES: 'Shot Extra', FR: 'Dose Supplémentaire', DE: 'Extra Shot', IT: 'Extra Shot' } },

  // --- PONTOS DA CARNE (Steakhouse / Burgers) ---
  { name: { PT: 'Mal Passado', EN: 'Rare', ES: 'Poco Hecho', FR: 'Saignant', DE: 'Blutig', IT: 'Al Sangue' } },
  { name: { PT: 'Médio', EN: 'Medium', ES: 'Al Punto', FR: 'À Point', DE: 'Medium', IT: 'Media Cottura' } },
  { name: { PT: 'Bem Passado', EN: 'Well Done', ES: 'Muy Hecho', FR: 'Bien Cuit', DE: 'Durchgebraten', IT: 'Ben Cotta' } },

  // --- BURGERS / SANDWICHES / KEBABS ---
  { name: { PT: 'Sem Cebola', EN: 'No Onion', ES: 'Sin Cebolla', FR: 'Sans Oignon', DE: 'Keine Zwiebeln', IT: 'Senza Cipolla' } },
  { name: { PT: 'Sem Tomate', EN: 'No Tomato', ES: 'Sin Tomate', FR: 'Sans Tomate', DE: 'Keine Tomaten', IT: 'Senza Pomodoro' } },
  { name: { PT: 'Sem Salada', EN: 'No Salad', ES: 'Sin Ensalada', FR: 'Sans Salade', DE: 'Ohne Salat', IT: 'Senza Insalata' } },
  { name: { PT: 'Extra Queijo', EN: 'Extra Cheese', ES: 'Extra Queso', FR: 'Supplément Fromage', DE: 'Extra Käse', IT: 'Extra Formaggio' } },
  { name: { PT: 'Extra Bacon', EN: 'Extra Bacon', ES: 'Extra Bacon', FR: 'Supplément Bacon', DE: 'Extra Speck', IT: 'Extra Pancetta' } },
  { name: { PT: 'Extra Hambúrguer', EN: 'Double Patty', ES: 'Doble Carne', FR: 'Double Steak', DE: 'Doppeltes Fleisch', IT: 'Doppio Hamburger' } },
  { name: { PT: 'Jalapeños', EN: 'Jalapeños', ES: 'Jalapeños', FR: 'Jalapeños', DE: 'Jalapeños', IT: 'Jalapeños' } },

  // --- PIZZA ---
  { name: { PT: 'Massa Fina', EN: 'Thin Crust', ES: 'Masa Fina', FR: 'Pâte Fine', DE: 'Dünner Teig', IT: 'Pasta Sottile' } },
  { name: { PT: 'Massa Alta', EN: 'Thick Crust', ES: 'Masa Gruesa', FR: 'Pâte Épaisse', DE: 'Dicker Teig', IT: 'Pasta Alta' } },
  { name: { PT: 'Borda Recheada', EN: 'Stuffed Crust', ES: 'Borde Relleno', FR: 'Croûte Fourrée', DE: 'Gefüllter Rand', IT: 'Bordo Ripieno' } },
  { name: { PT: 'Extra Mozzarella', EN: 'Extra Mozzarella', ES: 'Extra Mozzarella', FR: 'Supplément Mozzarella', DE: 'Extra Mozzarella', IT: 'Extra Mozzarella' } },
  { name: { PT: 'Extra Cogumelos', EN: 'Extra Mushrooms', ES: 'Extra Champiñones', FR: 'Supplément Champignons', DE: 'Extra Pilze', IT: 'Extra Funghi' } },

  // --- SUSHI & ASIÁTICO ---
  { name: { PT: 'Com Pauzinhos', EN: 'With Chopsticks', ES: 'Con Palillos', FR: 'Avec Baguettes', DE: 'Mit Stäbchen', IT: 'Con Bacchette' } },
  { name: { PT: 'Extra Soja', EN: 'Extra Soy Sauce', ES: 'Extra Soja', FR: 'Supplément Soja', DE: 'Extra Sojasauce', IT: 'Extra Soia' } },
  { name: { PT: 'Extra Soja Doce (Teriyaki)', EN: 'Sweet Soy (Teriyaki)', ES: 'Soja Dulce', FR: 'Soja Sucrée', DE: 'Süße Sojasauce', IT: 'Soia Dolce' } },
  { name: { PT: 'Extra Gengibre', EN: 'Extra Ginger', ES: 'Extra Jengibre', FR: 'Supplément Gingembre', DE: 'Extra Ingwer', IT: 'Extra Zenzero' } },
  { name: { PT: 'Extra Wasabi', EN: 'Extra Wasabi', ES: 'Extra Wasabi', FR: 'Supplément Wasabi', DE: 'Extra Wasabi', IT: 'Extra Wasabi' } },
  { name: { PT: 'Maionese Picante', EN: 'Spicy Mayo', ES: 'Mayonesa Picante', FR: 'Mayo Épicée', DE: 'Scharfe Mayo', IT: 'Maionese Piccante' } },

  // --- MOLHOS (Para Acompanhamentos) ---
  { name: { PT: 'Ketchup', EN: 'Ketchup', ES: 'Kétchup', FR: 'Ketchup', DE: 'Ketchup', IT: 'Ketchup' } },
  { name: { PT: 'Maionese', EN: 'Mayonnaise', ES: 'Mayonesa', FR: 'Mayonnaise', DE: 'Mayonnaise', IT: 'Maionese' } },
  { name: { PT: 'Mostarda', EN: 'Mustard', ES: 'Mostaza', FR: 'Moutarde', DE: 'Senf', IT: 'Senape' } },
  { name: { PT: 'Molho BBQ', EN: 'BBQ Sauce', ES: 'Salsa Barbacoa', FR: 'Sauce Barbecue', DE: 'BBQ-Sauce', IT: 'Salsa BBQ' } },
  { name: { PT: 'Maionese de Alho', EN: 'Garlic Mayo', ES: 'Mayonesa de Ajo', FR: 'Mayo à l\'ail', DE: 'Knoblauch-Mayo', IT: 'Maionese all\'Aglio' } },
  { name: { PT: 'Molho à Parte', EN: 'Sauce on the Side', ES: 'Salsa Aparte', FR: 'Sauce à part', DE: 'Soße extra', IT: 'Salsa a parte' } },

  // --- ACOMPANHAMENTOS GERAIS (Podem ser usados como addons em pratos) ---
  { name: { PT: 'Batata Frita', EN: 'French Fries', ES: 'Patatas Fritas', FR: 'Frites', DE: 'Pommes Frites', IT: 'Patatine Fritte' } },
  { name: { PT: 'Arroz Branco', EN: 'White Rice', ES: 'Arroz Blanco', FR: 'Riz Blanc', DE: 'Weißer Reis', IT: 'Riso Bianco' } },
  { name: { PT: 'Salada Mista', EN: 'Mixed Salad', ES: 'Ensalada Mixta', FR: 'Salade Mixte', DE: 'Gemischter Salat', IT: 'Insalata Mista' } },
];

// ============================================
// HELPERS
// ============================================

async function seedGlobalVariants() {
  console.log('🌍 A criar Variantes Globais (PT, EN, ES, FR, DE, IT)...');

  for (const variant of GLOBAL_VARIANTS) {
    // Busca pela tradução 'pt' para verificar se já existe
    const exists = await prisma.variantOption.findFirst({
      where: { translations: { some: { locale: EstablishmentLanguage.PT, name: variant.name.PT } }, isGlobal: true }
    });

    if (!exists) {
      await prisma.variantOption.create({
        data: {
          isGlobal: true,
          unit: variant.unit as UnitType,
          quantity: variant.quantity,
          translations: {
            create: [
              { locale: EstablishmentLanguage.PT, name: variant.name.PT },
              { locale: EstablishmentLanguage.EN, name: variant.name.EN },
              { locale: EstablishmentLanguage.ES, name: variant.name.ES },
              { locale: EstablishmentLanguage.FR, name: variant.name.FR },
              { locale: EstablishmentLanguage.DE, name: variant.name.DE },
              { locale: EstablishmentLanguage.IT, name: variant.name.IT },
            ]
          }
        }
      });
    }
  }
}

async function seedGlobalAddons() {
  console.log('🌍 A criar Addons Globais (PT, EN, ES, FR, DE, IT)...');

  for (const addon of GLOBAL_ADDONS) {
    const exists = await prisma.addon.findFirst({
      where: { translations: { some: { locale: EstablishmentLanguage.PT, name: addon.name.PT } }, isGlobal: true }
    });

    if (!exists) {
      await prisma.addon.create({
        data: {
          isGlobal: true,
          translations: {
            create: [
              { locale: EstablishmentLanguage.PT, name: addon.name.PT },
              { locale: EstablishmentLanguage.EN, name: addon.name.EN },
              { locale: EstablishmentLanguage.ES, name: addon.name.ES },
              { locale: EstablishmentLanguage.FR, name: addon.name.FR },
              { locale: EstablishmentLanguage.DE, name: addon.name.DE },
              { locale: EstablishmentLanguage.IT, name: addon.name.IT },
            ]
          }
        }
      });
    }
  }
}

// ============================================
// ITEM DE TESTE (COMENTAR EM PROD)
// ============================================

/*
async function seedTestItem() {
  console.log(`\n🍕 A criar Pizza de Teste para estabelecimento: ${ESTABLISHMENT_ID}...`);

  // 1. Criar Item (Sem name/description na raiz)
  const item = await prisma.item.create({
    data: {
      establishmentId: ESTABLISHMENT_ID,
      basePrice: null, // Tem variantes, logo basePrice é null
      taxTableId: 'tax-table-1',
      translations: {
        create: [
          { locale: 'pt', name: 'Pizza Pepperoni Artesanal', description: 'Massa fermentação lenta.' },
          { locale: 'en', name: 'Artisan Pepperoni Pizza', description: 'Slow fermentation dough.' },
          { locale: 'fr', name: 'Pizza Pepperoni Artisanale', description: 'Pâte à fermentation lente.' },
          { locale: 'de', name: 'Artisan Pepperoni Pizza', description: 'Langsamer Gärteig.' },
          { locale: 'es', name: 'Pizza Pepperoni Artesanal', description: 'Masa de fermentación lenta.' },
          { locale: 'it', name: 'Pizza Pepperoni Artigianale', description: 'Impasto a lenta fermentazione.' },
        ]
      }
    }
  });

  // 2. Buscar Variantes Globais (Asseguramo-nos do locale 'pt' na procura)
  const sizeS = await prisma.variantOption.findFirst({ where: { translations: { some: { locale: 'pt', name: 'Pequena' } }, isGlobal: true } });
  const sizeM = await prisma.variantOption.findFirst({ where: { translations: { some: { locale: 'pt', name: 'Média' } }, isGlobal: true } });
  const sizeL = await prisma.variantOption.findFirst({ where: { translations: { some: { locale: 'pt', name: 'Grande' } }, isGlobal: true } });

  if (!sizeS || !sizeM || !sizeL) throw new Error("Faltam variantes globais! Corre o seed global primeiro.");

  // 3. Criar Grupo de Variantes + Variantes Finais
  await prisma.itemVariantGroup.create({
    data: {
      itemId: item.id,
      position: 1,
      translations: {
        create: [
          { locale: 'pt', name: 'Escolha o Tamanho' },
          { locale: 'en', name: 'Choose Size' },
          { locale: 'fr', name: 'Choisir la taille' },
          { locale: 'de', name: 'Größe wählen' },
          { locale: 'es', name: 'Elige tamaño' },
          { locale: 'it', name: 'Scegli la taglia' },
        ]
      },
      variants: {
        create: [
          { itemId: item.id, variantOptionId: sizeS.id, price: 12, sku: 'PIZ-S', isDefault: false },
          { itemId: item.id, variantOptionId: sizeM.id, price: 15, sku: 'PIZ-M', isDefault: true },
          { itemId: item.id, variantOptionId: sizeL.id, price: 19, sku: 'PIZ-L', isDefault: false },
        ]
      }
    }
  });

  // 4. Buscar Addons Globais
  const massaFina = await prisma.addon.findFirst({ where: { translations: { some: { locale: 'pt', name: 'Massa Fina' } } } });
  const massaAlta = await prisma.addon.findFirst({ where: { translations: { some: { locale: 'pt', name: 'Massa Alta' } } } });
  const extraQ = await prisma.addon.findFirst({ where: { translations: { some: { locale: 'pt', name: 'Extra Queijo' } } } });

  if (!massaFina || !massaAlta || !extraQ) throw new Error("Faltam addons globais.");

  // 5. Modificadores
  // Grupo 1: Massa (Radio)
  const crustGroup = await prisma.itemModifierGroup.create({
    data: {
      itemId: item.id,
      displayMode: 'RADIO',
      minSelection: 1,
      maxSelection: 1,
      translations: {
        create: [
          { locale: 'pt', name: 'Tipo de Massa' },
          { locale: 'en', name: 'Crust Type' },
          { locale: 'es', name: 'Tipo de Masa' },
          { locale: 'fr', name: 'Type de Pâte' },
          { locale: 'de', name: 'Teigart' },
          { locale: 'it', name: 'Tipo di Pasta' },
        ]
      }
    }
  });

  await prisma.itemModifierOption.createMany({
    data: [
      { modifierGroupId: crustGroup.id, addonId: massaFina.id, price: 0 },
      { modifierGroupId: crustGroup.id, addonId: massaAlta.id, price: 0 },
    ]
  });

  // Grupo 2: Extras (Check)
  const extraGroup = await prisma.itemModifierGroup.create({
    data: {
      itemId: item.id,
      displayMode: 'QUANTITY',
      translations: {
        create: [
          { locale: 'pt', name: 'Extras' },
          { locale: 'en', name: 'Extras' },
          { locale: 'es', name: 'Extras' },
          { locale: 'fr', name: 'Suppléments' },
          { locale: 'de', name: 'Extras' },
          { locale: 'it', name: 'Extra' },
        ]
      }
    }
  });

  await prisma.itemModifierOption.create({
    data: { modifierGroupId: extraGroup.id, addonId: extraQ.id, price: 1.50, maxQuantity: 2 }
  });

  console.log('✅ Pizza de teste criada com sucesso!');
}
*/

// ============================================
// MAIN SEED EXECUTION
// ============================================

async function main() {
  console.log('🌱 A iniciar Seed da Base de Dados...\n');

  // 1. OBRIGATÓRIO: Dicionários Globais
  await seedGlobalVariants();
  await seedGlobalAddons();

  // 2. OPCIONAL: Item de Teste (Comentar em Prod)
  // await seedTestItem();

  console.log('\n🎉 Seed completo finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no Seed: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });