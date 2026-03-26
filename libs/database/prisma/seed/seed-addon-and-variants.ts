import 'dotenv/config';
import { PrismaClient, VariantType } from '@weats/database';
import { PrismaPg } from '@prisma/adapter-pg';

// ============================================
// CONFIGURAÇÃO
// ============================================
//const ESTABLISHMENT_ID = '01KJ3MS6X3MK16B7T239KP8Q43'; // ID para o Item de teste

const connectionString = process.env.CORE_DB_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Tipos para as nossas traduções
type MultiLangString = {
    pt: string;
    en: string;
    es: string;
    fr: string;
    de: string;
    it: string;
};

// ============================================
// DATASETS (O TEU ATIVO MAIS VALIOSO)
// ============================================

const GLOBAL_VARIANTS: { name: MultiLangString; type: VariantType; unit?: string; quantity?: number }[] = [
    // --- TAMANHOS GENÉRICOS (SIZE) ---
    { type: 'SIZE', name: { pt: 'Mini', en: 'Mini', es: 'Mini', fr: 'Mini', de: 'Mini', it: 'Mini' } },
    { type: 'SIZE', name: { pt: 'Pequena', en: 'Small', es: 'Pequeña', fr: 'Petite', de: 'Klein', it: 'Piccola' } },
    { type: 'SIZE', name: { pt: 'Média', en: 'Medium', es: 'Mediana', fr: 'Moyenne', de: 'Mittel', it: 'Media' } },
    { type: 'SIZE', name: { pt: 'Grande', en: 'Large', es: 'Grande', fr: 'Grande', de: 'Groß', it: 'Grande' } },
    { type: 'SIZE', name: { pt: 'Extra Grande (XL)', en: 'Extra Large (XL)', es: 'Extra Grande (XL)', fr: 'Extra Grande (XL)', de: 'Extra Groß (XL)', it: 'Extra Grande (XL)' } },
    { type: 'SIZE', name: { pt: 'Familiar', en: 'Family Size', es: 'Familiar', fr: 'Familiale', de: 'Familien', it: 'Familiare' } },
    { type: 'SIZE', name: { pt: 'Dose', en: 'Serving', es: 'Ración', fr: 'Portion', de: 'Portion', it: 'Porzione' } },
    { type: 'SIZE', name: { pt: 'Meia Dose', en: 'Half Serving', es: 'Media Ración', fr: 'Demi-portion', de: 'Halbe Portion', it: 'Mezza Porzione' } },
    { type: 'SIZE', name: { pt: 'Fatia', en: 'Slice', es: 'Porción', fr: 'Part', de: 'Stück', it: 'Trancio' } },

    // --- VOLUMES (SIZE) ---
    { type: 'SIZE', name: { pt: 'Shot', en: 'Shot', es: 'Chupito', fr: 'Shooter', de: 'Shot', it: 'Cicchetto' } },
    { type: 'SIZE', name: { pt: 'Copo / Caneca (Pint)', en: 'Pint', es: 'Pinta', fr: 'Pinte', de: 'Pint', it: 'Pinta' } },
    { type: 'SIZE', name: { pt: 'Jarro', en: 'Pitcher', es: 'Jarra', fr: 'Pichet', de: 'Krug', it: 'Caraffa' } },
    { type: 'SIZE', name: { pt: 'Garrafa', en: 'Bottle', es: 'Botella', fr: 'Bouteille', de: 'Flasche', it: 'Bottiglia' } },
    { type: 'SIZE', name: { pt: '20cl', en: '20cl', es: '20cl', fr: '20cl', de: '20cl', it: '20cl' }, unit: 'cl', quantity: 20 },
    { type: 'SIZE', name: { pt: '33cl', en: '33cl', es: '33cl', fr: '33cl', de: '33cl', it: '33cl' }, unit: 'cl', quantity: 33 },
    { type: 'SIZE', name: { pt: '50cl', en: '50cl', es: '50cl', fr: '50cl', de: '50cl', it: '50cl' }, unit: 'cl', quantity: 50 },
    { type: 'SIZE', name: { pt: '75cl', en: '75cl', es: '75cl', fr: '75cl', de: '75cl', it: '75cl' }, unit: 'cl', quantity: 75 },
    { type: 'SIZE', name: { pt: '1L', en: '1L', es: '1L', fr: '1L', de: '1L', it: '1L' }, unit: 'L', quantity: 1 },
    { type: 'SIZE', name: { pt: '1.5L', en: '1.5L', es: '1.5L', fr: '1.5L', de: '1.5L', it: '1.5L' }, unit: 'L', quantity: 1.5 },

    // --- PESOS (SIZE) ---
    { type: 'SIZE', name: { pt: '100g', en: '100g', es: '100g', fr: '100g', de: '100g', it: '100g' }, unit: 'g', quantity: 100 },
    { type: 'SIZE', name: { pt: '200g', en: '200g', es: '200g', fr: '200g', de: '200g', it: '200g' }, unit: 'g', quantity: 200 },
    { type: 'SIZE', name: { pt: '300g', en: '300g', es: '300g', fr: '300g', de: '300g', it: '300g' }, unit: 'g', quantity: 300 },
    { type: 'SIZE', name: { pt: '500g', en: '500g', es: '500g', fr: '500g', de: '500g', it: '500g' }, unit: 'g', quantity: 500 },
    { type: 'SIZE', name: { pt: '1kg', en: '1kg', es: '1kg', fr: '1kg', de: '1kg', it: '1kg' }, unit: 'kg', quantity: 1 },

    // --- QUANTIDADES (SIZE) ---
    { type: 'SIZE', name: { pt: '4 Unidades', en: '4 Pieces', es: '4 Piezas', fr: '4 Pièces', de: '4 Stück', it: '4 Pezzi' }, quantity: 4 },
    { type: 'SIZE', name: { pt: '6 Unidades', en: '6 Pieces', es: '6 Piezas', fr: '6 Pièces', de: '6 Stück', it: '6 Pezzi' }, quantity: 6 },
    { type: 'SIZE', name: { pt: '8 Unidades', en: '8 Pieces', es: '8 Piezas', fr: '8 Pièces', de: '8 Stück', it: '8 Pezzi' }, quantity: 8 },
    { type: 'SIZE', name: { pt: '10 Unidades', en: '10 Pieces', es: '10 Piezas', fr: '10 Pièces', de: '10 Stück', it: '10 Pezzi' }, quantity: 10 },
    { type: 'SIZE', name: { pt: '20 Unidades', en: '20 Pieces', es: '20 Piezas', fr: '20 Pièces', de: '20 Stück', it: '20 Pezzi' }, quantity: 20 },

    // --- SABORES (FLAVOR) ---
    { type: 'FLAVOR', name: { pt: 'Limão', en: 'Lemon', es: 'Limón', fr: 'Citron', de: 'Zitrone', it: 'Limone' } },
    { type: 'FLAVOR', name: { pt: 'Pêssego', en: 'Peach', es: 'Melocotón', fr: 'Pêche', de: 'Pfirsich', it: 'Pesca' } },
    { type: 'FLAVOR', name: { pt: 'Morango', en: 'Strawberry', es: 'Fresa', fr: 'Fraise', de: 'Erdbeere', it: 'Fragola' } },
    { type: 'FLAVOR', name: { pt: 'Baunilha', en: 'Vanilla', es: 'Vainilla', fr: 'Vanille', de: 'Vanille', it: 'Vaniglia' } },
    { type: 'FLAVOR', name: { pt: 'Chocolate', en: 'Chocolate', es: 'Chocolate', fr: 'Chocolat', de: 'Schokolade', it: 'Cioccolato' } },
    { type: 'FLAVOR', name: { pt: 'Caramelo', en: 'Caramel', es: 'Caramelo', fr: 'Caramel', de: 'Karamell', it: 'Caramello' } },

    // --- CORES (COLOR - Pode ser útil para Merchandising de Restaurantes / Copos) ---
    { type: 'COLOR', name: { pt: 'Branco', en: 'White', es: 'Blanco', fr: 'Blanc', de: 'Weiß', it: 'Bianco' } },
    { type: 'COLOR', name: { pt: 'Preto', en: 'Black', es: 'Negro', fr: 'Noir', de: 'Schwarz', it: 'Nero' } },
    { type: 'COLOR', name: { pt: 'Vermelho', en: 'Red', es: 'Rojo', fr: 'Rouge', de: 'Rot', it: 'Rosso' } },
];

