import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Images, Minus, Plus, RotateCcw } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import type { ProductWizardImage } from './productWizardDraft';

const TARGET_RATIO = 4 / 5;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

type Crop = { x: number; y: number; width: number; height: number };
type Handle = 'nw' | 'ne' | 'sw' | 'se';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value * 100) / 100;

const getMaxCrop = (imageRatio: number): Crop => {
  const safeRatio = imageRatio > 0 ? imageRatio : TARGET_RATIO;
  if (safeRatio >= TARGET_RATIO) {
    const width = (TARGET_RATIO / safeRatio) * 100;
    return { x: (100 - width) / 2, y: 0, width, height: 100 };
  }
  const height = (safeRatio / TARGET_RATIO) * 100;
  return { x: 0, y: (100 - height) / 2, width: 100, height };
};

const getSavedCrop = (image: ProductWizardImage): Crop | null => {
  const x = Number(image.cropX);
  const y = Number(image.cropY);
  const width = Number(image.cropWidth);
  const height = Number(image.cropHeight);
  if (![x, y, width, height].every(Number.isFinite)) return null;
  if (width <= 0 || height <= 0 || x < 0 || y < 0 || x + width > 100.1 || y + height > 100.1) return null;
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100), width: clamp(width, 0.1, 100), height: clamp(height, 0.1, 100) };
};

