import { prisma } from './prisma.js';

const CATALOG_IMPORT_ID = 'curated-catalog-2026-07-29-v1';
const CATALOG_LOCK_ID = 7292026;

const newbornSizes = ['Newborn', '0-3M', '3-6M'];
const babySizes = ['3-6M', '6-12M', '12-18M', '18-24M'];
const birthdayShirtSizes = ['6M', '12M', '18M', '2T', '3T', '4T', '5T'];
const birthdayNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const selectField = (
  label: string,
  fieldKey: string,
  options: string[],
  sortOrder: number,
  helpText?: string,
) => ({
  label,
  field_key: fieldKey,
  field_type: 'select',
  required: true,
  placeholder: null,
  help_text: helpText || null,
  max_length: null,
  options_json: JSON.stringify(options),
  default_value: options[0] || null,
  sort_order: sortOrder,
});

const nameField = (sortOrder = 0) => ({
  label: "Baby's Name",
  field_key: 'babyName',
  field_type: 'text',
  required: true,
  placeholder: 'e.g. Olivia',
  help_text: 'Enter the name exactly as it should appear on the garment.',
  max_length: 18,
  options_json: null,
  default_value: null,
  sort_order: sortOrder,
});

const birthdayFields = () => [
  nameField(0),
  selectField('Birthday Number', 'birthdayNumber', birthdayNumbers, 1),
  selectField('Garment Size', 'garmentSize', birthdayShirtSizes, 2, 'Choose the size your child currently wears.'),
];

const sizeField = (options: string[], sortOrder = 0) =>
  selectField('Garment Size', 'garmentSize', options, sortOrder, 'Choose the size your baby currently wears.');

type CatalogProduct = {
  name: string;
  slug: string;
  description: string;
  price: number;
  sku: string;
  imageUrl: string;
  categorySlug: string;
  bgImage: string;
  featured?: boolean;
  bestseller?: boolean;
  genderTag: 'boy' | 'girl' | 'neutral';
  ageRange: string;
  material: string;
  careInstructions: string;
  preparationTime: string;
  personalizationFields: ReturnType<typeof selectField>[];
};

const categories = [
  {
    name: 'Personalized Birthday Shirts',
    slug: 'personalized-birthday-shirts',
    description: 'Custom name-and-number birthday shirts designed for memorable milestone celebrations.',
    imageUrl: '/catalog/personalized-dinosaur-first-birthday-shirt.webp',
  },
  {
    name: 'Newborn Photo Outfits',
    slug: 'newborn-photo-outfits',
    description: 'Coordinated newborn rompers, tutus and headband sets for supervised portraits and special occasions.',
    imageUrl: '/catalog/white-lace-heirloom-romper-headband.webp',
  },
  {
    name: 'Birthday Tutu Sets',
    slug: 'birthday-tutu-sets',
    description: 'Statement tutu outfits for first birthdays, cake smashes and keepsake photographs.',
    imageUrl: '/catalog/personalized-ladybug-first-birthday-tutu-set.webp',
  },
];