const GLOBAL_ADDONS: { name: MultiLangString }[] = [
    // --- INSTRUÇÕES GERAIS / DIETAS / ALERGIAS ---
    { name: { pt: 'Sem Glúten', en: 'Gluten-Free', es: 'Sin Gluten', fr: 'Sans Gluten', de: 'Glutenfrei', it: 'Senza Glutine' } },
    { name: { pt: 'Opção Vegan', en: 'Vegan Option', es: 'Opción Vegana', fr: 'Option Végane', de: 'Vegane Option', it: 'Opzione Vegana' } },
    { name: { pt: 'Sem Sal', en: 'No Salt', es: 'Sin Sal', fr: 'Sans Sel', de: 'Ohne Salz', it: 'Senza Sale' } },
    { name: { pt: 'Bem Quente', en: 'Very Hot', es: 'Muy Caliente', fr: 'Bien Chaud', de: 'Sehr Heiß', it: 'Molto Caldo' } },
    { name: { pt: 'Muito Picante', en: 'Extra Spicy', es: 'Muy Picante', fr: 'Très Épicé', de: 'Sehr Scharf', it: 'Molto Piccante' } },
    { name: { pt: 'Talheres de Plástico', en: 'Plastic Cutlery', es: 'Cubiertos', fr: 'Couverts', de: 'Besteck', it: 'Posate' } },

    // --- BEBIDAS & CAFÉ (Brunch / Cafetaria) ---
    { name: { pt: 'Sem Gelo', en: 'No Ice', es: 'Sin Hielo', fr: 'Sans Glace', de: 'Kein Eis', it: 'Senza Ghiaccio' } },
    { name: { pt: 'Com Gelo', en: 'With Ice', es: 'Con Hielo', fr: 'Avec Glace', de: 'Mit Eis', it: 'Con Ghiaccio' } },
    { name: { pt: 'Rodela de Limão', en: 'Lemon Slice', es: 'Rodaja de Limón', fr: 'Tranche de Citron', de: 'Zitronenscheibe', it: 'Fetta di Limone' } },
    { name: { pt: 'Descafeinado', en: 'Decaf', es: 'Descafeinado', fr: 'Décaféiné', de: 'Koffeinfrei', it: 'Decaffeinato' } },
    { name: { pt: 'Leite de Soja', en: 'Soy Milk', es: 'Leche de Soja', fr: 'Lait de Soja', de: 'Sojamilch', it: 'Latte di Soia' } },
    { name: { pt: 'Leite de Aveia', en: 'Oat Milk', es: 'Leche de Avena', fr: 'Lait d\'Avoine', de: 'Hafermilch', it: 'Latte di Avena' } },
    { name: { pt: 'Leite de Amêndoa', en: 'Almond Milk', es: 'Leche de Almendra', fr: 'Lait d\'Amande', de: 'Mandelmilch', it: 'Latte di Mandorla' } },
    { name: { pt: 'Extra Shot de Café', en: 'Extra Espresso Shot', es: 'Shot Extra', fr: 'Dose Supplémentaire', de: 'Extra Shot', it: 'Extra Shot' } },

    // --- PONTOS DA CARNE (Steakhouse / Burgers) ---
    { name: { pt: 'Mal Passado', en: 'Rare', es: 'Poco Hecho', fr: 'Saignant', de: 'Blutig', it: 'Al Sangue' } },
    { name: { pt: 'Médio', en: 'Medium', es: 'Al Punto', fr: 'À Point', de: 'Medium', it: 'Media Cottura' } },
    { name: { pt: 'Bem Passado', en: 'Well Done', es: 'Muy Hecho', fr: 'Bien Cuit', de: 'Durchgebraten', it: 'Ben Cotta' } },

    // --- BURGERS / SANDWICHES / KEBABS ---
    { name: { pt: 'Sem Cebola', en: 'No Onion', es: 'Sin Cebolla', fr: 'Sans Oignon', de: 'Keine Zwiebeln', it: 'Senza Cipolla' } },
    { name: { pt: 'Sem Tomate', en: 'No Tomato', es: 'Sin Tomate', fr: 'Sans Tomate', de: 'Keine Tomaten', it: 'Senza Pomodoro' } },
    { name: { pt: 'Sem Salada', en: 'No Salad', es: 'Sin Ensalada', fr: 'Sans Salade', de: 'Ohne Salat', it: 'Senza Insalata' } },
    { name: { pt: 'Extra Queijo', en: 'Extra Cheese', es: 'Extra Queso', fr: 'Supplément Fromage', de: 'Extra Käse', it: 'Extra Formaggio' } },
    { name: { pt: 'Extra Bacon', en: 'Extra Bacon', es: 'Extra Bacon', fr: 'Supplément Bacon', de: 'Extra Speck', it: 'Extra Pancetta' } },
    { name: { pt: 'Extra Hambúrguer', en: 'Double Patty', es: 'Doble Carne', fr: 'Double Steak', de: 'Doppeltes Fleisch', it: 'Doppio Hamburger' } },
    { name: { pt: 'Jalapeños', en: 'Jalapeños', es: 'Jalapeños', fr: 'Jalapeños', de: 'Jalapeños', it: 'Jalapeños' } },

    // --- PIZZA ---
    { name: { pt: 'Massa Fina', en: 'Thin Crust', es: 'Masa Fina', fr: 'Pâte Fine', de: 'Dünner Teig', it: 'Pasta Sottile' } },
    { name: { pt: 'Massa Alta', en: 'Thick Crust', es: 'Masa Gruesa', fr: 'Pâte Épaisse', de: 'Dicker Teig', it: 'Pasta Alta' } },
    { name: { pt: 'Borda Recheada', en: 'Stuffed Crust', es: 'Borde Relleno', fr: 'Croûte Fourrée', de: 'Gefüllter Rand', it: 'Bordo Ripieno' } },
    { name: { pt: 'Extra Mozzarella', en: 'Extra Mozzarella', es: 'Extra Mozzarella', fr: 'Supplément Mozzarella', de: 'Extra Mozzarella', it: 'Extra Mozzarella' } },
    { name: { pt: 'Extra Cogumelos', en: 'Extra Mushrooms', es: 'Extra Champiñones', fr: 'Supplément Champignons', de: 'Extra Pilze', it: 'Extra Funghi' } },

    // --- SUSHI & ASIÁTICO ---
    { name: { pt: 'Com Pauzinhos', en: 'With Chopsticks', es: 'Con Palillos', fr: 'Avec Baguettes', de: 'Mit Stäbchen', it: 'Con Bacchette' } },
    { name: { pt: 'Extra Soja', en: 'Extra Soy Sauce', es: 'Extra Soja', fr: 'Supplément Soja', de: 'Extra Sojasauce', it: 'Extra Soia' } },
    { name: { pt: 'Extra Soja Doce (Teriyaki)', en: 'Sweet Soy (Teriyaki)', es: 'Soja Dulce', fr: 'Soja Sucrée', de: 'Süße Sojasauce', it: 'Soia Dolce' } },
    { name: { pt: 'Extra Gengibre', en: 'Extra Ginger', es: 'Extra Jengibre', fr: 'Supplément Gingembre', de: 'Extra Ingwer', it: 'Extra Zenzero' } },
    { name: { pt: 'Extra Wasabi', en: 'Extra Wasabi', es: 'Extra Wasabi', fr: 'Supplément Wasabi', de: 'Extra Wasabi', it: 'Extra Wasabi' } },
    { name: { pt: 'Maionese Picante', en: 'Spicy Mayo', es: 'Mayonesa Picante', fr: 'Mayo Épicée', de: 'Scharfe Mayo', it: 'Maionese Piccante' } },

    // --- MOLHOS (Para Acompanhamentos) ---
    { name: { pt: 'Ketchup', en: 'Ketchup', es: 'Kétchup', fr: 'Ketchup', de: 'Ketchup', it: 'Ketchup' } },
    { name: { pt: 'Maionese', en: 'Mayonnaise', es: 'Mayonesa', fr: 'Mayonnaise', de: 'Mayonnaise', it: 'Maionese' } },
    { name: { pt: 'Mostarda', en: 'Mustard', es: 'Mostaza', fr: 'Moutarde', de: 'Senf', it: 'Senape' } },
    { name: { pt: 'Molho BBQ', en: 'BBQ Sauce', es: 'Salsa Barbacoa', fr: 'Sauce Barbecue', de: 'BBQ-Sauce', it: 'Salsa BBQ' } },
    { name: { pt: 'Maionese de Alho', en: 'Garlic Mayo', es: 'Mayonesa de Ajo', fr: 'Mayo à l\'ail', de: 'Knoblauch-Mayo', it: 'Maionese all\'Aglio' } },
    { name: { pt: 'Molho à Parte', en: 'Sauce on the Side', es: 'Salsa Aparte', fr: 'Sauce à part', de: 'Soße extra', it: 'Salsa a parte' } },

    // --- ACOMPANHAMENTOS GERAIS (Podem ser usados como addons em pratos) ---
    { name: { pt: 'Batata Frita', en: 'French Fries', es: 'Patatas Fritas', fr: 'Frites', de: 'Pommes Frites', it: 'Patatine Fritte' } },
    { name: { pt: 'Arroz Branco', en: 'White Rice', es: 'Arroz Blanco', fr: 'Riz Blanc', de: 'Weißer Reis', it: 'Riso Bianco' } },
    { name: { pt: 'Salada Mista', en: 'Mixed Salad', es: 'Ensalada Mixta', fr: 'Salade Mixte', de: 'Gemischter Salat', it: 'Insalata Mista' } },
];