const CropEditor = ({ image, index, onChange }: { image: ProductWizardImage; index: number; onChange: (image: ProductWizardImage) => void }) => {
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const initialized = useRef(false);
  const dragState = useRef<null | { pointerId: number; startX: number; startY: number; crop: Crop }>(null);
  const resizeState = useRef<null | { pointerId: number; handle: Handle; crop: Crop }>(null);
  const activePointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchState = useRef<null | { distance: number; zoom: number }>(null);

  const imageRatio = naturalSize.width && naturalSize.height ? naturalSize.width / naturalSize.height : TARGET_RATIO;
  const maxCrop = getMaxCrop(imageRatio);
  const fallbackZoom = clamp(Number(image.zoom) || 1, MIN_ZOOM, MAX_ZOOM);
  const fallbackWidth = maxCrop.width / fallbackZoom;
  const fallbackHeight = maxCrop.height / fallbackZoom;
  const fallbackCenterX = clamp(Number(image.focusX) || 50, 0, 100);
  const fallbackCenterY = clamp(Number(image.focusY) || 50, 0, 100);
  const fallbackCrop: Crop = {
    x: clamp(fallbackCenterX - fallbackWidth / 2, 0, 100 - fallbackWidth),
    y: clamp(fallbackCenterY - fallbackHeight / 2, 0, 100 - fallbackHeight),
    width: fallbackWidth,
    height: fallbackHeight,
  };
  const crop = getSavedCrop(image) || fallbackCrop;
  const zoom = clamp(maxCrop.width / Math.max(crop.width, 0.01), MIN_ZOOM, MAX_ZOOM);

  const applyCrop = (nextCrop: Crop) => {
    const normalized: Crop = {
      x: round(clamp(nextCrop.x, 0, 100 - nextCrop.width)),
      y: round(clamp(nextCrop.y, 0, 100 - nextCrop.height)),
      width: round(nextCrop.width),
      height: round(nextCrop.height),
    };
    const nextZoom = clamp(maxCrop.width / Math.max(normalized.width, 0.01), MIN_ZOOM, MAX_ZOOM);
    onChange({
      ...image,
      cropX: normalized.x,
      cropY: normalized.y,
      cropWidth: normalized.width,
      cropHeight: normalized.height,
      focusX: round(normalized.x + normalized.width / 2),
      focusY: round(normalized.y + normalized.height / 2),
      zoom: round(nextZoom),
    });
  };

  const setZoom = (nextZoomValue: number) => {
    const nextZoom = clamp(nextZoomValue, MIN_ZOOM, MAX_ZOOM);
    const centerX = crop.x + crop.width / 2;
    const centerY = crop.y + crop.height / 2;
    const width = maxCrop.width / nextZoom;
    const height = maxCrop.height / nextZoom;
    applyCrop({
      x: clamp(centerX - width / 2, 0, 100 - width),
      y: clamp(centerY - height / 2, 0, 100 - height),
      width,
      height,
    });
  };

  const resetCrop = () => applyCrop(maxCrop);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const element = event.currentTarget;
    setNaturalSize({ width: element.naturalWidth, height: element.naturalHeight });
    if (!initialized.current && !getSavedCrop(image)) {
      initialized.current = true;
      const ratio = element.naturalWidth / Math.max(element.naturalHeight, 1);
      const initialMax = getMaxCrop(ratio);
      const initialZoom = clamp(Number(image.zoom) || 1, MIN_ZOOM, MAX_ZOOM);
      const width = initialMax.width / initialZoom;
      const height = initialMax.height / initialZoom;
      const centerX = clamp(Number(image.focusX) || 50, 0, 100);
      const centerY = clamp(Number(image.focusY) || 50, 0, 100);
      applyCrop({
        x: clamp(centerX - width / 2, 0, 100 - width),
        y: clamp(centerY - height / 2, 0, 100 - height),
        width,
        height,
      });
    }
  };

  const handleCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const frame = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!frame) return;
    dragState.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, crop };
  };

  const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const frame = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!frame) return;
    const dx = ((event.clientX - state.startX) / Math.max(frame.width, 1)) * 100;
    const dy = ((event.clientY - state.startY) / Math.max(frame.height, 1)) * 100;
    applyCrop({ ...state.crop, x: clamp(state.crop.x + dx, 0, 100 - state.crop.width), y: clamp(state.crop.y + dy, 0, 100 - state.crop.height) });
  };

  const stopCropDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragState.current = null;
  };

  const startResize = (handle: Handle) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeState.current = { pointerId: event.pointerId, handle, crop };
  };

  const moveResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    const state = resizeState.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const frame = event.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
    if (!frame) return;
    const pointerX = clamp(((event.clientX - frame.left) / Math.max(frame.width, 1)) * 100, 0, 100);
    const pointerY = clamp(((event.clientY - frame.top) / Math.max(frame.height, 1)) * 100, 0, 100);
    const ratioPct = maxCrop.height / Math.max(maxCrop.width, 0.01);
    const minWidth = maxCrop.width / MAX_ZOOM;
    const right = state.crop.x + state.crop.width;
    const bottom = state.crop.y + state.crop.height;
    const leftHandle = state.handle === 'nw' || state.handle === 'sw';
    const topHandle = state.handle === 'nw' || state.handle === 'ne';
    const anchorX = leftHandle ? right : state.crop.x;
    const anchorY = topHandle ? bottom : state.crop.y;
    const widthFromX = leftHandle ? anchorX - pointerX : pointerX - anchorX;
    const heightFromY = topHandle ? anchorY - pointerY : pointerY - anchorY;
    const widthFromY = heightFromY / Math.max(ratioPct, 0.01);
    const availableWidth = leftHandle ? anchorX : 100 - anchorX;
    const availableHeight = topHandle ? anchorY : 100 - anchorY;
    const maxWidthHere = Math.min(maxCrop.width, availableWidth, availableHeight / Math.max(ratioPct, 0.01));
    const width = clamp(Math.min(widthFromX, widthFromY), Math.min(minWidth, maxWidthHere), maxWidthHere);
    const height = width * ratioPct;
    applyCrop({ x: leftHandle ? anchorX - width : anchorX, y: topHandle ? anchorY - height : anchorY, width, height });
  };

  const stopResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    resizeState.current = null;
  };

  const pointerDistance = (points: { x: number; y: number }[]) => points.length >= 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0;

  const handleFramePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.current.size >= 2) {
      const points = Array.from(activePointers.current.values());
      pinchState.current = { distance: Math.max(pointerDistance(points), 1), zoom };
    }
  };

  const handleFramePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(event.pointerId)) return;
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.current.size >= 2 && pinchState.current) {
      const points = Array.from(activePointers.current.values());
      setZoom(pinchState.current.zoom * (pointerDistance(points) / pinchState.current.distance));
    }
  };

  const stopFramePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(event.pointerId);
    if (activePointers.current.size < 2) pinchState.current = null;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoom(zoom + (event.deltaY > 0 ? -0.2 : 0.2));
  };

  const handles: { id: Handle; className: string }[] = [
    { id: 'nw', className: '-left-2 -top-2 cursor-nwse-resize' },
    { id: 'ne', className: '-right-2 -top-2 cursor-nesw-resize' },
    { id: 'sw', className: '-bottom-2 -left-2 cursor-nesw-resize' },
    { id: 'se', className: '-bottom-2 -right-2 cursor-nwse-resize' },
  ];

  return (
    <div className="rounded-[12px] border border-[#e2e2e2] bg-[#fafafa] p-3 sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#202020]">{index === 0 ? 'Primary card crop' : 'Hover card crop'}</p>
          <p className="mt-0.5 text-xs leading-5 text-[#777]">Move and resize the 4:5 frame. Only the area inside the frame will appear on the storefront card.</p>
        </div>
        <button type="button" onClick={resetCrop} className="commerce-focus inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] border border-[#dedede] bg-white px-3 text-xs font-semibold text-[#555] hover:border-[#bbb]">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      <div className="flex justify-center overflow-hidden rounded-[10px] bg-[#ededed] p-2 sm:p-3">
        <div
          className="relative inline-block max-w-full touch-none overflow-hidden rounded-[8px] bg-black/5"
          onPointerDown={handleFramePointerDown}
          onPointerMove={handleFramePointerMove}
          onPointerUp={stopFramePointer}
          onPointerCancel={stopFramePointer}
          onWheel={handleWheel}
        >
          <img src={image.url} alt="" draggable={false} onLoad={handleImageLoad} className="block h-auto max-h-[520px] max-w-full select-none" />
          <div
            className="absolute z-10 cursor-move border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.55),0_0_0_9999px_rgba(0,0,0,.52)]"
            style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }}
            onPointerDown={handleCropPointerDown}
            onPointerMove={handleCropPointerMove}
            onPointerUp={stopCropDrag}
            onPointerCancel={stopCropDrag}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_33%,rgba(255,255,255,.45)_33.33%,transparent_33.66%,transparent_66%,rgba(255,255,255,.45)_66.33%,transparent_66.66%),linear-gradient(to_bottom,transparent_33%,rgba(255,255,255,.45)_33.33%,transparent_33.66%,transparent_66%,rgba(255,255,255,.45)_66.33%,transparent_66.66%)]" />
            {handles.map((handle) => (
              <button
                key={handle.id}
                type="button"
                aria-label={`Resize crop ${handle.id}`}
                className={`absolute h-5 w-5 rounded-full border-2 border-white bg-[#202020] shadow-sm ${handle.className}`}
                onPointerDown={startResize(handle.id)}
                onPointerMove={moveResize}
                onPointerUp={stopResize}
                onPointerCancel={stopResize}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[10px] border border-[#e4e4e4] bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor={`crop-zoom-${image.id}`} className="text-xs font-semibold text-[#555]">Crop zoom</label>
          <span className="text-xs font-semibold tabular-nums text-[#202020]">{zoom.toFixed(2)}×</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Zoom out" disabled={zoom <= MIN_ZOOM} onClick={() => setZoom(zoom - 0.25)} className="commerce-focus inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#dedede] bg-white text-[#555] hover:border-[#bbb] disabled:cursor-not-allowed disabled:opacity-35"><Minus className="h-4 w-4" /></button>
          <input id={`crop-zoom-${image.id}`} type="range" min={MIN_ZOOM} max={MAX_ZOOM} step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-full accent-[#202020]" />
          <button type="button" aria-label="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={() => setZoom(zoom + 0.25)} className="commerce-focus inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#dedede] bg-white text-[#555] hover:border-[#bbb] disabled:cursor-not-allowed disabled:opacity-35"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-[#999]"><span>Show more</span><span>Crop tighter</span></div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#777]">
        <span>Selected area {Math.round(crop.width)}% × {Math.round(crop.height)}%</span>
        <span>4:5 storefront ratio</span>
      </div>
    </div>
  );
};

export const WizardMediaStep = ({ images, onImagesChange }: { images: ProductWizardImage[]; onImagesChange: (images: ProductWizardImage[]) => void }) => {
  const updateImage = (nextImage: ProductWizardImage) => onImagesChange(images.map((image) => image.id === nextImage.id ? nextImage : image));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] p-4">
          <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-[#666]" /><p className="text-sm font-semibold">Primary image</p></div>
          <p className="mt-2 text-xs leading-5 text-[#777]">Upload the original photo, then choose the exact 4:5 rectangle that should fill the product card.</p>
        </div>
        <div className="rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] p-4">
          <div className="flex items-center gap-2"><Images className="h-4 w-4 text-[#666]" /><p className="text-sm font-semibold">Hover image</p></div>
          <p className="mt-2 text-xs leading-5 text-[#777]">The optional second image gets its own independent crop selection.</p>
        </div>
      </div>

      <ImageUploader images={images} onImagesChange={(nextImages) => onImagesChange(nextImages.slice(0, 2))} maxImages={2} />

      {images.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {images.slice(0, 2).map((image, index) => <CropEditor key={image.id} image={image} index={index} onChange={updateImage} />)}
        </div>
      )}

      <p className="text-xs leading-5 text-[#777]">Everything outside the white frame is excluded from the card. Drag the frame to the subject, resize from a corner or use Crop zoom, then save the product.</p>
    </div>
  );
};