export const CURATED_CATALOG: CatalogProduct[] = [
  {
    name: 'Ivory Tulle Newborn Tutu & Flower Headband Set',
    slug: 'ivory-tulle-newborn-tutu-flower-headband-set',
    description: 'A soft ivory tulle tutu and floral headband pairing created for newborn portraits, baby showers and special announcements. This decorative photo outfit is intended for supervised wear and is not sleepwear.',
    price: 34,
    sku: 'MBS-2026-CATALOG-01',
    imageUrl: '/catalog/ivory-tulle-newborn-tutu.webp',
    categorySlug: 'newborn-photo-outfits',
    bgImage: 'card-design:classic:rounded:peach',
    featured: true,
    genderTag: 'girl',
    ageRange: 'Newborn to 3-6 months',
    material: 'Soft layered tulle with a stretch waistband and decorative floral headband',
    careInstructions: 'Hand wash cold and lay flat to dry. Remove headband before sleep. Adult supervision required.',
    preparationTime: '1-3 business days',
    personalizationFields: [sizeField(newbornSizes)],
  },
  {
    name: 'Personalized Dinosaur Birthday Number Shirt',
    slug: 'personalized-dinosaur-birthday-number-shirt',
    description: 'A colorful dinosaur-themed birthday shirt customized with your child’s name and birthday number. The bold applique-style design makes it a playful choice for parties, portraits and cake-smash celebrations.',
    price: 29,
    sku: 'MBS-2026-CATALOG-02',
    imageUrl: '/catalog/personalized-dinosaur-birthday-number-shirt.webp',
    categorySlug: 'personalized-birthday-shirts',
    bgImage: 'card-design:classic:rounded:blue',
    featured: true,
    genderTag: 'boy',
    ageRange: '6 months to 5T',
    material: 'Soft cotton-blend shirt with layered fabric applique details',
    careInstructions: 'Machine wash cold inside out on a gentle cycle. Tumble dry low. Do not iron directly on the design.',
    preparationTime: '3-5 business days',
    personalizationFields: birthdayFields(),
  },
  {
    name: 'Midnight Ruffle Romper & Bow Headband Set',
    slug: 'midnight-ruffle-romper-bow-headband-set',
    description: 'An elegant black romper with a soft ruffled neckline and matching oversized bow headband. Designed for supervised milestone photos, family celebrations and modern baby portraits.',
    price: 28,
    sku: 'MBS-2026-CATALOG-03',
    imageUrl: '/catalog/midnight-ruffle-romper-bow-set.webp',
    categorySlug: 'newborn-photo-outfits',
    bgImage: 'card-design:classic:rounded:lavender',
    genderTag: 'girl',
    ageRange: 'Newborn to 18-24 months',
    material: 'Soft stretch romper with decorative lace-look ruffle and coordinating bow headband',
    careInstructions: 'Hand wash cold and lay flat to dry. Remove headband before sleep. Adult supervision required.',
    preparationTime: '1-3 business days',
    personalizationFields: [sizeField(babySizes)],
  },
  {
    name: 'Black Lace Back-Bow Newborn Romper Set',
    slug: 'black-lace-back-bow-newborn-romper-set',
    description: 'A dramatic black newborn romper featuring lace-look sleeves, a statement back bow and coordinating headband. Ideal for carefully supervised newborn photography and special occasion portraits.',
    price: 32,
    sku: 'MBS-2026-CATALOG-04',
    imageUrl: '/catalog/black-lace-back-bow-newborn-romper.webp',
    categorySlug: 'newborn-photo-outfits',
    bgImage: 'card-design:classic:rounded:rose',
    genderTag: 'girl',
    ageRange: 'Newborn to 3-6 months',
    material: 'Soft stretch romper with decorative lace-look sleeves, satin-look bow and matching headband',
    careInstructions: 'Hand wash cold and lay flat to dry. Remove headband before sleep. Adult supervision required.',
    preparationTime: '1-3 business days',
    personalizationFields: [sizeField(newbornSizes)],
  },
  {
    name: 'Personalized Blue Gingham First Birthday Shirt',
    slug: 'personalized-blue-gingham-first-birthday-shirt',
    description: 'A clean blue gingham number-one birthday shirt personalized with your child’s name. Its classic palette works beautifully for first birthday parties, portraits and family gatherings.',
    price: 29,
    sku: 'MBS-2026-CATALOG-05',
    imageUrl: '/catalog/personalized-blue-gingham-first-birthday-shirt.webp',
    categorySlug: 'personalized-birthday-shirts',
    bgImage: 'card-design:classic:rounded:mint',
    genderTag: 'boy',
    ageRange: '6 months to 5T',
    material: 'Soft cotton-blend shirt with gingham-style fabric applique detail',
    careInstructions: 'Machine wash cold inside out on a gentle cycle. Tumble dry low. Do not iron directly on the design.',
    preparationTime: '3-5 business days',
    personalizationFields: birthdayFields(),
  },
  {
    name: 'White Lace Heirloom Romper & Headband Set',
    slug: 'white-lace-heirloom-romper-headband-set',
    description: 'A white lace-look romper with a statement satin-look back bow, pearl-style centerpiece and matching flower headband. A refined choice for newborn portraits, dedications and keepsake photos.',
    price: 36,
    sku: 'MBS-2026-CATALOG-06',
    imageUrl: '/catalog/white-lace-heirloom-romper-headband.webp',
    categorySlug: 'newborn-photo-outfits',
    bgImage: 'card-design:classic:rounded:butter',
    featured: true,
    genderTag: 'girl',
    ageRange: 'Newborn to 3-6 months',
    material: 'Soft stretch romper with decorative lace-look overlay, satin-look bow and matching headband',
    careInstructions: 'Hand wash cold and lay flat to dry. Remove headband before sleep. Adult supervision required.',
    preparationTime: '1-3 business days',
    personalizationFields: [sizeField(newbornSizes)],
  },
  {
    name: 'Personalized Dinosaur First Birthday Shirt',
    slug: 'personalized-dinosaur-first-birthday-shirt',
    description: 'A cheerful dinosaur first birthday shirt customized with your child’s name. The bright number-one design is made for birthday photos, party outfits and cake-smash memories.',
    price: 31,
    sku: 'MBS-2026-CATALOG-07',
    imageUrl: '/catalog/personalized-dinosaur-first-birthday-shirt.webp',
    categorySlug: 'personalized-birthday-shirts',
    bgImage: 'card-design:classic:rounded:blue',
    genderTag: 'boy',
    ageRange: '6 months to 5T',
    material: 'Soft cotton-blend shirt with layered dinosaur applique details',
    careInstructions: 'Machine wash cold inside out on a gentle cycle. Tumble dry low. Do not iron directly on the design.',
    preparationTime: '3-5 business days',
    personalizationFields: birthdayFields(),
  },
  {
    name: 'Personalized Space First Birthday Shirt',
    slug: 'personalized-space-first-birthday-shirt',
    description: 'A galaxy-inspired birthday shirt featuring a ringed planet, stars and a customizable name-and-number design. A standout choice for a first trip around the sun celebration.',
    price: 31,
    sku: 'MBS-2026-CATALOG-08',
    imageUrl: '/catalog/personalized-space-first-birthday-shirt.webp',
    categorySlug: 'personalized-birthday-shirts',
    bgImage: 'card-design:classic:rounded:lavender',
    genderTag: 'neutral',
    ageRange: '6 months to 5T',
    material: 'Soft cotton-blend shirt with layered space-themed applique details',
    careInstructions: 'Machine wash cold inside out on a gentle cycle. Tumble dry low. Do not iron directly on the design.',
    preparationTime: '3-5 business days',
    personalizationFields: birthdayFields(),
  },
  {
    name: 'Personalized Ladybug First Birthday Tutu Set',
    slug: 'personalized-ladybug-first-birthday-tutu-set',
    description: 'A complete ladybug-themed first birthday outfit with a personalized name-and-number shirt, full red-and-black tutu and coordinating floral headband. Made for cake smashes, party entrances and keepsake portraits.',
    price: 46,
    sku: 'MBS-2026-CATALOG-09',
    imageUrl: '/catalog/personalized-ladybug-first-birthday-tutu-set.webp',
    categorySlug: 'birthday-tutu-sets',
    bgImage: 'card-design:classic:rounded:rose',
    bestseller: true,
    genderTag: 'girl',
    ageRange: '6 months to 3T',
    material: 'Soft cotton-blend shirt with layered tulle tutu and coordinating decorative headband',
    careInstructions: 'Hand wash cold. Lay tutu flat to dry and fluff layers by hand. Remove headband before sleep. Adult supervision required.',
    preparationTime: '3-5 business days',
    personalizationFields: [
      nameField(0),
      selectField('Birthday Number', 'birthdayNumber', birthdayNumbers, 1),
      sizeField(['6-12M', '12-18M', '18-24M', '2T', '3T'], 2),
    ],
  },
  {
    name: 'Newborn Tutu & Bow Photo Outfit Color Collection',
    slug: 'newborn-tutu-bow-photo-outfit-color-collection',
    description: 'A newborn portrait outfit offered in four soft color stories: ivory, white, blush and lavender. Each selection pairs a fluffy tulle tutu with a coordinating bow headband for supervised newborn photography.',
    price: 34,
    sku: 'MBS-2026-CATALOG-10',
    imageUrl: '/catalog/newborn-tutu-bow-photo-outfit-color-collection.webp',
    categorySlug: 'newborn-photo-outfits',
    bgImage: 'card-design:classic:rounded:peach',
    genderTag: 'girl',
    ageRange: 'Newborn to 3-6 months',
    material: 'Soft layered tulle with a stretch waistband and coordinating bow headband',
    careInstructions: 'Hand wash cold and lay flat to dry. Remove headband before sleep. Adult supervision required.',
    preparationTime: '1-3 business days',
    personalizationFields: [
      selectField('Outfit Color', 'outfitColor', ['Ivory', 'White', 'Blush', 'Lavender'], 0),
      sizeField(newbornSizes, 1),
    ],
  },
  {
    name: 'Personalized Cowboy Birthday Shirt',
    slug: 'personalized-cowboy-birthday-shirt',
    description: 'A western birthday shirt personalized with your child’s name and birthday number. The bandana-inspired number, cowboy hat and neckerchief details are ready for a rodeo-themed celebration.',
    price: 32,
    sku: 'MBS-2026-CATALOG-11',
    imageUrl: '/catalog/personalized-cowboy-birthday-shirt.webp',
    categorySlug: 'personalized-birthday-shirts',
    bgImage: 'card-design:classic:rounded:butter',
    genderTag: 'boy',
    ageRange: '6 months to 5T',
    material: 'Soft cotton-blend shirt with layered western applique details',
    careInstructions: 'Machine wash cold inside out on a gentle cycle. Tumble dry low. Do not iron directly on the design.',
    preparationTime: '3-5 business days',
    personalizationFields: birthdayFields(),
  },
];

