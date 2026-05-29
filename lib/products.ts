import { prisma } from './prisma.js';

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const uniqueSlug = async (name: string) => {
  const baseSlug = slugify(name) || `product-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.products.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

const parseOptions = (value?: string | null) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return value.split(',').map((option) => option.trim()).filter(Boolean);
  }
};

export const mapPersonalizationFields = (fields: any[] = []) =>
  fields
    .slice()
    .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
    .map((field) => ({
      id: field.id,
      label: field.label,
      fieldKey: field.field_key,
      type: field.field_type,
      required: Boolean(field.required),
      placeholder: field.placeholder || '',
      helpText: field.help_text || '',
      maxLength: field.max_length ?? null,
      options: parseOptions(field.options_json),
      defaultValue: field.default_value || '',
      sortOrder: Number(field.sort_order || 0),
    }));

export const defaultPersonalizationFieldCreateData = () => [
  {
    label: "Baby's Name",
    field_key: 'babyName',
    field_type: 'text',
    required: true,
    placeholder: 'e.g. Liam',
    max_length: 32,
    sort_order: 0,
  },
  {
    label: 'Thread Color',
    field_key: 'threadColor',
    field_type: 'color',
    required: true,
    options_json: JSON.stringify(['#D4AF37', '#FFC0CB', '#ADD8E6', '#F5F5DC', '#98FF98']),
    sort_order: 1,
  },
  {
    label: 'Font Style',
    field_key: 'fontStyle',
    field_type: 'select',
    required: false,
    options_json: JSON.stringify(['Classic Script', 'Modern Serif', 'Soft Rounded']),
    sort_order: 2,
  },
];

const ALLOWED_PERSONALIZATION_FIELD_TYPES = ['text', 'color', 'select', 'date'];

const DEFAULT_FIELD_OPTIONS: Record<string, string[]> = {
  color: ['#D4AF37', '#FFC0CB', '#ADD8E6', '#F5F5DC', '#98FF98'],
  select: ['Classic Script', 'Modern Serif', 'Soft Rounded'],
};

const sanitizeString = (value: unknown, limit = 120) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, limit);

const toFieldKey = (value: unknown, fallback: string) => {
  const source = sanitizeString(value, 80) || fallback;
  const key = source
    .replace(/['"]/g, '')
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, character: string) => character.toUpperCase())
    .replace(/^[^a-zA-Z]+/, '');
  const normalized = key ? key.charAt(0).toLowerCase() + key.slice(1) : fallback;
  return normalized.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 60) || fallback;
};

const uniqueFieldKey = (key: string, usedKeys: Set<string>) => {
  let nextKey = key;
  let counter = 2;

  while (usedKeys.has(nextKey)) {
    nextKey = `${key}${counter}`;
    counter += 1;
  }

  usedKeys.add(nextKey);
  return nextKey;
};

const normalizeOptions = (value: unknown, type: string) => {
  const rawOptions = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? parseOptions(value)
      : [];

  const options = [...new Set(rawOptions.map((option) => sanitizeString(option, 80)).filter(Boolean))].slice(0, 20);

  if ((type === 'color' || type === 'select') && options.length === 0) {
    return DEFAULT_FIELD_OPTIONS[type];
  }

  return options;
};

export const normalizePersonalizationFieldCreateData = (fields: any[] = []) => {
  const sourceFields = Array.isArray(fields) ? fields : [];
  const usedKeys = new Set<string>();
  const normalizedFields = sourceFields
    .map((field, index) => {
      const label = sanitizeString(field?.label, 80);
      if (!label) return null;

      const fieldType = ALLOWED_PERSONALIZATION_FIELD_TYPES.includes(field?.type)
        ? field.type
        : 'text';
      const fieldKey = uniqueFieldKey(
        toFieldKey(field?.fieldKey || label, `field${index + 1}`),
        usedKeys,
      );
      const maxLength = Number(field?.maxLength);
      const options = normalizeOptions(field?.options, fieldType);

      return {
        label,
        field_key: fieldKey,
        field_type: fieldType,
        required: Boolean(field?.required),
        placeholder: sanitizeString(field?.placeholder, 120) || null,
        help_text: sanitizeString(field?.helpText, 160) || null,
        max_length:
          fieldType === 'text' && Number.isFinite(maxLength)
            ? Math.min(Math.max(Math.round(maxLength), 1), 120)
            : null,
        options_json:
          fieldType === 'color' || fieldType === 'select'
            ? JSON.stringify(options)
            : null,
        default_value: sanitizeString(field?.defaultValue, 120) || null,
        sort_order: index,
      };
    })
    .filter(Boolean);

  return normalizedFields.length
    ? normalizedFields
    : defaultPersonalizationFieldCreateData();
};

export const mapProductPersonalizationFields = (product: any) => {
  const mappedFields = mapPersonalizationFields(product.personalization_fields || []);

  if (!product.personalization_required || mappedFields.length) {
    return mappedFields;
  }

  return mapPersonalizationFields(
    defaultPersonalizationFieldCreateData().map((field, index) => ({
      id: `default-${index}`,
      ...field,
    })),
  );
};

export const mapProductForStorefront = (product: any) => {
  const primaryImage =
    product.images?.find((image: any) => image.is_primary) ||
    product.images?.[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    price: Number(product.price),
    salePrice: product.sale_price ? Number(product.sale_price) : null,
    sku: product.sku || '',
    stockQuantity: product.stock_quantity || 0,
    imageUrl: primaryImage?.image_url || '',
    bgImage:
      product.card_bg_image ||
      product.sku ||
      '/product-card-cloud-blue.png',
    badge: product.bestseller
      ? 'Bestseller'
      : product.new_arrival
        ? 'New'
        : undefined,
    personalizationRequired: product.personalization_required,
    personalizationFields: mapProductPersonalizationFields(product),
    status: product.status,
    featured: product.featured,
    newArrival: product.new_arrival,
    bestseller: product.bestseller,
    genderTag: product.gender_tag || '',
    ageRange: product.age_range || '',
    material: product.material || '',
    careInstructions: product.care_instructions || '',
    preparationTime: product.preparation_time || '',
  };
};
