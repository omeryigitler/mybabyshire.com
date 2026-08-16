import React from 'react';
import { Image as ImageIcon, Images } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import type { ProductWizardImage } from './productWizardDraft';

export const WizardMediaStep = ({ images, onImagesChange }: { images: ProductWizardImage[]; onImagesChange: (images: ProductWizardImage[]) => void }) => (
  <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] p-4">
        <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-[#666]" /><p className="text-sm font-semibold">Primary image</p></div>
        <p className="mt-2 text-xs leading-5 text-[#777]">The first image is used across collection cards, search results and the main product view.</p>
      </div>
      <div className="rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] p-4">
        <div className="flex items-center gap-2"><Images className="h-4 w-4 text-[#666]" /><p className="text-sm font-semibold">Hover image</p></div>
        <p className="mt-2 text-xs leading-5 text-[#777]">An optional second image appears when a customer hovers a product card on pointer-based devices.</p>
      </div>
    </div>

    <ImageUploader images={images} onImagesChange={(nextImages) => onImagesChange(nextImages.slice(0, 2))} maxImages={2} />

    <p className="text-xs leading-5 text-[#777]">Use clean product photography with consistent framing. On touch devices the primary image remains the default card image.</p>
  </div>
);
