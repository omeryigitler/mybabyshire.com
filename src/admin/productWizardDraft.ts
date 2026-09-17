import { DEFAULT_CARD_DESIGN, type CardCloudShapeId, type CardColorId, type CardPanelShapeId } from '../utils/cardDesign';
import { DEFAULT_PRODUCT_FIELDS, type PersonalizationBuilderField } from './PersonalizationFieldBuilder';

export type ProductWizardImage = {
  url: string;
  id: string;
  publicId?: string;
  focusX?: number;
  focusY?: number;
};
export type ProductWizardBadge = 'none' | 'featured' | 'newArrival' | 'bestseller';

export type ProductWizardDraft = {
  name: string;
  description: string;
  images: ProductWizardImage[];
  price: string;
  salePrice: string;
  sku: string;
  stockQuantity: string;
  ageRange: string;
  material: string;
  preparationTime: string;
  careInstructions: string;
  categoryId: string;
  status: 'active' | 'draft';
  promotionBadge: ProductWizardBadge;
  cloudShape: CardCloudShapeId;
  panelShape: CardPanelShapeId;
  cardColor: CardColorId;
  createCloudVariants: boolean;
  personalizationRequired: boolean;
  personalizationFields: PersonalizationBuilderField[];
};

const STORAGE_KEY = 'mybabyshire-product-wizard-v1';

export const createEmptyProductWizardDraft = (): ProductWizardDraft => ({
  name: '', description: '', images: [], price: '', salePrice: '', sku: '', stockQuantity: '0',
  ageRange: '', material: '', preparationTime: '', careInstructions: '', categoryId: '',
  status: 'active', promotionBadge: 'none', cloudShape: DEFAULT_CARD_DESIGN.cloud,
  panelShape: DEFAULT_CARD_DESIGN.panel, cardColor: DEFAULT_CARD_DESIGN.color,
  createCloudVariants: false, personalizationRequired: false,
  personalizationFields: DEFAULT_PRODUCT_FIELDS.map((field) => ({ ...field, options: field.options ? [...field.options] : undefined })),
});

export const readProductWizardDraft = (): ProductWizardDraft => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? { ...createEmptyProductWizardDraft(), ...JSON.parse(saved) } : createEmptyProductWizardDraft();
  } catch {
    return createEmptyProductWizardDraft();
  }
};

export const writeProductWizardDraft = (draft: ProductWizardDraft) => sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
export const clearProductWizardDraft = () => sessionStorage.removeItem(STORAGE_KEY);

export const validateProductWizardStep = (draft: ProductWizardDraft, step: number): string[] => {
  const issues: string[] = [];
  if (step === 1) {
    if (draft.name.trim().length < 3) issues.push('Product name is required and must be at least 3 characters.');
    if (draft.description.trim().length < 20) issues.push('Add a complete customer-facing description of at least 20 characters.');
  }
  if (step === 2 && !draft.images[0]?.url) issues.push('Upload one product image before continuing.');
  if (step === 3) {
    const price = Number(draft.price);
    const stock = Number(draft.stockQuantity);
    if (!Number.isFinite(price) || price <= 0) issues.push('Enter a valid selling price greater than $0.');
    if (!Number.isInteger(stock) || stock < 0) issues.push('Stock quantity must be a whole number of 0 or more.');
    if (draft.salePrice) {
      const comparePrice = Number(draft.salePrice);
      if (!Number.isFinite(comparePrice) || comparePrice <= 0) issues.push('Compare-at price must be a valid amount greater than $0.');
    }
  }
  if (step === 4) {
    if (!draft.ageRange.trim()) issues.push('Size / age range is required.');
    if (!draft.material.trim()) issues.push('Material is required.');
    if (!draft.preparationTime.trim()) issues.push('Preparation time is required.');
    if (!draft.careInstructions.trim()) issues.push('Care instructions are required.');
  }
  if (step === 5) {
    if (!draft.categoryId) issues.push('Choose a product category.');
    if (!draft.status) issues.push('Choose Active or Draft status.');
  }
  if (step === 6 && (!draft.cloudShape || !draft.panelShape || !draft.cardColor)) issues.push('Storefront display defaults are incomplete.');
  if (step === 7 && draft.personalizationRequired) {
    if (!draft.personalizationFields.length) issues.push('Add at least one customization field or turn off customization.');
    const keys = new Set<string>();
    draft.personalizationFields.forEach((field, index) => {
      const number = index + 1;
      const key = field.fieldKey.trim();
      if (!field.label.trim()) issues.push(`Field ${number}: label is required.`);
      if (!key) issues.push(`Field ${number}: field key is required.`);
      if (key && keys.has(key)) issues.push(`Field ${number}: field key must be unique.`);
      if (key) keys.add(key);
      if ((field.type === 'select' || field.type === 'color') && (!field.options || field.options.length === 0)) issues.push(`Field ${number}: add at least one option.`);
      if (field.type === 'text' && field.maxLength != null && field.maxLength < 1) issues.push(`Field ${number}: max length must be at least 1.`);
    });
  }
  return issues;
};

export const validateProductWizardThrough = (draft: ProductWizardDraft, throughStep = 7): string[] => {
  const issues: string[] = [];
  for (let step = 1; step <= throughStep; step += 1) issues.push(...validateProductWizardStep(draft, step));
  return issues;
};
