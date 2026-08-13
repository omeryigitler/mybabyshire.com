import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';
import { requireAdmin } from '../lib/auth.js';
import {
  CLOUDINARY_PRODUCT_FOLDER,
  isUploadValidationError,
  parseImageDataUrl,
} from '../lib/upload.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (dataUrl: string) =>
  cloudinary.uploader.upload(dataUrl, {
    folder: CLOUDINARY_PRODUCT_FOLDER,
    resource_type: 'image',
    transformation: [
      { width: 900, height: 900, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    requireAdmin(req.headers.authorization);
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message });
  }

  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({ error: 'Cloudinary environment variables are missing.' });
    }

    const { file, mode = 'original' } = req.body || {};
    const image = parseImageDataUrl(file);
    let uploadDataUrl = image.dataUrl;

    if (mode === 'clean') {
      if (!process.env.REMOVE_BG_API_KEY) {
        return res.status(500).json({ error: 'Background cleaning is not configured yet.' });
      }

      const formData = new FormData();
      formData.append('size', 'auto');
      formData.append('format', 'png');
      formData.append('image_file', new Blob([image.buffer], { type: image.mimeType }), 'image');

      const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': process.env.REMOVE_BG_API_KEY },
        body: formData,
      });

      if (!removeBgResponse.ok) {
        const details = await removeBgResponse.text();
        console.error('remove.bg failed', details);
        return res.status(removeBgResponse.status).json({ error: 'Background cleaning failed. Please try again.' });
      }

      const cleanedBuffer = Buffer.from(await removeBgResponse.arrayBuffer());
      uploadDataUrl = `data:image/png;base64,${cleanedBuffer.toString('base64')}`;
    }

    const result = await uploadToCloudinary(uploadDataUrl);
    return res.status(200).json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      mode: mode === 'clean' ? 'clean' : 'original',
    });
  } catch (error) {
    if (isUploadValidationError(error)) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error('Product image upload failed', error);
    return res.status(500).json({ error: 'Image upload failed. Please try again.' });
  }
}