const createImportStateTable = async (tx: any) => {
  await tx.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "catalog_imports" (
      "id" TEXT PRIMARY KEY,
      "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const applyCuratedCatalog = async () =>
  prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${CATALOG_LOCK_ID})`);
      await createImportStateTable(tx);

      const alreadyApplied = (await tx.$queryRawUnsafe(
        'SELECT "id" FROM "catalog_imports" WHERE "id" = $1 LIMIT 1',
        CATALOG_IMPORT_ID,
      )) as Array<{ id: string }>;

      if (alreadyApplied.length) {
        return { applied: false, createdOrUpdated: 0, deleted: 0, archived: 0 };
      }

      const categoryIds = new Map<string, string>();
      for (const category of categories) {
        const savedCategory = await tx.categories.upsert({
          where: { slug: category.slug },
          update: {
            name: category.name,
            description: category.description,
            image_url: category.imageUrl,
          },
          create: {
            name: category.name,
            slug: category.slug,
            description: category.description,
            image_url: category.imageUrl,
          },
        });
        categoryIds.set(category.slug, savedCategory.id);
      }

      for (const item of CURATED_CATALOG) {
        const categoryId = categoryIds.get(item.categorySlug) || null;
        const scalarData = {
          name: item.name,
          description: item.description,
          price: item.price,
          sale_price: null,
          sku: item.sku,
          card_bg_image: item.bgImage,
          category_id: categoryId,
          stock_quantity: 0,
          status: 'active',
          featured: Boolean(item.featured),
          new_arrival: true,
          bestseller: Boolean(item.bestseller),
          gender_tag: item.genderTag,
          age_range: item.ageRange,
          material: item.material,
          care_instructions: item.careInstructions,
          preparation_time: item.preparationTime,
          personalization_required: true,
        };
        const imageData = {
          image_url: item.imageUrl,
          public_id: null,
          alt_text: item.name,
          is_primary: true,
          sort_order: 0,
        };

        await tx.products.upsert({
          where: { slug: item.slug },
          update: {
            ...scalarData,
            images: { deleteMany: {}, create: [imageData] },
            personalization_fields: {
              deleteMany: {},
              create: item.personalizationFields,
            },
          },
          create: {
            ...scalarData,
            slug: item.slug,
            images: { create: [imageData] },
            personalization_fields: { create: item.personalizationFields },
          },
        });
      }

      const curatedSlugs = CURATED_CATALOG.map((item) => item.slug);
      const obsoleteProducts = await tx.products.findMany({
        where: { slug: { notIn: curatedSlugs } },
        select: {
          id: true,
          _count: { select: { order_items: true } },
        },
      });

      let deleted = 0;
      let archived = 0;
      for (const product of obsoleteProducts) {
        await tx.cart_items.deleteMany({ where: { product_id: product.id } });

        if (product._count.order_items > 0) {
          await tx.products.update({
            where: { id: product.id },
            data: {
              status: 'archived',
              featured: false,
              new_arrival: false,
              bestseller: false,
            },
          });
          archived += 1;
        } else {
          await tx.products.delete({ where: { id: product.id } });
          deleted += 1;
        }
      }

      await tx.$executeRawUnsafe(
        'INSERT INTO "catalog_imports" ("id") VALUES ($1) ON CONFLICT ("id") DO NOTHING',
        CATALOG_IMPORT_ID,
      );

      return {
        applied: true,
        createdOrUpdated: CURATED_CATALOG.length,
        deleted,
        archived,
      };
    },
    { maxWait: 10_000, timeout: 30_000 },
  );

let catalogPromise: ReturnType<typeof applyCuratedCatalog> | null = null;

export const ensureCuratedCatalog = async () => {
  if (!catalogPromise) {
    catalogPromise = applyCuratedCatalog().catch((error) => {
      catalogPromise = null;
      throw error;
    });
  }

  return catalogPromise;
};

export const isCuratedCatalogReadRequest = (method: string, path: string) => {
  if (method.toUpperCase() !== 'GET') return false;
  return (
    path === '/api/products' ||
    path.startsWith('/api/products/') ||
    path === '/api/admin/products'
  );
};