// ============================================
// HELPERS
// ============================================

async function seedGlobalVariants() {
    console.log('🌍 A criar Variantes Globais (PT, EN, ES, FR, DE, IT)...');

    for (const variant of GLOBAL_VARIANTS) {
        // Busca pela tradução 'pt' para verificar se já existe
        const exists = await prisma.variantOption.findFirst({
            where: { translations: { some: { locale: 'pt', name: variant.name.pt } }, isGlobal: true }
        });

        if (!exists) {
            await prisma.variantOption.create({
                data: {
                    type: variant.type,
                    isGlobal: true,
                    unit: variant.unit,
                    quantity: variant.quantity,
                    translations: {
                        create: [
                            { locale: 'pt', name: variant.name.pt },
                            { locale: 'en', name: variant.name.en },
                            { locale: 'es', name: variant.name.es },
                            { locale: 'fr', name: variant.name.fr },
                            { locale: 'de', name: variant.name.de },
                            { locale: 'it', name: variant.name.it },
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
            where: { translations: { some: { locale: 'pt', name: addon.name.pt } }, isGlobal: true }
        });

        if (!exists) {
            await prisma.addon.create({
                data: {
                    isGlobal: true,
                    translations: {
                        create: [
                            { locale: 'pt', name: addon.name.pt },
                            { locale: 'en', name: addon.name.en },
                            { locale: 'es', name: addon.name.es },
                            { locale: 'fr', name: addon.name.fr },
                            { locale: 'de', name: addon.name.de },
                            { locale: 'it', name: addon.name.it },
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