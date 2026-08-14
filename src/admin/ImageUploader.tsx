import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { getAdminToken } from './adminAuth';
import { AdminNoticeDialog, type AdminNotice } from './AdminNoticeDialog';

interface ImageUploaderProps {
  images: { url: string; id: string; publicId?: string }[];
  onImagesChange: (images: { url: string; id: string; publicId?: string }[]) => void;
  maxImages?: number;
}

const fileToDataUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read image.'));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

const readUploadResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return {
    error: response.ok ? '' : text || 'Image upload failed.',
  };
};

export const ImageUploader = ({ images, onImagesChange, maxImages = 1 }: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const canUploadMore = images.length < maxImages;

  const showUploadError = (message: string) => setNotice({
    kind: 'error',
    title: 'Image needs attention',
    message: 'The image was not uploaded.',
    issues: [message],
  });

  const handleUpload = async (file: File) => {
    if (!canUploadMore) {
      showUploadError(`You can upload up to ${maxImages} image${maxImages === 1 ? '' : 's'} here.`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      showUploadError('Please upload a PNG, JPEG or WebP image file.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showUploadError('Please upload an image smaller than 8MB.');
      return;
    }

    setIsUploading(true);
    try {
      const token = getAdminToken();
      const fileDataUrl = await fileToDataUrl(file);
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ file: fileDataUrl }),
      });
      const data = await readUploadResponse(response);
      if (!response.ok) throw new Error(data.details || data.error || 'Image upload failed.');
      const nextImage = { url: data.imageUrl, publicId: data.publicId, id: crypto.randomUUID() };
      onImagesChange(maxImages === 1 ? [nextImage] : [...images, nextImage]);
    } catch (error) {
      console.error('Upload failed', error);
      showUploadError((error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]);
  };

  const removeImage = (id: string) => onImagesChange(images.filter((img) => img.id !== id));

  return (
    <>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Product Image</label>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {images.map((img, idx) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              <img src={img.url} alt="" className="h-full w-full object-contain p-2" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <button type="button" onClick={(e) => { e.preventDefault(); removeImage(img.id); }} className="rounded-full bg-red-500 p-1.5 text-white transition-colors hover:bg-red-600"><X className="h-4 w-4" /></button>
              </div>
              {idx === 0 && <div className="absolute left-2 top-2 rounded border border-gray-200 bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-900">Primary</div>}
            </div>
          ))}
          {canUploadMore && (
            <label className={`relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${dragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-300 bg-gray-50/50 hover:border-gray-400'}`} onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop}>
              <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={(e) => { if (e.target.files && e.target.files[0]) handleUpload(e.target.files[0]); e.currentTarget.value = ''; }} />
              {isUploading ? <div className="animate-pulse text-sm font-medium text-gray-400">Uploading...</div> : <><Upload className="mb-2 h-6 w-6 text-gray-400" /><span className="px-4 text-center text-xs font-medium text-gray-500">Upload Product Image</span></>}
            </label>
          )}
        </div>
        <p className="text-xs text-gray-400">Images are uploaded to Cloudinary and saved to the product record. Max {maxImages} image{maxImages === 1 ? '' : 's'}.</p>
      </div>
      {notice && <AdminNoticeDialog notice={notice} onClose={() => setNotice(null)} />}
    </>
  );
};
