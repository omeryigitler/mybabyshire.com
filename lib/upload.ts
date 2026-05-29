export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;
export const CLOUDINARY_PRODUCT_FOLDER = 'little-wonders/products';

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export class UploadValidationError extends Error {
  statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'UploadValidationError';
  }
}

export const isUploadValidationError = (error: unknown): error is UploadValidationError =>
  error instanceof UploadValidationError;

export const parseImageDataUrl = (file: unknown) => {
  if (!file || typeof file !== 'string') {
    throw new UploadValidationError('Missing image file.');
  }

  const match = file.match(/^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) {
    throw new UploadValidationError('Upload must be a PNG, JPEG, or WebP data URL.');
  }

  const mimeType = match[1].toLowerCase().replace('image/jpg', 'image/jpeg');
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new UploadValidationError('Only PNG, JPEG, and WebP images are allowed.');
  }

  const base64Data = match[2].replace(/\s/g, '');
  const buffer = Buffer.from(base64Data, 'base64');

  if (!buffer.length) {
    throw new UploadValidationError('Uploaded image is empty.');
  }

  if (buffer.length > MAX_IMAGE_UPLOAD_BYTES) {
    throw new UploadValidationError('Image must be 8 MB or smaller.');
  }

  return {
    dataUrl: `data:${mimeType};base64,${base64Data}`,
    base64Data,
    buffer,
    mimeType,
  };
};
