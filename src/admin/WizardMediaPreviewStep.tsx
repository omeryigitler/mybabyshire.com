import React, { useState } from 'react';
import { Upload, Wand2, X } from 'lucide-react';
import type { ProductWizardImage } from './productWizardDraft';

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read image.'));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

export const WizardMediaPreviewStep = ({ images, onImagesChange }: { images: ProductWizardImage[]; onImagesChange: (images: ProductWizardImage[]) => void }) => {
  const [mode, setMode] = useState<'original' | 'clean'>('original');

  const choose = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = await fileToDataUrl(file);
    onImagesChange([{ id: crypto.randomUUID(), url }]);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setMode('original')} className={`rounded-[1.3rem] border p-4 text-left ${mode === 'original' ? 'border-boutique-brown bg-[#fff4df]' : 'border-boutique-brown/10 bg-white'}`}><Upload className="mb-2 h-5 w-5" /><span className="block text-sm font-bold">Original</span><span className="mt-1 block text-xs text-boutique-brown-light">Keep the uploaded photo as-is.</span></button>
        <button type="button" onClick={() => setMode('clean')} className={`rounded-[1.3rem] border p-4 text-left ${mode === 'clean' ? 'border-boutique-brown bg-[#fff4df]' : 'border-boutique-brown/10 bg-white'}`}><Wand2 className="mb-2 h-5 w-5" /><span className="block text-sm font-bold">Clean Background</span><span className="mt-1 block text-xs text-boutique-brown-light">Available in the signed-in admin; design preview keeps your local image unchanged.</span></button>
      </div>

      {images[0] ? (
        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-boutique-brown/10 bg-[#fffaf3] p-5">
          <img src={images[0].url} alt="Product preview" className="h-full w-full object-contain" />
          <button type="button" onClick={() => onImagesChange([])} className="absolute right-3 top-3 rounded-full bg-white p-2 shadow"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <label className="mx-auto flex aspect-[4/3] w-full max-w-xl cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-boutique-brown/20 bg-[#fffaf3] hover:border-boutique-brown/35">
          <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={(event) => { if (event.target.files?.[0]) choose(event.target.files[0]); event.currentTarget.value = ''; }} />
          <Upload className="mb-3 h-7 w-7 text-boutique-brown/45" />
          <span className="text-sm font-bold text-boutique-brown">Choose Product Image</span>
          <span className="mt-2 text-xs text-boutique-brown-light">Local design preview only</span>
        </label>
      )}

      <p className="rounded-2xl bg-[#fffaf3] px-4 py-3 text-xs leading-relaxed text-boutique-brown-light">Customer names, dates, colors and other answers are collected only as order information. They are never drawn onto the product photo.</p>
    </div>
  );
};
