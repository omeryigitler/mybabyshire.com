import React, { useRef } from 'react';
import { Crosshair, Image as ImageIcon, Images, Minus, Plus, RotateCcw } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import type { ProductWizardImage } from './productWizardDraft';

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value * 10) / 10));
const clampZoom = (value: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(value * 100) / 100));
const pointerDistance = (left: { x: number; y: number }, right: { x: number; y: number }) => Math.hypot(left.x - right.x, left.y - right.y);

const FocusEditor = ({ image, index, onChange }: { image: ProductWizardImage; index: number; onChange: (image: ProductWizardImage) => void }) => {
  const dragStart = useRef<{ pointerId: number; x: number; y: number; focusX: number; focusY: number } | null>(null);
  const activePointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null);
  const focusX = clampPercent(Number.isFinite(image.focusX) ? Number(image.focusX) : 50);
  const focusY = clampPercent(Number.isFinite(image.focusY) ? Number(image.focusY) : 50);
  const zoom = clampZoom(Number.isFinite(image.zoom) ? Number(image.zoom) : 1);

  const updateZoom = (nextZoom: number) => onChange({ ...image, zoom: clampZoom(nextZoom) });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.current.size === 1) {
      dragStart.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, focusX, focusY };
      pinchStart.current = null;
      return;
    }

    const points = Array.from(activePointers.current.values());
    if (points.length >= 2) {
      pinchStart.current = { distance: Math.max(pointerDistance(points[0], points[1]), 1), zoom };
      dragStart.current = null;
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(event.pointerId)) return;
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.current.size >= 2 && pinchStart.current) {
      const points = Array.from(activePointers.current.values());
      const distance = pointerDistance(points[0], points[1]);
      updateZoom(pinchStart.current.zoom * (distance / pinchStart.current.distance));
      return;
    }

    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const sensitivity = 1 / Math.max(zoom, 1);
    const deltaX = ((event.clientX - start.x) / Math.max(rect.width, 1)) * 100 * sensitivity;
    const deltaY = ((event.clientY - start.y) / Math.max(rect.height, 1)) * 100 * sensitivity;
    onChange({
      ...image,
      focusX: clampPercent(start.focusX - deltaX),
      focusY: clampPercent(start.focusY - deltaY),
      zoom,
    });
  };

  const stopPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    activePointers.current.delete(event.pointerId);
    pinchStart.current = null;

    const remaining = Array.from(activePointers.current.entries());
    if (remaining.length === 1) {
      const [pointerId, point] = remaining[0];
      dragStart.current = { pointerId, x: point.x, y: point.y, focusX, focusY };
    } else {
      dragStart.current = null;
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const step = event.deltaY > 0 ? -0.15 : 0.15;
    updateZoom(zoom + step);
  };

  return (
    <div className="rounded-[12px] border border-[#e2e2e2] bg-[#fafafa] p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#202020]">{index === 0 ? 'Primary card crop' : 'Hover card crop'}</p>
          <p className="mt-0.5 text-xs text-[#777]">Drag to position. Use the slider, mouse wheel or two fingers to zoom.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...image, focusX: 50, focusY: 50, zoom: 1 })}
          className="commerce-focus inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] border border-[#dedede] bg-white px-3 text-xs font-semibold text-[#555] hover:border-[#bbb]"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      <div
        className="relative mx-auto aspect-[4/5] w-full max-w-[360px] touch-none cursor-grab overflow-hidden rounded-[10px] border border-[#d8d8d8] bg-white active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopPointer}
        onPointerCancel={stopPointer}
        onWheel={handleWheel}
      >
        <img
          src={image.url}
          alt=""
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-cover will-change-transform"
          style={{ objectPosition: `${focusX}% ${focusY}%`, transform: `scale(${zoom})`, transformOrigin: 'center' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_49.7%,rgba(255,255,255,.72)_50%,transparent_50.3%),linear-gradient(to_bottom,transparent_49.7%,rgba(255,255,255,.72)_50%,transparent_50.3%)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/20 shadow-[0_0_0_1px_rgba(0,0,0,.22)]">
          <Crosshair className="h-5 w-5 text-white drop-shadow" />
        </div>
      </div>

      <div className="mt-4 rounded-[10px] border border-[#e4e4e4] bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor={`image-zoom-${image.id}`} className="text-xs font-semibold text-[#555]">Zoom</label>
          <span className="text-xs font-semibold tabular-nums text-[#202020]">{zoom.toFixed(2)}×</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Zoom out" disabled={zoom <= MIN_ZOOM} onClick={() => updateZoom(zoom - 0.25)} className="commerce-focus inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#dedede] bg-white text-[#555] hover:border-[#bbb] disabled:cursor-not-allowed disabled:opacity-35"><Minus className="h-4 w-4" /></button>
          <input
            id={`image-zoom-${image.id}`}
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step="0.05"
            value={zoom}
            onChange={(event) => updateZoom(Number(event.target.value))}
            className="w-full accent-[#202020]"
          />
          <button type="button" aria-label="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={() => updateZoom(zoom + 0.25)} className="commerce-focus inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#dedede] bg-white text-[#555] hover:border-[#bbb] disabled:cursor-not-allowed disabled:opacity-35"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-[#999]"><span>1×</span><span>5×</span></div>
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
          <p className="mt-2 text-xs leading-5 text-[#777]">The first image fills collection cards edge to edge. Position and zoom the photo below to isolate the product.</p>
        </div>
        <div className="rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] p-4">
          <div className="flex items-center gap-2"><Images className="h-4 w-4 text-[#666]" /><p className="text-sm font-semibold">Hover image</p></div>
          <p className="mt-2 text-xs leading-5 text-[#777]">An optional second image appears on hover and keeps its own crop and zoom.</p>
        </div>
      </div>

      <ImageUploader images={images} onImagesChange={(nextImages) => onImagesChange(nextImages.slice(0, 2))} maxImages={2} />

      {images.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {images.slice(0, 2).map((image, index) => <FocusEditor key={image.id} image={image} index={index} onChange={updateImage} />)}
        </div>
      )}

      <p className="text-xs leading-5 text-[#777]">The target marks the center of the storefront card. Zoom in, drag the subject under the target, then save the product. Existing images default to centered at 1×.</p>
    </div>
  );
};
