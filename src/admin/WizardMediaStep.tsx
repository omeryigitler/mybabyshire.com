import React, { useState } from 'react';
import { Upload, Wand2 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { WizardCleanUploader } from './WizardCleanUploader';
import type { ProductWizardImage } from './productWizardDraft';

export const WizardMediaStep = ({ images, onImagesChange }: { images: ProductWizardImage[]; onImagesChange: (images: ProductWizardImage[]) => void }) => {
  const [clean, setClean] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setClean(false)} className={`rounded-[1.3rem] border p-4 text-left ${!clean ? 'border-boutique-brown bg-[#fff4df]' : 'border-boutique-brown/10 bg-white'}`}><Upload className="mb-2 h-5 w-5 text-boutique-brown" /><span className="block text-sm font-bold text-boutique-brown">Original</span><span className="mt-1 block text-xs text-boutique-brown-light">Keep the uploaded photo as-is.</span></button>
        <button type="button" onClick={() => setClean(true)} className={`rounded-[1.3rem] border p-4 text-left ${clean ? 'border-boutique-brown bg-[#fff4df]' : 'border-boutique-brown/10 bg-white'}`}><Wand2 className="mb-2 h-5 w-5 text-boutique-brown" /><span className="block text-sm font-bold text-boutique-brown">Clean Background</span><span className="mt-1 block text-xs text-boutique-brown-light">Remove the background before the image is stored.</span></button>
      </div>

      {clean ? <WizardCleanUploader onUploaded={(image) => onImagesChange([image])} /> : <ImageUploader images={images} onImagesChange={onImagesChange} maxImages={1} />}

      {clean && images[0] && <div className="mx-auto max-w-sm rounded-[1.3rem] border border-boutique-brown/10 bg-white p-3"><img src={images[0].url} alt="Cleaned product" className="aspect-square w-full object-contain" /><button type="button" onClick={() => onImagesChange([])} className="mt-3 w-full rounded-full border border-boutique-brown/10 px-4 py-2 text-xs font-bold text-boutique-brown">Replace image</button></div>}

      <p className="rounded-2xl bg-[#fffaf3] px-4 py-3 text-xs leading-relaxed text-boutique-brown-light">The product photo stays exactly as uploaded or cleaned. Customer names and other made-for-you answers are collected separately and are not drawn onto the photo.</p>
    </div>
  );
};
