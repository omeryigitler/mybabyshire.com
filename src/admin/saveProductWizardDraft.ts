import { getAdminToken } from './adminAuth';
import type { ProductWizardDraft } from './productWizardDraft';
import { buildCardColorVariants, encodeCardDesign } from '../utils/cardDesign';

export const saveProductWizardDraft = async (draft: ProductWizardDraft) => {
  const bgImage = encodeCardDesign({ cloud: draft.cloudShape, panel: draft.panelShape, color: draft.cardColor });
  const cloudVariants = buildCardColorVariants(draft.cloudShape, draft.panelShape);
  const token = getAdminToken();

  const response = await fetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: draft.name.trim(), description: draft.description.trim(), price: Number(draft.price), salePrice: draft.salePrice ? Number(draft.salePrice) : null,
      imageUrl: draft.images[0]?.url, publicId: draft.images[0]?.publicId, bgImage,
      cloudVariants: draft.createCloudVariants ? cloudVariants : undefined,
      sku: draft.sku.trim(), stockQuantity: Number(draft.stockQuantity) || 0, categoryId: draft.categoryId || null, status: 'draft',
      featured: draft.promotionBadge === 'featured', newArrival: true, bestseller: draft.promotionBadge === 'bestseller',
      ageRange: draft.ageRange.trim(), material: draft.material.trim(), careInstructions: draft.careInstructions.trim(), preparationTime: draft.preparationTime.trim(),
      personalizationRequired: draft.personalizationRequired, personalizationFields: draft.personalizationRequired ? draft.personalizationFields : [],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.details || data.error || 'Product save failed.');

  const savedProducts = Array.isArray(data.products) ? data.products : [data.primaryProduct || data];
  const images = draft.images.slice(0, 2);

  await Promise.all(savedProducts.filter((product: any) => product?.id).map(async (product: any) => {
    const mediaResponse = await fetch(`/api/admin/product-images?productId=${encodeURIComponent(product.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: product.id, images }),
    });
    const mediaData = await mediaResponse.json();
    if (!mediaResponse.ok) throw new Error(mediaData.details || mediaData.error || `Product saved, but media could not be synchronized for ${product.name || 'the product'}.`);
  }));

  return savedProducts;
};
