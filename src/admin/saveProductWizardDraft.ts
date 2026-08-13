import { getAdminToken } from './adminAuth';
import type { ProductWizardDraft } from './productWizardDraft';
import { buildCardColorVariants, encodeCardDesign } from '../utils/cardDesign';

export const saveProductWizardDraft = async (draft: ProductWizardDraft) => {
  const bgImage = encodeCardDesign({ cloud: draft.cloudShape, panel: draft.panelShape, color: draft.cardColor });
  const cloudVariants = buildCardColorVariants(draft.cloudShape, draft.panelShape);

  const response = await fetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
    body: JSON.stringify({
      name: draft.name.trim(), description: draft.description.trim(), price: Number(draft.price), salePrice: draft.salePrice ? Number(draft.salePrice) : null,
      imageUrl: draft.images[0]?.url, publicId: draft.images[0]?.publicId, bgImage,
      cloudVariants: draft.createCloudVariants ? cloudVariants : undefined,
      sku: draft.sku.trim(), stockQuantity: Number(draft.stockQuantity) || 0, categoryId: draft.categoryId || null, status: draft.status,
      featured: draft.promotionBadge === 'featured', newArrival: draft.promotionBadge === 'newArrival', bestseller: draft.promotionBadge === 'bestseller',
      ageRange: draft.ageRange.trim(), material: draft.material.trim(), careInstructions: draft.careInstructions.trim(), preparationTime: draft.preparationTime.trim(),
      personalizationRequired: draft.personalizationRequired, personalizationFields: draft.personalizationRequired ? draft.personalizationFields : [],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.details || data.error || 'Product save failed.');
  return Array.isArray(data.products) ? data.products : [data.primaryProduct || data];
};
