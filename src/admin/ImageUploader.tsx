import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { getAdminToken } from './adminAuth';

interface ImageUploaderProps {
  images: { url: string; id: string; publicId?: string }[];
  onImagesChange: (images: { url: string; id: string; publicId?: string }[]) => void;
}

const fileToDataUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Could not read image.'));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

export const ImageUploader = ({ images, onImagesChange }: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [cleanImage, setCleanImage] = useState(false);

  const handleUpload = async (file: File) => {
    setIsUploading(true);

    try {
      const token = getAdminToken();
      const fileDataUrl = await fileToDataUrl(file);
      const endpoint = cleanImage ? '/api/admin/remove-bg-upload' : '/api/admin/upload-image';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file: fileDataUrl,
          folder: 'little-wonders/products',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Image upload failed.');
      }

      onImagesChange([
        ...images,
        {
          url: data.imageUrl,
          publicId: data.publicId,
          id: crypto.randomUUID(),
        },
      ]);
    } catch (error) {
      console.error('Upload failed', error);
      alert((error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const removeImage = (id: string) => {
    onImagesChange(images.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <label className="block text-sm font-medium text-gray-700">Product Images</label>
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
          <input
            type="checkbox"
            checked={cleanImage}
            onChange={(e) => setCleanImage(e.target.checked)}
            className="rounded border-gray-300"
          />
          Clean image before upload
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((img, idx) => (
          <div key={img.id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
             <img src={img.url} alt="" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <button
                 onClick={(e) => { e.preventDefault(); removeImage(img.id); }}
                 className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
               >
                 <X className="w-4 h-4" />
               </button>
             </div>
             {idx === 0 && (
               <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-gray-900 border border-gray-200">
                 Primary
               </div>
             )}
          </div>
        ))}

        <label
          className={`relative aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${dragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
            if (e.target.files && e.target.files[0]) handleUpload(e.target.files[0]);
            e.currentTarget.value = '';
          }} />
          {isUploading ? (
            <div className="text-gray-400 text-sm font-medium animate-pulse">Uploading...</div>
          ) : (
            <>
               <Upload className="w-6 h-6 text-gray-400 mb-2" />
               <span className="text-xs text-gray-500 font-medium text-center px-4">
                 {cleanImage ? 'Clean Upload' : 'Normal Upload'}
               </span>
            </>
          )}
        </label>
      </div>

      <p className="text-xs text-gray-400">
        Normal upload uses Cloudinary. Clean upload processes the image first, then uploads it to Cloudinary.
      </p>
    </div>
  );
};
