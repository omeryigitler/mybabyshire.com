import { DEFAULT_CARD_DESIGN, type CardCloudShapeId, type CardColorId, type CardPanelShapeId } from '../utils/cardDesign';
import { DEFAULT_PRODUCT_FIELDS, type PersonalizationBuilderField } from './PersonalizationFieldBuilder';

export type ProductWizardImage = { url: string; id: string; publicId?: string };
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
  createCloudVariants: false, personalizationRequired: true,
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
