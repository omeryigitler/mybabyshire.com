import React, { useRef } from 'react';
import { Crosshair, Image as ImageIcon, Images, RotateCcw } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import type { ProductWizardImage } from './productWizardDraft';

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value * 10) / 10));

const FocusEditor = ({ image, index, onChange }: { image: ProductWizardImage; index: number; onChange: (image: ProductWizardImage) => void }) => {
  const dragStart = useRef<{ pointerId: number; x: number; y: number; focusX: number; focusY: number } | null>(null);
  const focusX = clampPercent(Number.isFinite(image.focusX) ? Number(image.focusX) : 50);
  const focusY = clampPercent(Number.isFinite(image.focusY) ? Number(image.focusY) : 50);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, focusX, focusY };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const deltaX = ((event.clientX - start.x) / Math.max(rect.width, 1)) * 100;
    const deltaY = ((event.clientY - start.y) / Math.max(rect.height, 1)) * 100;
    onChange({
      ...image,
      focusX: clampPercent(start.focusX - deltaX),
      focusY: clampPercent(start.focusY - deltaY),
    });
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragStart.current = null;
  };

  return (
    <div className="rounded-[12px] border border-[#e2e2e2] bg-[#fafafa] p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#202020]">{index === 0 ? 'Primary card crop' : 'Hover card crop'}</p>
          <p className="mt-0.5 text-xs text-[#777]">Drag the photo until the product sits under the center target.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...image, focusX: 50, focusY: 50 })}
          className="commerce-focus inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] border border-[#dedede] bg-white px-3 text-xs font-semibold text-[#555] hover:border-[#bbb]"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Center
        </button>
      </div>

      <div
        className="relative mx-auto aspect-[4/5] w-full max-w-[360px] touch-none cursor-grab overflow-hidden rounded-[10px] border border-[#d8d8d8] bg-white active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <img
          src={image.url}
          alt=""
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-cover"
          style={{ objectPosition: `${focusX}% ${focusY}%` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_49.7%,rgba(255,255,255,.72)_50%,transparent_50.3%),linear-gradient(to_bottom,transparent_49.7%,rgba(255,255,255,.72)_50%,transparent_50.3%)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/20 shadow-[0_0_0_1px_rgba(0,0,0,.22)]">
          <Crosshair className="h-5 w-5 text-white drop-shadow" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-[#777]">
        <span>Focus X {Math.round(focusX)}%</span>
        <span>Focus Y {Math.round(focusY)}%</span>
      </div>
    </div>
  );
};

export const WizardMediaStep = ({ images, onImagesChange }: { images: ProductWizardImage[]; onImagesChange: (images: ProductWizardImage[]) => void }) => {
  const updateImage = (nextImage: ProductWizardImage) => {
    onImagesChange(images.map((image) => image.id === nextImage.id ? nextImage : image));
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] p-4">
          <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-[#666]" /><p className="text-sm font-semibold">Primary image</p></div>
          <p className="mt-2 text-xs leading-5 text-[#777]">The first image fills collection cards edge to edge. Use the crop control below to keep the product centered.</p>
        </div>
        <div className="rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] p-4">
          <div className="flex items-center gap-2"><Images className="h-4 w-4 text-[#666]" /><p className="text-sm font-semibold">Hover image</p></div>
          <p className="mt-2 text-xs leading-5 text-[#777]">An optional second image appears on hover and can have its own focal point.</p>
        </div>
      </div>

      <ImageUploader images={images} onImagesChange={(nextImages) => onImagesChange(nextImages.slice(0, 2))} maxImages={2} />

      {images.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {images.slice(0, 2).map((image, index) => <FocusEditor key={image.id} image={image} index={index} onChange={updateImage} />)}
        </div>
      )}

      <p className="text-xs leading-5 text-[#777]">The target marks the center of the storefront card. Drag the image, then save the product. Existing images without a saved focal point default to the center.</p>
    </div>
  );
};
