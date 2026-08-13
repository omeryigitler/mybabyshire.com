import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { getAdminToken } from './adminAuth';
import type { ProductWizardImage } from './productWizardDraft';

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read image.'));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

export const WizardCleanUploader = ({ onUploaded }: { onUploaded: (image: ProductWizardImage) => void }) => {
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) return alert('Please upload an image file.');
    if (file.size > 8 * 1024 * 1024) return alert('Please upload an image smaller than 8MB.');
    setBusy(true);
    try {
      const response = await fetch('/api/product-image-upload-clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ file: await fileToDataUrl(file) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Background cleaning failed.');
      onUploaded({ url: data.imageUrl, publicId: data.publicId, id: crypto.randomUUID() });
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <label className="mx-auto flex aspect-[4/3] w-full max-w-xl cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-boutique-brown/20 bg-[#fffaf3] hover:border-boutique-brown/35">
      <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={(event) => { if (event.target.files?.[0]) upload(event.target.files[0]); event.currentTarget.value = ''; }} />
      <Wand2 className="mb-3 h-7 w-7 text-boutique-brown/45" />
      <span className="text-sm font-bold text-boutique-brown">{busy ? 'Cleaning & uploading...' : 'Upload & Clean Background'}</span>
      <span className="mt-2 text-xs text-boutique-brown-light">PNG, JPEG or WebP · max 8MB</span>
    </label>
  );
};
