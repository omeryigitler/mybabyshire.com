import { prisma } from './prisma.js';
import { mapProductVariant } from './variants.js';

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
    label: 'Custom Text',
    field_key: 'customText',
    field_type: 'text',
    required: true,
    placeholder: 'Enter text',
    max_length: 32,
    sort_order: 0,
  },
  {
    label: 'Detail Color',
    field_key: 'detailColor',
    field_type: 'color',
    required: false,
    options_json: JSON.stringify(['#202020', '#F1DADF', '#DCEAF0']),
    sort_order: 1,
  },
  {
    label: 'Style Option',
    field_key: 'styleOption',
    field_type: 'select',
    required: false,
    options_json: JSON.stringify(['Option 1', 'Option 2']),
    sort_order: 2,
  },
];

const ALLOWED_PERSONALIZATION_FIELD_TYPES = ['text', 'color', 'select', 'date'];

const DEFAULT_FIELD_OPTIONS: Record<string, string[]> = {
  color: ['#202020', '#F1DADF', '#DCEAF0'],
  select: ['Option 1', 'Option 2'],
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

const clampImageFocus = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number * 100) / 100)) : 50;
};

const clampImageZoom = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(1, Math.min(5, Math.round(number * 100) / 100)) : 1;
};

const parseCrop = (value: any) => {
  const cropX = Number(value?.cropX);
  const cropY = Number(value?.cropY);
  const cropWidth = Number(value?.cropWidth);
  const cropHeight = Number(value?.cropHeight);
  if (![cropX, cropY, cropWidth, cropHeight].every(Number.isFinite)) return null;
  if (cropWidth <= 0 || cropHeight <= 0 || cropX < 0 || cropY < 0 || cropX + cropWidth > 100.1 || cropY + cropHeight > 100.1) return null;
  return {
    cropX: clampImageFocus(cropX),
    cropY: clampImageFocus(cropY),
    cropWidth: Math.max(0.1, Math.min(100, Math.round(cropWidth * 100) / 100)),
    cropHeight: Math.max(0.1, Math.min(100, Math.round(cropHeight * 100) / 100)),
  };
};

export const parseProductImageFocus = (image: any) => {
  const fallback = { focusX: 50, focusY: 50, zoom: 1, cropX: undefined, cropY: undefined, cropWidth: undefined, cropHeight: undefined };
  const raw = String(image?.alt_text || '').trim();
  if (!raw.startsWith('{')) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.mbsImageFocus !== 1) return fallback;
    const crop = parseCrop(parsed);
    return {
      focusX: clampImageFocus(parsed.focusX),
      focusY: clampImageFocus(parsed.focusY),
      zoom: clampImageZoom(parsed.zoom),
      cropX: crop?.cropX,
      cropY: crop?.cropY,
      cropWidth: crop?.cropWidth,
      cropHeight: crop?.cropHeight,
    };
  } catch {
    return fallback;
  }
};

export const encodeProductImageFocus = (image: any) => {
  const crop = parseCrop(image);
  return JSON.stringify({
    mbsImageFocus: 1,
    focusX: clampImageFocus(image?.focusX),
    focusY: clampImageFocus(image?.focusY),
    zoom: clampImageZoom(image?.zoom),
    ...(crop || {}),
  });
};

export const mapProductForStorefront = (product: any) => {
  const orderedImages = (product.images || []).slice().sort((left: any, right: any) => Number(left.sort_order || 0) - Number(right.sort_order || 0));
  const primaryImage = orderedImages.find((image: any) => image.is_primary) || orderedImages[0];
  const secondaryImage = orderedImages.find((image: any) => image.id !== primaryImage?.id);
  const primaryFocus = parseProductImageFocus(primaryImage);
  const secondaryFocus = parseProductImageFocus(secondaryImage);
  const variants = (product.variants || [])
    .filter((variant: any) => variant.active !== false)
    .sort((left: any, right: any) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
    .map(mapProductVariant);
  const variantStock = variants.reduce((sum: number, variant: any) => sum + Number(variant.stockQuantity || 0), 0);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    price: Number(product.price),
    salePrice: product.sale_price ? Number(product.sale_price) : null,
    categoryId: product.category_id || null,
    categoryName: product.category?.name || null,
    sku: product.sku || '',
    stockQuantity: variants.length ? variantStock : product.stock_quantity || 0,
    variants,
    imageUrl: primaryImage?.image_url || '',
    hoverImageUrl: secondaryImage?.image_url || '',
    imageFocusX: primaryFocus.focusX,
    imageFocusY: primaryFocus.focusY,
    imageZoom: primaryFocus.zoom,
    imageCropX: primaryFocus.cropX,
    imageCropY: primaryFocus.cropY,
    imageCropWidth: primaryFocus.cropWidth,
    imageCropHeight: primaryFocus.cropHeight,
    hoverImageFocusX: secondaryFocus.focusX,
    hoverImageFocusY: secondaryFocus.focusY,
    hoverImageZoom: secondaryFocus.zoom,
    hoverImageCropX: secondaryFocus.cropX,
    hoverImageCropY: secondaryFocus.cropY,
    hoverImageCropWidth: secondaryFocus.cropWidth,
    hoverImageCropHeight: secondaryFocus.cropHeight,
    bgImage: product.card_bg_image || '',
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
